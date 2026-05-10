'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, ExternalLink, MessageCircle, Play, RotateCcw } from 'lucide-react'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { EmptyState } from '@/components/ui/empty-state'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuth } from '@/hooks/use-auth'
import { commentTasksApi } from '@/lib/api/comment-commands'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function CommentTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const taskQuery = useQuery({ queryKey: ['buzzer-comment-task', taskId], queryFn: () => commentTasksApi.get(taskId) })
  const task = taskQuery.data
  const command = task?.command
  const canAct = Boolean(task && task.keptBy === user?.id && ['KEPT', 'IN_PROGRESS'].includes(task.status))

  const startMutation = useMutation({
    mutationFn: () => commentTasksApi.start(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-tasks'] })
      toast.success('Comment task dimulai.')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const releaseMutation = useMutation({
    mutationFn: () => commentTasksApi.release(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      toast.success('Comment task dilepas kembali ke queue.')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  return (
    <RoleGuard roles={['BUZZER']}>
      <div>
        <Link href="/comment-tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
          <ArrowLeft size={15} /> Back to Comment Tasks
        </Link>
        {taskQuery.isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        ) : taskQuery.error ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat comment task" description={mapApiErrorToToastMessage(taskQuery.error)} />
        ) : task && command ? (
          <>
            <div className="section-heading-row" style={{ marginTop: 0 }}>
              <div>
                <div className="section-kicker">Comment Slot Detail</div>
                <h1 className="section-title" style={{ fontSize: '2rem' }}>Comment Task #{task.taskNo}</h1>
                <p className="section-subtitle">Keep/claim slot detail untuk komentar yang sudah Anda Keep.</p>
              </div>
              <StatusBadge status={task.status} type="task" size="sm" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.25rem', alignItems: 'start' }}>
              <div className="enterprise-form-card">
                <section className="campaign-create-section">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <StanceBadge stance={command.stance} />
                    <PlatformBadge platform={command.platform} />
                  </div>
                  <div className="summary-line"><div className="summary-label">Campaign</div><div className="summary-value">{command.campaign?.name ?? '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Target URL</div><div className="summary-value"><a href={command.targetPostUrl} target="_blank" rel="noopener noreferrer" className="ext-link">{command.targetPostUrl} <ExternalLink size={10} /></a></div></div>
                  <div className="summary-line"><div className="summary-label">Deadline</div><div className="summary-value">{command.deadline ? formatDate(command.deadline) : '-'}</div></div>
                </section>
                <section className="campaign-create-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}><MessageCircle size={15} style={{ color: 'var(--cyan)' }} /><strong>Narrative</strong></div>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{command.narrative}</p>
                  {command.instruction && <p className="muted-meta" style={{ marginTop: '1rem' }}><strong>Instruction:</strong> {command.instruction}</p>}
                </section>
              </div>
              <aside className="campaign-summary-panel" style={{ position: 'sticky', top: 72 }}>
                <strong>Keep State</strong>
                <div className="summary-line"><div className="summary-label">Kept By</div><div className="summary-value">{task.keptByUser?.name ?? '-'}</div></div>
                <div className="summary-line"><div className="summary-label">Kept At</div><div className="summary-value">{task.keptAt ? formatDate(task.keptAt) : '-'}</div></div>
                <div className="summary-line"><div className="summary-label">Expires</div><div className="summary-value">{task.keepExpiresAt ? formatDate(task.keepExpiresAt) : '-'}</div></div>
                <div className="summary-line"><div className="summary-label">Proof</div><div className="summary-value">{task.proofLink ? <a href={task.proofLink} className="ext-link">Open Proof</a> : '-'}</div></div>
                {canAct && (
                  <div style={{ display: 'grid', gap: '0.6rem', marginTop: '1rem' }}>
                    {task.status === 'KEPT' && <button className="btn-secondary" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}><Play size={14} /> Start</button>}
                    <Link href={`/comment-tasks/${task.id}/submit`} className="btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }}>Submit Proof</Link>
                    <button className="btn-secondary" disabled={releaseMutation.isPending} onClick={() => releaseMutation.mutate()}><RotateCcw size={14} /> Release</button>
                  </div>
                )}
              </aside>
            </div>
          </>
        ) : (
          <EmptyState icon={<MessageCircle size={48} />} title="Comment task tidak ditemukan" />
        )}
      </div>
    </RoleGuard>
  )
}
