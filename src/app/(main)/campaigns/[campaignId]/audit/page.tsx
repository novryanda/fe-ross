'use client'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/layout/role-guard'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { AuditLogTable } from '@/components/features/audit/audit-log-table'
import { auditLogsApi } from '@/lib/api/audit-logs'
import { campaignsApi } from '@/lib/api/campaigns'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { AUDIT_ACTION_LABELS } from '@/lib/constants'

const ENTITY_TYPES = [
  { value: 'Campaign', label: 'Campaign' },
  { value: 'CampaignMember', label: 'Campaign Member' },
  { value: 'BlastTarget', label: 'Blast Target' },
  { value: 'BlastAttempt', label: 'Blast Attempt' },
  { value: 'BlastReport', label: 'Blast Report' },
  { value: 'CommentCommand', label: 'Comment Command' },
  { value: 'CommentTask', label: 'Comment Task' },
  { value: 'ExportReport', label: 'Export' },
]

export default function CampaignAuditPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  })

  const logsQuery = useQuery({
    queryKey: ['campaign-audit', campaignId, { action, entityType, dateFrom, dateTo }],
    queryFn: () =>
      auditLogsApi.listByCampaign(campaignId, {
        action: action || undefined,
        entityType: entityType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  const filteredLogs = useMemo(() => {
    const logs = logsQuery.data?.data ?? []
    if (!search) return logs
    const needle = search.toLowerCase()
    return logs.filter(
      (log) =>
        log.details?.toLowerCase().includes(needle) ||
        log.actorName?.toLowerCase().includes(needle) ||
        log.action.toLowerCase().includes(needle) ||
        log.target.toLowerCase().includes(needle),
    )
  }, [logsQuery.data, search])

  const actionOptions = useMemo(
    () =>
      Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })),
    [],
  )

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaign} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Audit Trail</div>
            <h2 className="section-title">Campaign Audit</h2>
            <p className="section-subtitle">Aktivitas penting campaign tercatat di sini.</p>
          </div>
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Cari aktor, aksi, atau target..."
          filters={[
            {
              label: 'All Actions',
              value: action,
              options: actionOptions,
              onChange: setAction,
            },
            {
              label: 'All Entity Types',
              value: entityType,
              options: ENTITY_TYPES,
              onChange: setEntityType,
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

        {logsQuery.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
        ) : logsQuery.isError ? (
          <ErrorState
            title="Gagal memuat audit log"
            message={mapApiErrorToToastMessage(logsQuery.error)}
            retry={() => logsQuery.refetch()}
          />
        ) : !filteredLogs.length ? (
          <EmptyState
            icon={<History size={48} />}
            title="Belum ada audit log"
            description="Aktivitas penting campaign akan tercatat di sini."
          />
        ) : (
          <AuditLogTable logs={filteredLogs} />
        )}
      </CampaignShell>
    </RoleGuard>
  )
}
