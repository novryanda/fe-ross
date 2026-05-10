'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ReadonlyNotice } from '@/components/ui/readonly-notice'
import { RoleGuard } from '@/components/layout/role-guard'
import { ReportsTable, type ReportsTableItem } from '@/components/features/reports/reports-table'
import { campaignsApi } from '@/lib/api/campaigns'
import { reportsApi, type ReportKind } from '@/lib/api/reports'
import { useAuth } from '@/hooks/use-auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import type { Platform } from '@/types'
import { PLATFORMS } from '@/lib/constants'

const REPORT_KIND_FILTER: { value: ReportKind; label: string }[] = [
  { value: 'ALL', label: 'All Report Types' },
  { value: 'BLAST', label: 'Blast Reports' },
  { value: 'COMMENT', label: 'Comment Proofs' },
]

export default function ReportsPage() {
  const { isViewer } = useAuth()
  const [campaignId, setCampaignId] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [reportKind, setReportKind] = useState<ReportKind>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ['campaigns', { limit: 100 }],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  })

  const selectedCampaignId = campaignId || undefined

  const reportsQuery = useQuery({
    queryKey: ['reports', selectedCampaignId ?? 'all', reportKind, platform, dateFrom, dateTo],
    queryFn: async () => {
      if (selectedCampaignId) {
        return reportsApi.listCampaignReports(
          selectedCampaignId,
          {
            platform: platform || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          reportKind,
        )
      }
      // No campaign selected → aggregate across accessible campaigns.
      const list = campaigns?.data ?? []
      if (!list.length) return { blastReports: [], commentProofs: [] }
      const results = await Promise.all(
        list.map(async (campaign) => {
          try {
            return await reportsApi.listCampaignReports(
              campaign.id,
              {
                platform: platform || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              },
              reportKind,
            )
          } catch {
            return { blastReports: [], commentProofs: [] }
          }
        }),
      )
      return results.reduce(
        (acc, bundle) => {
          acc.blastReports.push(...bundle.blastReports)
          acc.commentProofs.push(...bundle.commentProofs)
          return acc
        },
        { blastReports: [], commentProofs: [] } as { blastReports: typeof results[number]['blastReports']; commentProofs: typeof results[number]['commentProofs'] },
      )
    },
    enabled: !!campaigns,
  })

  const campaignLookup = useMemo(() => {
    const map = new Map<string, string>()
    ;(campaigns?.data ?? []).forEach((c) => map.set(c.id, c.name))
    return map
  }, [campaigns])

  const items = useMemo<ReportsTableItem[]>(() => {
    const bundle = reportsQuery.data
    if (!bundle) return []
    const blast: ReportsTableItem[] = bundle.blastReports.map((report) => ({
      kind: 'BLAST',
      ...report,
      campaignId: report.campaignId,
      campaignName: report.campaignId ? campaignLookup.get(report.campaignId) : undefined,
    }))
    const comment: ReportsTableItem[] = bundle.commentProofs.map((task) => ({
      kind: 'COMMENT',
      ...task,
      campaignId: task.command?.campaignId,
      campaignName: task.command?.campaignId ? campaignLookup.get(task.command.campaignId) : undefined,
    }))
    return [...blast, ...comment].sort((a, b) => {
      const ax = a.kind === 'BLAST' ? a.submittedAt : (a.completedAt ?? a.updatedAt)
      const bx = b.kind === 'BLAST' ? b.submittedAt : (b.completedAt ?? b.updatedAt)
      return new Date(bx ?? 0).getTime() - new Date(ax ?? 0).getTime()
    })
  }, [reportsQuery.data, campaignLookup])

  const filtered = useMemo(() => {
    if (!search) return items
    const needle = search.toLowerCase()
    return items.filter((item) => {
      if (item.kind === 'BLAST') {
        return (
          item.submittedByUser?.name?.toLowerCase().includes(needle) ||
          item.submittedBy?.toLowerCase().includes(needle) ||
          item.proofLink?.toLowerCase().includes(needle) ||
          item.notes?.toLowerCase().includes(needle) ||
          item.campaignName?.toLowerCase().includes(needle)
        )
      }
      return (
        item.keptByUser?.name?.toLowerCase().includes(needle) ||
        item.keptBy?.toLowerCase().includes(needle) ||
        item.proofLink?.toLowerCase().includes(needle) ||
        item.notes?.toLowerCase().includes(needle) ||
        item.campaignName?.toLowerCase().includes(needle)
      )
    })
  }, [items, search])

  return (
    <RoleGuard roles={['ADMIN', 'VIEWER']}>
      <div className="page-container">
        <PageHeader
          title="Reports"
          subtitle="Laporan operasional Blast dan Comment dari semua campaign yang dapat Anda akses."
        />
        {isViewer && <ReadonlyNotice />}

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Cari buzzer, proof, atau campaign..."
          filters={[
            {
              label: 'All Campaigns',
              value: campaignId,
              options: (campaigns?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
              onChange: setCampaignId,
            },
            {
              label: 'All Platforms',
              value: platform,
              options: PLATFORMS.map((p) => ({ value: p.value, label: p.label })),
              onChange: (value) => setPlatform(value as Platform | ''),
            },
            {
              label: 'All Report Types',
              value: reportKind === 'ALL' ? '' : reportKind,
              options: REPORT_KIND_FILTER.filter((o) => o.value !== 'ALL').map((o) => ({ value: o.value, label: o.label })),
              onChange: (value) => setReportKind((value as ReportKind) || 'ALL'),
            },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                className="input-field"
                style={{ width: 'auto' }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Dari tanggal"
              />
              <span className="muted-meta" style={{ fontSize: '0.75rem' }}>→</span>
              <input
                type="date"
                className="input-field"
                style={{ width: 'auto' }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Sampai tanggal"
              />
            </div>
          }
        />

        {reportsQuery.isLoading || isCampaignsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : reportsQuery.isError ? (
          <ErrorState
            title="Gagal memuat reports"
            message={mapApiErrorToToastMessage(reportsQuery.error)}
            retry={() => reportsQuery.refetch()}
          />
        ) : !filtered.length ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="Belum ada report"
            description="Report akan muncul setelah Buzzer submit Blast Report atau menyelesaikan Comment Task."
          />
        ) : (
          <ReportsTable items={filtered} />
        )}
      </div>
    </RoleGuard>
  )
}
