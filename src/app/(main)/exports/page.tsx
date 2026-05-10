'use client'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ReadonlyNotice } from '@/components/ui/readonly-notice'
import { RoleGuard } from '@/components/layout/role-guard'
import { ExportHistoryTable } from '@/components/features/exports/export-history-table'
import { campaignsApi } from '@/lib/api/campaigns'
import { exportsApi } from '@/lib/api/exports'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { useAuth } from '@/hooks/use-auth'
import type { ExportFormat, ExportRecord, ExportScope, ExportStatus } from '@/types'

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'BLAST_REPORTS', label: 'Blast Reports' },
  { value: 'COMMENT_TASKS', label: 'Comment Tasks' },
  { value: 'FULL', label: 'Full Campaign Report' },
]

const STATUS_OPTIONS: { value: ExportStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

function hasInFlightExport(records: ExportRecord[] | undefined): boolean {
  return Boolean(records?.some((r) => r.status === 'PROCESSING' || r.status === 'PENDING'))
}

export default function ExportsPage() {
  const { isViewer } = useAuth()
  const queryClient = useQueryClient()

  const [campaignId, setCampaignId] = useState('')
  const [format, setFormat] = useState<ExportFormat>('PDF')
  const [scope, setScope] = useState<ExportScope>('FULL')
  const [statusFilter, setStatusFilter] = useState<ExportStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', { limit: 100 }],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  })

  const exportsQuery = useQuery({
    queryKey: ['exports', { statusFilter, dateFrom, dateTo }],
    queryFn: () =>
      exportsApi.list({
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    refetchInterval: (query) => (hasInFlightExport(query.state.data?.data) ? 5000 : false),
  })

  const exports = exportsQuery.data?.data ?? []

  const createMutation = useMutation({
    mutationFn: () => {
      if (!campaignId) throw new Error('Campaign belum dipilih.')
      return exportsApi.create(campaignId, { format, scope })
    },
    onSuccess: (record) => {
      toast.success(`Export ${record.format} diminta.`)
      queryClient.invalidateQueries({ queryKey: ['exports'] })
      queryClient.invalidateQueries({ queryKey: ['exports', record.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const retryMutation = useMutation({
    mutationFn: (record: ExportRecord) =>
      exportsApi.create(record.campaignId, {
        format: record.format,
        scope: record.scope ?? 'FULL',
      }),
    onSuccess: (record) => {
      toast.success('Export di-retry.')
      queryClient.invalidateQueries({ queryKey: ['exports'] })
      queryClient.invalidateQueries({ queryKey: ['exports', record.campaignId] })
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const campaignOptions = useMemo(
    () => (campaigns?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [campaigns],
  )

  return (
    <RoleGuard roles={['ADMIN', 'VIEWER']}>
      <div className="page-container">
        <PageHeader
          title="Exports"
          subtitle="Generate laporan snapshot PDF/Excel dan pantau history export campaign."
        />

        {isViewer && (
          <ReadonlyNotice text="Viewer hanya dapat melihat dan mengunduh export yang sudah selesai." />
        )}

        {!isViewer && (
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div>
              <label className="form-label">Campaign</label>
              <select className="input-field" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">Pilih Campaign</option>
                {campaignOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Format</label>
              <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel</option>
              </select>
            </div>
            <div>
              <label className="form-label">Scope</label>
              <select className="input-field" value={scope} onChange={(e) => setScope(e.target.value as ExportScope)}>
                {SCOPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="primary"
                disabled={!campaignId}
                loading={createMutation.isPending}
                icon={format === 'PDF' ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                onClick={() => createMutation.mutate()}
                style={{ width: '100%' }}
              >
                Generate Report
              </Button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExportStatus | '')}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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

        {exportsQuery.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : exportsQuery.isError ? (
          <ErrorState
            title="Gagal memuat export history"
            message={mapApiErrorToToastMessage(exportsQuery.error)}
            retry={() => exportsQuery.refetch()}
          />
        ) : !exports.length ? (
          <EmptyState
            icon={<Download size={48} />}
            title="Belum ada export"
            description={isViewer ? 'Belum ada export yang tersedia.' : 'Generate laporan pertama untuk melihat history export.'}
          />
        ) : (
          <ExportHistoryTable
            exports={exports}
            onRetry={isViewer ? undefined : (record) => retryMutation.mutate(record)}
            retryingId={retryMutation.isPending ? retryMutation.variables?.id ?? null : null}
          />
        )}
      </div>
    </RoleGuard>
  )
}
