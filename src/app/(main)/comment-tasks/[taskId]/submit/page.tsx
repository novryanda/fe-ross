'use client'
import Link from 'next/link'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle, ExternalLink, FileText, Link2, MessageCircle } from 'lucide-react'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { EmptyState } from '@/components/ui/empty-state'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuth } from '@/hooks/use-auth'
import { isGoogleDriveUrl, isValidUrl, formatDate } from '@/lib/utils'
import { commentTasksApi } from '@/lib/api/comment-commands'
import { isApiError, mapApiErrorToToastMessage } from '@/lib/api/errors'
import { toast } from 'sonner'

export default function SubmitCommentTaskPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const taskQuery = useQuery({ queryKey: ['buzzer-comment-task', taskId], queryFn: () => commentTasksApi.get(taskId) })
  const task = taskQuery.data
  const command = task?.command
  const [proofLink, setProofLink] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const submitMutation = useMutation({
    mutationFn: () => commentTasksApi.complete(taskId, { proofLink, notes: notes || undefined }),
    onSuccess: (completedTask) => {
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      if (completedTask.command?.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['comment-commands', completedTask.command.campaignId] })
        queryClient.invalidateQueries({ queryKey: ['comment-tasks', completedTask.command.campaignId] })
      }
      toast.success('Proof comment task berhasil dikirim.')
      router.push('/comment-tasks')
    },
    onError: (err) => {
      if (isApiError(err) && err.code === 'VALIDATION_ERROR') {
        toast.error(err.details[0]?.message ?? 'Input proof tidak valid.')
        return
      }
      toast.error(mapApiErrorToToastMessage(err))
    },
  })

  const canSubmit = task?.keptBy === user?.id && task && ['KEPT', 'IN_PROGRESS'].includes(task.status)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!proofLink) {
      setError('Proof link wajib diisi.')
      return
    }
    if (!isValidUrl(proofLink)) {
      setError('URL tidak valid.')
      return
    }
    if (!canSubmit) {
      toast.error('Task ini harus di-keep oleh akun Anda sebelum proof dapat dikirim.')
      return
    }
    setError('')
    submitMutation.mutate()
  }

  return (
    <RoleGuard roles={['BUZZER']}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
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
                <div className="section-kicker">Comment Proof</div>
                <h1 className="section-title" style={{ fontSize: '2rem' }}>Submit Comment Task</h1>
                <p className="section-subtitle">Submit proof hanya untuk comment slot yang sudah Anda Keep.</p>
              </div>
              <StatusBadge status={task.status} type="task" size="sm" />
            </div>

            {!canSubmit && task.status !== 'COMPLETED' && (
              <div className="campaign-summary-panel" style={{ borderColor: 'rgba(245,158,11,0.35)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--status-kept)' }} />
                  <div>
                    <strong>Task belum bisa disubmit.</strong>
                    <p className="muted-meta" style={{ marginTop: '0.35rem' }}>Task ini harus di-keep oleh current user sebelum proof dapat dikirim.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="campaign-create-grid">
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <MessageCircle size={15} style={{ color: 'var(--cyan)' }} />
                    <strong>Narrative</strong>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{command.narrative}</p>
                  {command.instruction && <p className="muted-meta" style={{ marginTop: '1rem' }}><strong>Instruction:</strong> {command.instruction}</p>}
                </section>

                <form onSubmit={handleSubmit} className="campaign-create-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FileText size={15} style={{ color: 'var(--cyan)' }} />
                    <strong>Proof Submission</strong>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="proofLink"><Link2 size={13} style={{ display: 'inline' }} /> Proof Link <span className="required-dot">Required</span></label>
                    <input id="proofLink" type="url" className="input-field" value={proofLink} onChange={event => { setProofLink(event.target.value); setError('') }} placeholder="https://drive.google.com/file/d/..." style={{ borderColor: error ? 'var(--status-expired)' : undefined }} />
                    {error && <span className="form-error">{error}</span>}
                    {proofLink && isValidUrl(proofLink) && isGoogleDriveUrl(proofLink) && <div className="proof-hint success"><CheckCircle size={13} /> Google Drive URL detected.</div>}
                    {proofLink && isValidUrl(proofLink) && !isGoogleDriveUrl(proofLink) && <div className="proof-hint warning"><AlertTriangle size={13} /> URL bukan Google Drive. Disarankan gunakan Drive agar mudah diverifikasi.</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">Notes <span className="form-label-optional">Optional</span></label>
                    <textarea id="notes" className="input-field" rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Catatan tambahan..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/comment-tasks" className="btn-secondary">Cancel</Link>
                    <button type="submit" disabled={!canSubmit || task.status === 'COMPLETED' || submitMutation.isPending} className="btn-primary"><CheckCircle size={15} /> {submitMutation.isPending ? 'Submitting...' : 'Submit Proof'}</button>
                  </div>
                </form>
              </div>

              <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
                <div className="campaign-summary-panel">
                  <strong>Keep State</strong>
                  <div className="summary-line"><div className="summary-label">Slot</div><div className="summary-value">#{task.taskNo}</div></div>
                  <div className="summary-line"><div className="summary-label">Kept By</div><div className="summary-value">{task.keptByUser?.name ?? '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Kept At</div><div className="summary-value">{task.keptAt ? formatDate(task.keptAt) : '-'}</div></div>
                  <div className="summary-line"><div className="summary-label">Expires</div><div className="summary-value">{task.keepExpiresAt ? formatDate(task.keepExpiresAt) : '-'}</div></div>
                </div>
                <div className="campaign-summary-panel">
                  <strong>Validation</strong>
                  <div className="checklist-item">
                    {proofLink && isValidUrl(proofLink) ? <CheckCircle size={18} style={{ color: 'var(--status-active)' }} /> : <AlertTriangle size={18} style={{ color: 'var(--status-kept)' }} />}
                    <div style={{ fontWeight: 800 }}>Proof link required</div>
                    <div className={`checklist-status ${proofLink && isValidUrl(proofLink) ? 'ready' : ''}`}>{proofLink && isValidUrl(proofLink) ? 'Siap' : 'Belum valid'}</div>
                  </div>
                </div>
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
