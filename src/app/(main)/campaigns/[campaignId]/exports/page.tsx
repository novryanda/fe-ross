'use client'
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
import type { ExportFormat, ExportRecord } from '@/types'

function hasInFlight(records: ExportRecord[] | undefined): boolean {
  return Boolean(records?.some((r) => r.status === 'PROCESSING' || r.status === 'PENDING'))
}

export default function CampaignExportsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const exportsQuery = useQuery({
    queryKey: ['exports', campaignId],
    queryFn: () => exportsApi.listByCampaign(campaignId),
    refetchInterval: (query) => (hasInFlight(query.state.data?.data) ? 5000 : false),
  })

  const createMutation = useMutation({
    mutationFn: (format: ExportFormat) =>
      exportsApi.create(campaignId, { format, scope: 'FULL' }),
    onSuccess: (record) => {
      toast.success(`Export ${record.format} sedang diproses…`)
      queryClient.invalidateQueries({ queryKey: ['exports', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['exports'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const retryMutation = useMutation({
    mutationFn: (record: ExportRecord) =>
      exportsApi.create(campaignId, {
        format: record.format,
        scope: record.scope ?? 'FULL',
      }),
    onSuccess: () => {
      toast.success('Export di-retry.')
      queryClient.invalidateQueries({ queryKey: ['exports', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['exports'] })
    },
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
          actions={
            isAdmin ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  onClick={() => createMutation.mutate('PDF')}
                  loading={createMutation.isPending}
                  icon={<FileText size={14} />}
                >
                  Export PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => createMutation.mutate('EXCEL')}
                  loading={createMutation.isPending}
                  icon={<FileSpreadsheet size={14} />}
                >
                  Export Excel
                </Button>
              </div>
            ) : undefined
          }
        />

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
            onRetry={isAdmin ? (record) => retryMutation.mutate(record) : undefined}
            retryingId={retryMutation.isPending ? retryMutation.variables?.id ?? null : null}
          />
        )}
      </div>
    </RoleGuard>
  )
}
