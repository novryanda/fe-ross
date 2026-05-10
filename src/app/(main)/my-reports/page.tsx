'use client'
import { useQuery } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuth } from '@/hooks/use-auth'
import {
  calcEngagement,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from '@/lib/utils'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import {
  CheckCircle2,
  Eye,
  ExternalLink,
  FileText,
  Heart,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'

export default function MyReportsPage() {
  const { user } = useAuth()

  const { data: reports, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: () => blastApi.getMyReports(user!.id),
    enabled: !!user,
  })

  const totalReports = reports?.length ?? 0
  const totalViews = reports?.reduce((s, r) => s + r.views, 0) ?? 0
  const totalLikes = reports?.reduce((s, r) => s + r.likes, 0) ?? 0
  const totalEngagement = reports?.reduce((s, r) => s + calcEngagement(r), 0) ?? 0

  return (
    <RoleGuard roles={['BUZZER']}>
      <div className="page-container">
        <PageHeader title="My Reports" subtitle="Riwayat blast report yang Anda submit." />

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
            <div className="kpi-v2-icon" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}><FileText size={20} /></div>
            <div>
              <div className="kpi-v2-label">All Reports</div>
              <div className="kpi-v2-value">{totalReports}</div>
            </div>
          </div>
          <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-completed)' }}>
            <div className="kpi-v2-icon" style={{ background: 'var(--status-completed-bg)', color: 'var(--status-completed)' }}><CheckCircle2 size={20} /></div>
            <div>
              <div className="kpi-v2-label">Completed</div>
              <div className="kpi-v2-value">{totalReports}</div>
            </div>
          </div>
          <div className="kpi-v2" style={{ borderLeftColor: '#f43f5e' }}>
            <div className="kpi-v2-icon" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}><Heart size={20} /></div>
            <div>
              <div className="kpi-v2-label">Total Likes</div>
              <div className="kpi-v2-value">{formatNumber(totalLikes)}</div>
            </div>
          </div>
          <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-active)' }}>
            <div className="kpi-v2-icon" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)' }}><TrendingUp size={20} /></div>
            <div>
              <div className="kpi-v2-label">Total Engagement</div>
              <div className="kpi-v2-value">{formatNumber(totalEngagement)}</div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Gagal memuat report"
            message={mapApiErrorToToastMessage(error)}
            retry={() => refetch()}
          />
        ) : !reports?.length ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="Belum ada report"
            description="Report akan muncul setelah Anda menyelesaikan blast."
          />
        ) : (
          <>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Views</th>
                    <th style={{ textAlign: 'right' }}>Likes</th>
                    <th style={{ textAlign: 'right' }}>Comments</th>
                    <th>Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{formatDate(r.submittedAt)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(r.submittedAt)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--cyan)', fontSize: '0.8125rem', fontWeight: 600 }}>
                          <Eye size={12} /> {formatNumber(r.views)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f43f5e', fontSize: '0.8125rem', fontWeight: 600 }}>
                          <Heart size={12} /> {formatNumber(r.likes)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-kept)', fontSize: '0.8125rem', fontWeight: 600 }}>
                          <MessageCircle size={12} /> {formatNumber(r.comments)}
                        </span>
                      </td>
                      <td>
                        {r.proofLink ? (
                          <a href={r.proofLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                            <ExternalLink size={11} /> View
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>
                Showing 1 to {reports.length} of {reports.length} reports
              </span>
              <span>Total views: {formatNumber(totalViews)}</span>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}
