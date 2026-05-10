'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  PauseCircle,
  RefreshCw,
  Share2,
  Target,
  Zap,
} from 'lucide-react'
import { blastApi } from '@/lib/api/blast'
import { campaignsApi } from '@/lib/api/campaigns'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { BlastMetricCard } from '@/components/features/blast/blast-metric-card'
import { BlastTargetSummary } from '@/components/features/blast/blast-target-summary'
import { AttemptHistoryTable } from '@/components/features/blast/attempt-history-table'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime, formatNumber, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { BlastReport, BlastTargetStatus } from '@/types'

export default function BlastTargetDetailPage() {
  const { campaignId, targetId } = useParams<{ campaignId: string; targetId: string }>()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [reblastOpen, setReblastOpen] = useState(false)

  const { data: campaign } = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const { data: target, isLoading, isError, error } = useQuery({ queryKey: ['blast-target', campaignId, targetId], queryFn: () => blastApi.getTarget(campaignId, targetId) })
  const { data: attempts, isLoading: attemptsLoading } = useQuery({ queryKey: ['blast-attempts', campaignId, targetId], queryFn: () => blastApi.getAttemptsByTarget(campaignId, targetId), enabled: isAdmin })
  const { data: campaignReports } = useQuery({
    queryKey: ['campaign-reports', campaignId, 'target', targetId],
    queryFn: () => blastApi.listReports(campaignId),
  })

  const reblastMutation = useMutation({
    mutationFn: () => blastApi.createReblast(campaignId, targetId),
    onSuccess: (newAttempt) => {
      toast.success(`Reblast attempt #${newAttempt.attemptNo} berhasil dibuat.`)
      queryClient.invalidateQueries({ queryKey: ['blast-target', campaignId, targetId] })
      queryClient.invalidateQueries({ queryKey: ['blast-attempts', campaignId, targetId] })
      setReblastOpen(false)
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const statusMutation = useMutation({
    mutationFn: (status: BlastTargetStatus) => blastApi.updateTargetStatus(campaignId, targetId, status),
    onSuccess: (_updated, status) => {
      toast.success(status === 'ACTIVE' ? 'Blast target kembali active.' : status === 'PAUSED' ? 'Blast target dipause.' : 'Blast target diarchive.')
      queryClient.invalidateQueries({ queryKey: ['blast-target', campaignId, targetId] })
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const metrics = useMemo(() => {
    const list = attempts ?? []
    const campaignReportsForTarget = campaignReports?.filter((report) => report.blastTargetId === targetId) ?? []
    const reportsForTarget: BlastReport[] = campaignReportsForTarget.length ? campaignReportsForTarget : list.map(attempt => attempt.report).filter((report): report is BlastReport => Boolean(report))
    const completed = list.filter(attempt => attempt.status === 'COMPLETED')
    const engagement = reportsForTarget.reduce((sum, report) => sum + (report.likes ?? 0) + (report.comments ?? 0) + (report.shares ?? 0) + (report.reposts ?? 0), 0)
    const views = reportsForTarget.reduce((sum, report) => sum + (report.views ?? 0), 0)
    const completionRate = list.length ? Math.round((completed.length / list.length) * 100) : 0
    return { reports: reportsForTarget, completed, engagement, views, completionRate }
  }, [attempts, campaignReports, targetId])

  if (isLoading) {
    return (
      <div>
        <Skeleton height={140} />
        <Skeleton height={110} style={{ marginTop: '1rem' }} />
        <Skeleton height={320} style={{ marginTop: '1rem' }} />
      </div>
    )
  }

  if (isError) {
    return <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat blast target" description={mapApiErrorToToastMessage(error)} />
  }

  if (!target) {
    return <EmptyState icon={<Target size={48} />} title="Blast target tidak ditemukan" description="Target mungkin sudah dihapus atau Anda tidak memiliki akses." />
  }

  const currentAttempt = attempts?.find(attempt => attempt.status === 'KEPT' || attempt.status === 'AVAILABLE') ?? attempts?.[0]
  const isArchived = target.status === 'ARCHIVED'
  const isPaused = target.status === 'PAUSED'
  const canReblast = target.status === 'ACTIVE'
  const actionLoading = reblastMutation.isPending || statusMutation.isPending

  return (
    <RoleGuard roles={['ADMIN', 'VIEWER']}>
    <div>
      <CampaignShell campaign={campaign} campaignId={campaignId}>

      <div className="section-heading-row">
        <div>
          <Link href={`/campaigns/${campaignId}/blast-links`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cyan)', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.45rem' }}>
            <ArrowLeft size={14} /> Back to Campaign Blast Links
          </Link>
          <div className="section-kicker">Blast Target</div>
          <h2 className="section-title">Blast Target Detail</h2>
          <p className="section-subtitle">Trace current attempt ownership, proof, reports, and reblast history for this target post.</p>
        </div>
        {isAdmin && (
          <div className="campaign-hero-actions">
            <a href={target.postUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <ExternalLink size={14} /> Open Post
            </a>
            <Button icon={<RefreshCw size={14} />} disabled={!canReblast || actionLoading} onClick={() => setReblastOpen(true)}>Reblast</Button>
            {isPaused ? (
              <Button variant="secondary" loading={statusMutation.isPending && statusMutation.variables === 'ACTIVE'} icon={<PauseCircle size={14} />} disabled={isArchived} onClick={() => statusMutation.mutate('ACTIVE')}>Resume Target</Button>
            ) : (
              <Button variant="secondary" loading={statusMutation.isPending && statusMutation.variables === 'PAUSED'} icon={<PauseCircle size={14} />} disabled={!canReblast || actionLoading} onClick={() => statusMutation.mutate('PAUSED')}>Pause Target</Button>
            )}
            <button type="button" className="btn-danger" disabled={isArchived || actionLoading} onClick={() => statusMutation.mutate('ARCHIVED')}><Archive size={14} /> Archive</button>
          </div>
        )}
      </div>

      <BlastTargetSummary campaign={campaign} target={target} currentAttempt={currentAttempt} />

      <div className="blast-metric-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <BlastMetricCard
          label="Current Attempt Status"
          value={currentAttempt ? `#${currentAttempt.attemptNo}` : '-'}
          sub={currentAttempt?.status ?? 'No attempt'}
          icon={<Zap size={22} />}
          accent={currentAttempt?.status === 'KEPT' ? 'var(--status-kept)' : 'var(--cyan)'}
        />
        <BlastMetricCard
          label="Submitted Reports"
          value={metrics.reports.length}
          sub={`${metrics.completed.length} completed attempts`}
          icon={<FileText size={22} />}
          accent="var(--status-completed)"
        />
        <BlastMetricCard
          label="Completion Rate"
          value={`${metrics.completionRate}%`}
          sub={`${metrics.completed.length} of ${attempts?.length ?? 0} attempts`}
          icon={<BarChart3 size={22} />}
          accent="var(--violet)"
        />
        <BlastMetricCard
          label="Total Engagement"
          value={formatNumber(metrics.engagement)}
          sub={`${formatNumber(metrics.views)} total views`}
          icon={<Heart size={22} />}
          accent="#f43f5e"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '1.25rem', minWidth: 0 }}>
          <section>
            <div className="section-heading-row" style={{ marginTop: 0 }}>
              <div>
                <div className="section-kicker">Traceability</div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Attempt History</h3>
              </div>
              {isAdmin && <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} disabled={!canReblast || actionLoading} onClick={() => setReblastOpen(true)}>New Attempt</Button>}
            </div>
            {attemptsLoading ? (
              <div className="blast-table-shell" style={{ padding: '1rem' }}>
                <Skeleton height={52} />
                <Skeleton height={52} style={{ marginTop: '0.75rem' }} />
              </div>
            ) : attempts?.length ? (
              <AttemptHistoryTable attempts={attempts} />
            ) : (
              <div className="preview-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 800 }}>No attempts yet</div>
                <div className="muted-meta">Create a first attempt to make this target available in Blast Queue.</div>
              </div>
            )}
          </section>

          <section className="blast-table-shell" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.4rem' }}>
              <div>
                <div className="section-kicker">Reports</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 850 }}>Blast Reports</h3>
              </div>
              <Link href={`/campaigns/${campaignId}/reports`} className="icon-action">
                <Eye size={13} /> View All Reports
              </Link>
            </div>

            {metrics.reports.length ? (
              <div className="report-list">
                {metrics.reports.map(report => {
                  const engagement = report.likes + report.comments + report.shares + report.reposts
                  return (
                    <div key={report.id} className="report-row">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <strong>Attempt #{report.attemptNo ?? '-'}</strong>
                          <span className="icon-action" style={{ cursor: 'default' }}>{report.reviewStatus ?? 'SUBMITTED'}</span>
                        </div>
                        <div className="muted-meta">
                          Submitted by {report.submittedByUser?.name ?? report.submittedBy ?? 'Buzzer'} - {formatRelativeTime(report.submittedAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--cyan)' }}><Eye size={12} /> {formatNumber(report.views)}</span>
                        <span style={{ color: '#f43f5e' }}><Heart size={12} /> {formatNumber(report.likes)}</span>
                        <span style={{ color: 'var(--status-kept)' }}><MessageCircle size={12} /> {formatNumber(report.comments)}</span>
                        <span style={{ color: 'var(--status-active)' }}><Share2 size={12} /> {formatNumber(engagement)}</span>
                      </div>
                      <a href={report.proofLink} target="_blank" rel="noopener noreferrer" className="icon-action">
                        Proof <ExternalLink size={12} />
                      </a>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="preview-card" style={{ marginTop: '0.85rem' }}>
                <strong>No submitted reports</strong>
                <div className="muted-meta">BlastReport is created only after a Buzzer completes their kept attempt.</div>
              </div>
            )}
          </section>
        </div>

        <aside style={{ display: 'grid', gap: '1.25rem' }}>
          <section className="helper-panel" style={{ position: 'static' }}>
            <div className="helper-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
                <Target size={16} style={{ color: 'var(--cyan)' }} />
                <strong>Target Specification</strong>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <div className="blast-metric-label">Platform</div>
                  <div style={{ marginTop: '0.3rem' }}><PlatformBadge platform={target.platform} size="sm" /></div>
                </div>
                <div>
                  <div className="blast-metric-label">Source Account</div>
                  <div style={{ fontWeight: 800 }}>@{target.socialAccount?.username ?? '-'}</div>
                  <div className="muted-meta">Admin-managed source account</div>
                </div>
                <div>
                  <div className="blast-metric-label">Target URL</div>
                  <a href={target.postUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: '100%' }}>
                    {target.postUrl.replace('https://', '')} <ExternalLink size={11} />
                  </a>
                </div>
                <div>
                  <div className="blast-metric-label">Created At</div>
                  <div>{formatDateTime(target.createdAt)}</div>
                </div>
                <div>
                  <div className="blast-metric-label">Keep Expires At</div>
                  <div>{currentAttempt?.keepExpiresAt ? formatDateTime(currentAttempt.keepExpiresAt) : '-'}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="helper-panel" style={{ position: 'static' }}>
            <div className="helper-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
                <RefreshCw size={16} style={{ color: 'var(--status-kept)' }} />
                <strong>Reblast Rule</strong>
              </div>
              <p className="muted-meta" style={{ lineHeight: 1.7 }}>
                Reblast creates a new BlastAttempt with the next attempt number. It does not overwrite old attempt history or reports.
              </p>
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={reblastOpen}
        onClose={() => setReblastOpen(false)}
        title="Create Reblast Attempt"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReblastOpen(false)}>Cancel</Button>
            <Button loading={reblastMutation.isPending} disabled={!canReblast} onClick={() => reblastMutation.mutate()} icon={<RefreshCw size={14} />}>
              Create Attempt
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="blast-info-banner" style={{ marginBottom: 0 }}>
            <RefreshCw size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <div>
              <strong>Reblast keeps history intact.</strong>
              <span> A new AVAILABLE attempt will be opened for campaign Buzzer members.</span>
              {!canReblast && <span> Target harus ACTIVE sebelum reblast.</span>}
            </div>
          </div>
          <div className="preview-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <PlatformBadge platform={target.platform} size="sm" />
              <StatusBadge status="AVAILABLE" type="attempt" size="sm" />
            </div>
            <div style={{ fontWeight: 850 }}>New Attempt #{(attempts?.length ?? 0) + 1}</div>
            <div className="muted-meta">@{target.socialAccount?.username} • {target.postUrl}</div>
          </div>
        </div>
      </Modal>
      </CampaignShell>
    </div>
    </RoleGuard>
  )
}
