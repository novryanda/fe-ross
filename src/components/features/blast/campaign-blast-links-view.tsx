'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, Info, RadioTower, Target, Zap } from 'lucide-react'
import { blastApi } from '@/lib/api/blast'
import { BlastMetricCard } from '@/components/features/blast/blast-metric-card'
import { BlastFilterToolbar } from '@/components/features/blast/blast-filter-toolbar'
import { BlastLinksTable } from '@/components/features/blast/blast-links-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { formatNumber } from '@/lib/utils'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { BlastAttemptStatus, BlastTarget, BlastTargetStatus, PaginationMeta, Platform } from '@/types'

type BlastTargetsResponse = {
  data: BlastTarget[]
  meta: PaginationMeta
}

function updateBlastTargetStatusInResponse(
  old: BlastTargetsResponse | undefined,
  targetId: string,
  status: BlastTargetStatus,
): BlastTargetsResponse | undefined {
  if (!old) return old

  return {
    ...old,
    data: old.data.map(target =>
      target.id === targetId
        ? { ...target, status, updatedAt: new Date().toISOString() }
        : target,
    ),
  }
}

export function CampaignBlastLinksView({ campaignId }: { campaignId: string }) {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [attemptFilter, setAttemptFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [search])

  const sortParams = sort === 'oldest'
    ? { sortBy: 'createdAt', sortOrder: 'asc' as const }
    : sort === 'attempts'
      ? { sortBy: 'createdAt', sortOrder: 'desc' as const }
      : { sortBy: 'createdAt', sortOrder: 'desc' as const }

  const { data: targetResponse, isLoading, isError, error } = useQuery({
    queryKey: ['blast-targets', campaignId, { search: debouncedSearch, platformFilter, statusFilter, sort, page, limit }],
    queryFn: () => blastApi.listTargets(campaignId, {
      page,
      limit,
      search: debouncedSearch || undefined,
      platform: platformFilter as Platform | '',
      status: statusFilter as BlastTargetStatus | '',
      ...sortParams,
    }),
  })

  const targets = useMemo(() => targetResponse?.data ?? [], [targetResponse?.data])
  const meta = targetResponse?.meta

  const statusMutation = useMutation({
    mutationFn: ({ target, status }: { target: BlastTarget; status: BlastTargetStatus }) =>
      blastApi.updateTargetStatus(campaignId, target.id, status),
    onMutate: async ({ target, status }) => {
      await queryClient.cancelQueries({ queryKey: ['blast-targets', campaignId] })

      const previousLists = queryClient.getQueriesData<BlastTargetsResponse>({
        queryKey: ['blast-targets', campaignId],
      })

      queryClient.setQueriesData<BlastTargetsResponse>(
        { queryKey: ['blast-targets', campaignId] },
        old => updateBlastTargetStatusInResponse(old, target.id, status),
      )

      return { previousLists }
    },
    onError: (err, _variables, context) => {
      context?.previousLists.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous)
      })
      toast.error(mapApiErrorToToastMessage(err))
    },
    onSuccess: (target, variables) => {
      queryClient.setQueriesData<BlastTargetsResponse>(
        { queryKey: ['blast-targets', campaignId] },
        old => updateBlastTargetStatusInResponse(old, target.id, target.status),
      )
      toast.success(variables.status === 'ACTIVE' ? 'Blast target kembali active.' : variables.status === 'PAUSED' ? 'Blast target dipause.' : 'Blast target diarchive.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-dashboard', campaignId] })
    },
  })

  const reblastMutation = useMutation({
    mutationFn: (target: BlastTarget) => blastApi.createReblast(campaignId, target.id),
    onSuccess: (attempt) => {
      toast.success(`Reblast attempt #${attempt.attemptNo} dibuat.`)
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['blast-attempts', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-dashboard', campaignId] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const stats = useMemo(() => {
    const list = targets
    const attempts = list.flatMap(target => target.attempts ?? (target.latestAttempt ? [target.latestAttempt] : []))
    const available = attempts.filter(attempt => attempt.status === 'AVAILABLE').length
    const kept = attempts.filter(attempt => attempt.status === 'KEPT').length
    const completed = attempts.filter(attempt => attempt.status === 'COMPLETED').length
    const expired = attempts.filter(attempt => attempt.status === 'EXPIRED').length
    const needsReblast = list.filter(target => {
      const total = target.totalAttempts ?? target.attempts?.length ?? 0
      const done = target.completedAttempts ?? 0
      return target.status === 'ACTIVE' && total > 0 && done < total
    }).length
    return { available, kept, completed, expired, needsReblast }
  }, [targets])

  const filtered = useMemo(() => {
    return [...targets]
      .filter(target => {
        const latestStatus = target.latestAttempt?.status
        if (platformFilter && target.platform !== platformFilter as Platform) return false
        if (statusFilter && target.status !== statusFilter as BlastTargetStatus) return false
        if (attemptFilter && latestStatus !== attemptFilter as BlastAttemptStatus) return false
        return true
      })
      .sort((a, b) => {
        if (sort === 'completion') return (b.completedAttempts ?? 0) - (a.completedAttempts ?? 0)
        if (sort === 'attempts') return (b.totalAttempts ?? 0) - (a.totalAttempts ?? 0)
        return 0
      })
  }, [attemptFilter, platformFilter, sort, statusFilter, targets])

  const actionLoading = statusMutation.isPending
    ? {
        id: (statusMutation.variables as { target?: BlastTarget } | undefined)?.target?.id ?? '',
        type: 'status' as const,
      }
    : reblastMutation.isPending
      ? {
          id: reblastMutation.variables?.id ?? '',
          type: 'reblast' as const,
        }
      : undefined

  return (
    <>
      <div className="section-heading-row">
        <div>
          <div className="section-kicker">Blast Management</div>
          <h2 className="section-title">Campaign Blast Links</h2>
          <p className="section-subtitle">Monitor target posts, current attempts, claims, expiry windows, and reblast needs.</p>
        </div>
        {isAdmin ? (
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link href={`/campaigns/${campaignId}/blast-links/create`} className="btn-primary" style={{ textDecoration: 'none' }}>
              <Target size={14} /> Add Blast Link
            </Link>
            <Link href={`/campaigns/${campaignId}/blast-links/new`} className="btn-secondary" style={{ textDecoration: 'none' }}>
              From PIC Submission
            </Link>
          </div>
        ) : null}
      </div>

      <div className="blast-info-banner">
        <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <div>
          <strong>Blast links are open to all campaign Buzzer members.</strong>
          <span> First come, first served. The first Buzzer who clicks Keep locks one BlastAttempt.</span>
        </div>
      </div>

      <div className="blast-metric-grid">
        <BlastMetricCard label="Total Blast Targets" value={formatNumber(meta?.total ?? targets.length)} sub="Registered target posts" icon={<Target size={22} />} accent="var(--cyan)" />
        <BlastMetricCard label="Available Attempts" value={formatNumber(stats.available)} sub="Ready for Buzzer Keep" icon={<RadioTower size={22} />} accent="var(--status-active)" />
        <BlastMetricCard label="Kept / Claimed" value={formatNumber(stats.kept)} sub="Locked by one Buzzer" icon={<Zap size={22} />} accent="var(--status-kept)" />
        <BlastMetricCard label="Completed Attempts" value={formatNumber(stats.completed)} sub="Reports submitted" icon={<CheckCircle2 size={22} />} accent="var(--status-completed)" />
        <BlastMetricCard label="Expired / Needs Reblast" value={formatNumber(stats.expired + stats.needsReblast)} sub="Review and reopen" icon={<AlertTriangle size={22} />} accent="var(--status-expired)" />
      </div>

      <BlastFilterToolbar
        search={search}
        onSearchChange={setSearch}
        platform={platformFilter}
        onPlatformChange={(value) => { setPlatformFilter(value); setPage(1) }}
        status={statusFilter}
        onStatusChange={(value) => { setStatusFilter(value); setPage(1) }}
        attempt={attemptFilter}
        onAttemptChange={(value) => { setAttemptFilter(value); setPage(1) }}
        sort={sort}
        onSortChange={(value) => { setSort(value); setPage(1) }}
      />

      {isLoading ? (
        <div className="blast-table-shell" style={{ padding: '1rem' }}>
          <Skeleton height={46} />
          <Skeleton height={58} style={{ marginTop: '0.75rem' }} />
          <Skeleton height={58} style={{ marginTop: '0.75rem' }} />
          <Skeleton height={58} style={{ marginTop: '0.75rem' }} />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Gagal memuat blast links"
          description={mapApiErrorToToastMessage(error)}
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={<Clock3 size={48} />}
          title="Belum ada blast link yang cocok"
          description="Blast link terbuka untuk semua Buzzer yang menjadi member campaign. Tambahkan target post pertama atau ubah filter."
          action={isAdmin ? (
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href={`/campaigns/${campaignId}/blast-links/create`} className="btn-primary" style={{ textDecoration: 'none' }}>
                <Target size={14} /> Add Blast Link
              </Link>
              <Link href={`/campaigns/${campaignId}/blast-links/new`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                From PIC Submission
              </Link>
            </div>
          ) : undefined}
        />
      ) : (
        <BlastLinksTable
          campaignId={campaignId}
          targets={filtered}
          meta={meta}
          pageSize={limit}
          isAdmin={isAdmin}
          actionLoading={actionLoading?.id ? actionLoading : undefined}
          onStatusChange={(target, status) => statusMutation.mutate({ target, status })}
          onReblast={(target) => reblastMutation.mutate(target)}
          onPageChange={setPage}
          onPageSizeChange={(value) => { setLimit(value); setPage(1) }}
        />
      )}
    </>
  )
}
