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
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')
  const [filterCampaignId, setFilterCampaignId] = useState('')
  const [formatFilter, setFormatFilter] = useState<ExportFormat | ''>('')
  const [scopeFilter, setScopeFilter] = useState<ExportScope | ''>('')
  const [statusFilter, setStatusFilter] = useState<ExportStatus | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', { limit: 100 }],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  })

  const exportsQuery = useQuery({
    queryKey: ['exports', { filterCampaignId, formatFilter, scopeFilter, statusFilter, filterDateFrom, filterDateTo }],
    queryFn: () =>
      exportsApi.list({
        campaignId: filterCampaignId || undefined,
        format: formatFilter || undefined,
        scope: scopeFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      }),
    refetchInterval: (query) => (hasInFlightExport(query.state.data?.data) ? 12000 : false),
  })

  const exports = exportsQuery.data?.data ?? []

  const createMutation = useMutation({
    mutationFn: () => {
      if (!campaignId) throw new Error('Campaign belum dipilih.')
      return exportsApi.create(campaignId, {
        format,
        scope,
        dateFrom: exportDateFrom || undefined,
        dateTo: exportDateTo || undefined,
      })
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
    mutationFn: (record: ExportRecord) => exportsApi.retryExport(record.id),
    onSuccess: (record) => {
      toast.success('Export retry started.')
      queryClient.invalidateQueries({ queryKey: ['exports'] })
      queryClient.invalidateQueries({ queryKey: ['exports', record.campaignId] })
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (record: ExportRecord) => exportsApi.downloadExport(record),
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
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Generate report membuat snapshot sesuai scope dan rentang tanggal yang dipilih.
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                File akan disimpan sebagai artefak export dan dapat diunduh ulang dari Export History.
              </p>
            </div>
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
            <div>
              <label className="form-label">Date From</label>
              <input
                type="date"
                className="input-field"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Date To</label>
              <input
                type="date"
                className="input-field"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
              />
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
            value={filterCampaignId}
            onChange={(e) => setFilterCampaignId(e.target.value)}
          >
            <option value="">All Campaigns</option>
            {campaignOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as ExportFormat | '')}
          >
            <option value="">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="EXCEL">Excel</option>
          </select>
          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ExportScope | '')}
          >
            <option value="">All Scopes</option>
            {SCOPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            aria-label="Dari tanggal"
          />
          <span className="muted-meta" style={{ fontSize: '0.75rem' }}>→</span>
          <input
            type="date"
            className="input-field"
            style={{ width: 'auto' }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
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
            onDownload={(record) => downloadMutation.mutate(record)}
            onRetry={isViewer ? undefined : (record) => retryMutation.mutate(record)}
            downloadingId={downloadMutation.isPending ? downloadMutation.variables?.id ?? null : null}
            retryingId={retryMutation.isPending ? retryMutation.variables?.id ?? null : null}
            onRefresh={() => exportsQuery.refetch()}
          />
        )}
      </div>
    </RoleGuard>
  )
}
