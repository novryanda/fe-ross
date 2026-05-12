'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/layout/role-guard'
import { ExportHistoryTable } from '@/components/features/exports/export-history-table'
import { exportsApi } from '@/lib/api/exports'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { useAuth } from '@/hooks/use-auth'
import type { ExportFormat, ExportRecord, ExportScope } from '@/types'

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'BLAST_REPORTS', label: 'Blast Reports' },
  { value: 'COMMENT_TASKS', label: 'Comment Tasks' },
  { value: 'FULL', label: 'Full Campaign Report' },
]

function hasInFlight(records: ExportRecord[] | undefined): boolean {
  return Boolean(records?.some((r) => r.status === 'PROCESSING' || r.status === 'PENDING'))
}

export default function CampaignExportsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [format, setFormat] = useState<ExportFormat>('PDF')
  const [scope, setScope] = useState<ExportScope>('FULL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const exportsQuery = useQuery({
    queryKey: ['exports', campaignId],
    queryFn: () => exportsApi.listByCampaign(campaignId),
    refetchInterval: (query) => (hasInFlight(query.state.data?.data) ? 12000 : false),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      exportsApi.create(campaignId, {
        format,
        scope,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    onSuccess: (record) => {
      toast.success(`Export ${record.format} sedang diproses…`)
      queryClient.invalidateQueries({ queryKey: ['exports', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['exports'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const retryMutation = useMutation({
    mutationFn: (record: ExportRecord) => exportsApi.retryExport(record.id),
    onSuccess: () => {
      toast.success('Export retry started.')
      queryClient.invalidateQueries({ queryKey: ['exports', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['exports'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const downloadMutation = useMutation({
    mutationFn: (record: ExportRecord) => exportsApi.downloadExport(record),
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const exports = exportsQuery.data?.data ?? []

  return (
    <RoleGuard roles={['ADMIN', 'VIEWER']}>
      <div className="page-container">
        <PageHeader
          title="Export Reports"
          subtitle="Download laporan campaign dalam format PDF atau Excel."
          backHref={`/campaigns/${campaignId}`}
        />

        {isAdmin && (
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
              <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Date To</label>
              <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                icon={format === 'PDF' ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                style={{ width: '100%' }}
              >
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {exportsQuery.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : exportsQuery.isError ? (
          <ErrorState
            title="Gagal memuat export"
            message={mapApiErrorToToastMessage(exportsQuery.error)}
            retry={() => exportsQuery.refetch()}
          />
        ) : !exports.length ? (
          <EmptyState
            icon={<Download size={48} />}
            title="Belum ada export"
            description={isAdmin ? 'Request export pertama dengan klik tombol di atas.' : 'Belum ada export untuk campaign ini.'}
          />
        ) : (
          <ExportHistoryTable
            exports={exports}
            onDownload={(record) => downloadMutation.mutate(record)}
            onRetry={isAdmin ? (record) => retryMutation.mutate(record) : undefined}
            downloadingId={downloadMutation.isPending ? downloadMutation.variables?.id ?? null : null}
            retryingId={retryMutation.isPending ? retryMutation.variables?.id ?? null : null}
            onRefresh={() => exportsQuery.refetch()}
          />
        )}
      </div>
    </RoleGuard>
  )
}
