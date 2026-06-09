'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FolderCheck, MessageCircle, Send } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { Input } from '@/components/ui/input'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { campaignsApi } from '@/lib/api/campaigns'
import { commentCommandsApi } from '@/lib/api/comment-commands'
import { postingOrdersApi } from '@/lib/api/posting-orders'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'
import type { CommentCommandStatus, PostingSubmission, Stance } from '@/types'
import { toast } from 'sonner'

export default function CreateCommandFromPicPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedSubmission, setSelectedSubmission] = useState<PostingSubmission | null>(null)
  const [stance, setStance] = useState<Stance>('PRO')
  const [narrative, setNarrative] = useState('')
  const [instruction, setInstruction] = useState('')
  const [requiredSlots, setRequiredSlots] = useState(3)
  const [keepExpiryMinutes, setKeepExpiryMinutes] = useState(120)
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<Extract<CommentCommandStatus, 'DRAFT' | 'ACTIVE'>>('ACTIVE')

  const campaignQuery = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  })

  const submissionsQuery = useQuery({
    queryKey: ['eligible-pic-submissions-comment', campaignId],
    queryFn: () => postingOrdersApi.listCampaignSubmissions(campaignId, { limit: 100, eligibleForComment: true }),
  })

  const createMutation = useMutation({
    mutationFn: (submissionId: string) =>
      commentCommandsApi.createFromSubmission(campaignId, submissionId, {
        stance,
        narrative,
        instruction: instruction || undefined,
        requiredSlots,
        keepExpiryMinutes,
        deadline: new Date(deadline).toISOString(),
        status,
      }),
    onSuccess: (command) => {
      toast.success('Comment command dibuat dari submission PIC.')
      queryClient.invalidateQueries({ queryKey: ['eligible-pic-submissions-comment', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['comment-commands', campaignId] })
      router.push(`/campaigns/${campaignId}/commands/${command.id}`)
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const submissions = submissionsQuery.data?.data ?? []

  const handleSelectSubmission = (submission: PostingSubmission) => {
    setSelectedSubmission(submission)
    setInstruction(submission.notes ?? submission.postingOrder?.description ?? submission.postingOrder?.caption ?? '')
  }

  useEffect(() => {
    const submissionId = searchParams.get('submissionId')
    if (!submissionId || submissions.length === 0) return
    const match = submissions.find((item) => item.id === submissionId)
    if (match) handleSelectSubmission(match)
  }, [searchParams, submissions])

  const canCreate = useMemo(
    () => Boolean(selectedSubmission && narrative.trim() && deadline && requiredSlots > 0),
    [deadline, narrative, requiredSlots, selectedSubmission],
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedSubmission || !canCreate) {
      toast.error('Lengkapi field wajib sebelum membuat command.')
      return
    }
    createMutation.mutate(selectedSubmission.id)
  }

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <Link href={`/campaigns/${campaignId}/commands`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
              <ArrowLeft size={15} /> Back to Comment Commands
            </Link>
            <div className="section-kicker">Comment Source Picker</div>
            <h2 className="section-title">Create Command From PIC Submission</h2>
            <p className="section-subtitle">
              Pilih submission PIC yang sudah approved, lalu tentukan stance, narasi, slot, dan deadline untuk comment command.
            </p>
          </div>
        </div>

        <div className="info-banner info-banner-cyan">
          Comment command akan mengambil snapshot dari posted URL dan akun sosmed PIC pada saat dibuat. Perubahan submission setelah itu tidak akan mengubah command yang sudah tercipta.
        </div>

        {submissionsQuery.isLoading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 96, borderRadius: 16 }} />
            ))}
          </div>
        ) : submissionsQuery.isError ? (
          <ErrorState
            title="Gagal memuat submission PIC"
            message={mapApiErrorToToastMessage(submissionsQuery.error)}
            retry={() => submissionsQuery.refetch()}
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<FolderCheck size={48} />}
            title="Belum ada submission eligible"
            description="Approve submission PIC dari Posting Bank dulu, lalu submission yang eligible untuk comment command akan muncul di sini."
            action={
              <Link href={`/campaigns/${campaignId}/posting-bank`} className="btn-primary" style={{ textDecoration: 'none' }}>
                Open Posting Bank
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {submissions.map((submission) => {
              const isSelected = selectedSubmission?.id === submission.id
              const platform = submission.postingOrder?.platform ?? submission.socialAccount?.platform ?? 'INSTAGRAM'

              return (
                <article
                  key={submission.id}
                  className="card"
                  style={{
                    padding: '1rem',
                    display: 'grid',
                    gap: '0.7rem',
                    borderColor: isSelected ? 'var(--cyan)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <PlatformBadge platform={platform} size="sm" />
                        <span className="selected-chip">Approved Submission</span>
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                        {submission.submittedByUser?.name ?? submission.submittedById}
                      </div>
                      <div className="muted-meta">
                        {submission.socialAccount
                          ? <SocialAccountUsernameLink account={submission.socialAccount} style={{ fontWeight: 700 }} />
                          : submission.socialAccountId}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a href={submission.postedUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                        Open Post
                      </a>
                      <a href={submission.proofDriveUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                        Open Proof
                      </a>
                    </div>
                  </div>

                  <div className="muted-meta">
                    Submitted at {formatDateTime(submission.submittedAt)}
                  </div>
                  {submission.notes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{submission.notes}</div>}

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {submission.commentCommandId ? (
                      <Link href={`/campaigns/${campaignId}/commands/${submission.commentCommandId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                        Existing Comment Command
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={isSelected ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => handleSelectSubmission(submission)}
                      >
                        <MessageCircle size={14} /> {isSelected ? 'Selected' : 'Configure Command'}
                      </button>
                    )}
                  </div>

                  {isSelected && !submission.commentCommandId && (
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="muted-meta" style={{ wordBreak: 'break-all' }}>
                        Target: {submission.postedUrl}
                      </div>

                      <div className="status-card-grid">
                        {(['PRO', 'KONTRA'] as Stance[]).map((item) => (
                          <button key={item} type="button" className={`status-select-card ${stance === item ? 'selected' : ''}`} onClick={() => setStance(item)}>
                            <StanceBadge stance={item} />
                          </button>
                        ))}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Narrative <span className="required-dot">Required</span></label>
                        <textarea className="input-field" rows={3} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Tuliskan narasi komentar..." style={{ resize: 'vertical' }} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Instruction <span className="form-label-optional">Optional</span></label>
                        <textarea className="input-field" rows={2} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Instruksi tambahan untuk Buzzer..." style={{ resize: 'vertical' }} />
                      </div>

                      <div className="field-grid-2">
                        <Input label="Required Slots" type="number" min={1} value={requiredSlots} onChange={(event) => setRequiredSlots(Number(event.target.value))} required />
                        <Input label="Keep Expiry (minutes)" type="number" min={1} max={1440} value={keepExpiryMinutes} onChange={(event) => setKeepExpiryMinutes(Number(event.target.value))} />
                        <Input label="Deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <div className="status-card-grid">
                            {(['DRAFT', 'ACTIVE'] as const).map((item) => (
                              <button key={item} type="button" className={`status-select-card ${status === item ? 'selected' : ''}`} onClick={() => setStatus(item)}>
                                <StatusBadge status={item} type="command" size="sm" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" disabled={!canCreate || createMutation.isPending}>
                          <Send size={14} /> Create Comment Command
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </CampaignShell>
    </RoleGuard>
  )
}
