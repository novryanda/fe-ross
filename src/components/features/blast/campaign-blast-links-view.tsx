'use client'
import { useMemo, useState } from 'react'
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
import type { BlastAttemptStatus, BlastTarget, BlastTargetStatus, Platform } from '@/types'

export function CampaignBlastLinksView({ campaignId }: { campaignId: string }) {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [attemptFilter, setAttemptFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const queryClient = useQueryClient()

  const sortParams = sort === 'oldest'
    ? { sortBy: 'createdAt', sortOrder: 'asc' as const }
    : sort === 'attempts'
      ? { sortBy: 'createdAt', sortOrder: 'desc' as const }
      : { sortBy: 'createdAt', sortOrder: 'desc' as const }

  const { data: targets, isLoading, isError, error } = useQuery({
    queryKey: ['blast-targets', campaignId, { search, platformFilter, statusFilter, sort }],
    queryFn: () => blastApi.listTargets(campaignId, {
      search,
      platform: platformFilter as Platform | '',
      status: statusFilter as BlastTargetStatus | '',
      ...sortParams,
    }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ target, status }: { target: BlastTarget; status: BlastTargetStatus }) =>
      blastApi.updateTargetStatus(campaignId, target.id, status),
    onSuccess: (_target, variables) => {
      toast.success(variables.status === 'ACTIVE' ? 'Blast target kembali active.' : variables.status === 'PAUSED' ? 'Blast target dipause.' : 'Blast target diarchive.')
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const reblastMutation = useMutation({
    mutationFn: (target: BlastTarget) => blastApi.createReblast(campaignId, target.id),
    onSuccess: (attempt) => {
      toast.success(`Reblast attempt #${attempt.attemptNo} dibuat.`)
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['blast-attempts', campaignId] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const stats = useMemo(() => {
    const list = targets ?? []
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
    const query = search.trim().toLowerCase()
    return [...(targets ?? [])]
      .filter(target => {
        const latestStatus = target.latestAttempt?.status
        if (query && !(
          target.socialAccount?.username?.toLowerCase().includes(query) ||
          target.socialAccount?.displayName?.toLowerCase().includes(query) ||
          target.postUrl.toLowerCase().includes(query)
        )) return false
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
  }, [attemptFilter, platformFilter, search, sort, statusFilter, targets])

  return (
    <>
      <div className="section-heading-row">
        <div>
          <div className="section-kicker">Blast Management</div>
          <h2 className="section-title">Campaign Blast Links</h2>
          <p className="section-subtitle">Monitor target posts, current attempts, claims, expiry windows, and reblast needs.</p>
        </div>
      </div>

      <div className="blast-info-banner">
        <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <div>
          <strong>Blast links are open to all campaign Buzzer members.</strong>
          <span> First come, first served. The first Buzzer who clicks Keep locks one BlastAttempt.</span>
        </div>
      </div>

      <div className="blast-metric-grid">
        <BlastMetricCard label="Total Blast Targets" value={formatNumber(targets?.length ?? 0)} sub="Registered target posts" icon={<Target size={22} />} accent="var(--cyan)" />
        <BlastMetricCard label="Available Attempts" value={formatNumber(stats.available)} sub="Ready for Buzzer Keep" icon={<RadioTower size={22} />} accent="var(--status-active)" />
        <BlastMetricCard label="Kept / Claimed" value={formatNumber(stats.kept)} sub="Locked by one Buzzer" icon={<Zap size={22} />} accent="var(--status-kept)" />
        <BlastMetricCard label="Completed Attempts" value={formatNumber(stats.completed)} sub="Reports submitted" icon={<CheckCircle2 size={22} />} accent="var(--status-completed)" />
        <BlastMetricCard label="Expired / Needs Reblast" value={formatNumber(stats.expired + stats.needsReblast)} sub="Review and reopen" icon={<AlertTriangle size={22} />} accent="var(--status-expired)" />
      </div>

      <BlastFilterToolbar
        search={search}
        onSearchChange={setSearch}
        platform={platformFilter}
        onPlatformChange={setPlatformFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        attempt={attemptFilter}
        onAttemptChange={setAttemptFilter}
        sort={sort}
        onSortChange={setSort}
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
          action={isAdmin ? <Link href={`/campaigns/${campaignId}/blast-links/new`} className="btn-primary" style={{ textDecoration: 'none' }}>Add Blast Link</Link> : undefined}
        />
      ) : (
        <BlastLinksTable
          campaignId={campaignId}
          targets={filtered}
          isAdmin={isAdmin}
          actionLoadingId={(statusMutation.variables as { target?: BlastTarget } | undefined)?.target?.id ?? reblastMutation.variables?.id}
          onStatusChange={(target, status) => statusMutation.mutate({ target, status })}
          onReblast={(target) => reblastMutation.mutate(target)}
        />
      )}
    </>
  )
}
