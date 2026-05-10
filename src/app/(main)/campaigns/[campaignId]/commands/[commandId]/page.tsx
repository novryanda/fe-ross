'use client'
import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Archive, CheckCircle2, Clock, ExternalLink, MessageCircle, Pause, Play, ShieldCheck, TimerReset, Users } from 'lucide-react'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { EmptyState } from '@/components/ui/empty-state'
import { RoleGuard } from '@/components/layout/role-guard'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { campaignsApi } from '@/lib/api/campaigns'
import { commentCommandsApi, commentTasksApi } from '@/lib/api/comment-commands'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function CommandDetailPage() {
  const { campaignId, commandId } = useParams<{ campaignId: string; commandId: string }>()
  const queryClient = useQueryClient()
  const campaignQuery = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const commandQuery = useQuery({ queryKey: ['comment-command', commandId], queryFn: () => commentCommandsApi.get(commandId) })
  const tasksQuery = useQuery({ queryKey: ['comment-tasks', campaignId], queryFn: () => commentTasksApi.listByCampaign(campaignId) })
  const command = commandQuery.data
  const tasks = (tasksQuery.data ?? []).filter(task => task.commandId === commandId)
  const proofTasks = tasks.filter(task => task.proofLink)

  const statusMutation = useMutation({
    mutationFn: (nextStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => commentCommandsApi.updateStatus(commandId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-command', commandId] })
      queryClient.invalidateQueries({ queryKey: ['comment-commands', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['comment-tasks', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      toast.success('Status command diperbarui.')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const error = campaignQuery.error ?? commandQuery.error ?? tasksQuery.error

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Comment Keep Queue</div>
            <h2 className="section-title">Command Detail</h2>
            <p className="section-subtitle">Slot komentar first come, first served untuk semua Buzzer member campaign.</p>
          </div>
          {command && <StatusBadge status={command.status} type="command" size="sm" />}
        </div>

        {commandQuery.isLoading || campaignQuery.isLoading || tasksQuery.isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        ) : error ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat command" description={mapApiErrorToToastMessage(error)} />
        ) : command ? (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <Kpi label="Required Slots" value={command.requiredSlots} icon={<ShieldCheck size={20} />} color="var(--cyan)" />
              <Kpi label="Available Slots" value={command.availableSlots} icon={<TimerReset size={20} />} color="var(--status-available)" />
              <Kpi label="Kept Slots" value={command.keptSlots} icon={<Users size={20} />} color="var(--status-kept)" />
              <Kpi label="Completed Slots" value={command.completedSlots} icon={<CheckCircle2 size={20} />} color="var(--status-completed)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '1.25rem', alignItems: 'start' }}>
              <div className="enterprise-form-card">
                <section className="campaign-create-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <PlatformBadge platform={command.platform} />
                    <StanceBadge stance={command.stance} />
                    <StatusBadge status={command.status} type="command" />
                  </div>
                  <div className="summary-line"><div className="summary-label">Campaign</div><div className="summary-value">{campaignQuery.data?.name ?? command.campaign?.name ?? '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Target URL</div><div className="summary-value"><a href={command.targetPostUrl} target="_blank" rel="noopener noreferrer" className="ext-link">{command.targetPostUrl} <ExternalLink size={10} /></a></div></div>
                  <div className="summary-line"><div className="summary-label">Source Account</div><div className="summary-value">{command.socialAccount?.username ? `@${command.socialAccount.username}` : '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Deadline</div><div className="summary-value">{command.deadline ? formatDate(command.deadline) : '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Keep Expiry</div><div className="summary-value">{command.keepExpiryMinutes} minutes</div></div>
                </section>

                <section className="campaign-create-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <MessageCircle size={16} style={{ color: 'var(--cyan)' }} />
                    <strong>Narrative</strong>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{command.narrative}</p>
                  {command.instruction && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <div className="summary-label" style={{ marginBottom: '0.35rem' }}>Instruction</div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{command.instruction}</p>
                    </div>
                  )}
                </section>

                <section className="campaign-create-section">
                  <div className="section-number-title"><Clock size={16} style={{ color: 'var(--cyan)' }} /><strong>Comment Task / Slot History</strong></div>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead><tr><th>Task No</th><th>Status</th><th>Kept By</th><th>Kept At</th><th>Expires</th><th>Completed</th><th>Proof</th></tr></thead>
                      <tbody>{tasks.map(task => (
                        <tr key={task.id}>
                          <td>#{task.taskNo}</td>
                          <td><StatusBadge status={task.status} type="task" size="sm" /></td>
                          <td>{task.keptByUser?.name ?? '-'}</td>
                          <td>{task.keptAt ? formatDate(task.keptAt) : '-'}</td>
                          <td>{task.keepExpiresAt ? formatDate(task.keepExpiresAt) : '-'}</td>
                          <td>{task.completedAt ? formatDate(task.completedAt) : '-'}</td>
                          <td>{task.proofLink ? <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="ext-link">Open</a> : '-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                    {!tasks.length && <EmptyState icon={<MessageCircle size={48} />} title="Belum ada task slot" />}
                  </div>
                </section>
              </div>

              <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
                <div className="campaign-summary-panel">
                  <strong>Proof Submissions</strong>
                  {proofTasks.length ? proofTasks.map(task => (
                    <div key={task.id} className="checklist-item">
                      <CheckCircle2 size={17} style={{ color: 'var(--status-active)' }} />
                      <div>
                        <div style={{ fontWeight: 850 }}>Slot #{task.taskNo}</div>
                        <div className="muted-meta">{task.keptByUser?.name ?? 'Unknown Buzzer'}</div>
                      </div>
                      <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="ext-link">Proof</a>
                    </div>
                  )) : <p className="muted-meta" style={{ marginTop: '0.75rem' }}>No proof submitted yet.</p>}
                </div>
                <div className="campaign-summary-panel">
                  <strong>Actions</strong>
                  <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.85rem' }}>
                    {command.status === 'PAUSED' || command.status === 'DRAFT' ? (
                      <button className="btn-secondary" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate('ACTIVE')}><Play size={14} /> Reopen</button>
                    ) : (
                      <button className="btn-secondary" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate('PAUSED')}><Pause size={14} /> Pause</button>
                    )}
                    <button className="btn-danger-outline" disabled={statusMutation.isPending || command.status === 'ARCHIVED'} onClick={() => statusMutation.mutate('ARCHIVED')}><Archive size={14} /> Archive</button>
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <EmptyState icon={<MessageCircle size={48} />} title="Command tidak ditemukan" />
        )}
      </CampaignShell>
    </RoleGuard>
  )
}

function Kpi({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
  return (
    <div className="kpi-v2" style={{ borderLeftColor: color }}>
      <div className="kpi-v2-icon" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>{icon}</div>
      <div><div className="kpi-v2-label">{label}</div><div className="kpi-v2-value">{value}</div></div>
    </div>
  )
}
