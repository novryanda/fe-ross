'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { PageHeader } from '@/components/ui/page-header'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime, formatNumber, getAttemptStatusConfig } from '@/lib/utils'
import {
  Target, ExternalLink, Eye, Heart, MessageCircle,
  CheckCircle2, AlertTriangle, Clock, BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function AttemptHistoryPage() {
  const { campaignId, targetId } = useParams<{ campaignId: string; targetId: string }>()

  const { data: target, isLoading: tLoading } = useQuery({ queryKey: ['blast-target', campaignId, targetId], queryFn: () => blastApi.getTarget(campaignId, targetId) })
  const { data: attempts, isLoading: aLoading } = useQuery({ queryKey: ['blast-attempts', campaignId, targetId], queryFn: () => blastApi.getAttemptsByTarget(campaignId, targetId) })

  const isLoading = tLoading || aLoading

  if (isLoading) return (
    <div>
      <Skeleton height={24} width={200} />
      <Skeleton height={80} style={{ marginTop: '1rem' }} />
      <Skeleton height={300} style={{ marginTop: '1rem' }} />
    </div>
  )

  if (!target) return null

  const totalAttempts = attempts?.length ?? 0
  const successful = attempts?.filter(a => a.status === 'COMPLETED').length ?? 0
  const needsReblast = attempts?.filter(a => a.status === 'EXPIRED' || a.status === 'RELEASED').length ?? 0
  const avgCompletion = totalAttempts > 0 ? Math.round((successful / totalAttempts) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <Link href={`/campaigns/${campaignId}/blast-links/${targetId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--cyan)', fontSize: '0.75rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
        ← Back to Blast Target Detail
      </Link>

      <PageHeader title="Attempt History" subtitle="Riwayat attempt untuk target blast ini." />

      {/* Target Context Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlatformBadge platform={target.platform} size="sm" />
        </div>
        <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>@{target.socialAccount?.username ?? '—'}</div>
        <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
        <a href={target.postUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ fontSize: '0.75rem' }}>
          {target.postUrl.replace('https://', '').slice(0, 40)}... <ExternalLink size={10} />
        </a>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
          <div className="kpi-v2-icon" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>
            <Target size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Total Attempts</div>
            <div className="kpi-v2-value">{totalAttempts}</div>
            <div className="kpi-v2-sub">Semua attempt dibuat</div>
          </div>
        </div>
        <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-completed)' }}>
          <div className="kpi-v2-icon" style={{ background: 'var(--status-completed-bg)', color: 'var(--status-completed)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Successful</div>
            <div className="kpi-v2-value">{successful}</div>
            <div className="kpi-v2-sub">{totalAttempts > 0 ? `${Math.round((successful / totalAttempts) * 100)}% dari total` : '—'}</div>
          </div>
        </div>
        <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-expired)' }}>
          <div className="kpi-v2-icon" style={{ background: 'var(--status-expired-bg)', color: 'var(--status-expired)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Needs Reblast</div>
            <div className="kpi-v2-value">{needsReblast}</div>
            <div className="kpi-v2-sub">{totalAttempts > 0 ? `${Math.round((needsReblast / totalAttempts) * 100)}% dari total` : '—'}</div>
          </div>
        </div>
        <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-active)' }}>
          <div className="kpi-v2-icon" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="kpi-v2-label">Avg Completion</div>
            <div className="kpi-v2-value">{avgCompletion}%</div>
            <div className="kpi-v2-sub">Rata-rata completion rate</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Created Date</th>
                <th>Kept By</th>
                <th>Report Metrics</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts?.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{a.attemptNo}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{formatDate(a.createdAt)}</div>
                    {a.keptByUser && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {a.keptByUser.name}</div>
                    )}
                  </td>
                  <td>
                    {a.keptByUser ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {a.keptByUser.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.keptByUser.name}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                  <td>
                    {a.report ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Eye size={10} /> {formatNumber(a.report.views)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Heart size={10} /> {formatNumber(a.report.likes)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--status-available)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <MessageCircle size={10} /> {formatNumber(a.report.comments)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={a.status} type="attempt" size="sm" />
                  </td>
                  <td>
                    {a.report?.proofLink && (
                      <a href={a.report.proofLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ExternalLink size={10} /> View Proof
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timeline Sidebar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} style={{ color: 'var(--cyan)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Attempt Timeline</h3>
          </div>

          <div className="timeline">
            {attempts?.map(a => {
              const cfg = getAttemptStatusConfig(a.status)
              return (
                <div key={a.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}>
                    {a.status === 'COMPLETED' && <CheckCircle2 size={8} style={{ color: cfg.color }} />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title" style={{ fontSize: '0.75rem' }}>
                      Attempt #{a.attemptNo}
                    </div>
                    <div style={{ marginTop: '0.125rem' }}>
                      <StatusBadge status={a.status} type="attempt" size="sm" />
                    </div>
                    {a.keptByUser && (
                      <div className="timeline-desc">{a.keptByUser.name}</div>
                    )}
                    <div className="timeline-time">{formatDateTime(a.createdAt)}</div>
                    {a.report && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.375rem', fontSize: '0.65rem' }}>
                        <span style={{ color: 'var(--cyan)' }}>{formatNumber(a.report.views)} views</span>
                        <span style={{ color: '#f43f5e' }}>{formatNumber(a.report.likes)} likes</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Performance Comparison */}
          {successful > 1 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Performance Comparison</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attempts?.filter(a => a.report).map(a => {
                  const maxViews = Math.max(...(attempts?.filter(x => x.report).map(x => x.report!.views) ?? [1]))
                  const pct = Math.round((a.report!.views / maxViews) * 100)
                  return (
                    <div key={a.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>#{a.attemptNo}</span>
                        <span>{formatNumber(a.report!.views)} views</span>
                      </div>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--cyan), var(--violet))' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
