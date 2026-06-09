'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, FolderCheck } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PlatformBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { campaignsApi } from '@/lib/api/campaigns'
import { postingOrdersApi } from '@/lib/api/posting-orders'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function NewBlastLinkPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const campaignQuery = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  })

  const submissionsQuery = useQuery({
    queryKey: ['eligible-pic-submissions', campaignId],
    queryFn: () => postingOrdersApi.listCampaignSubmissions(campaignId, { limit: 100, eligibleForBlast: true }),
  })

  const createMutation = useMutation({
    mutationFn: (submissionId: string) => postingOrdersApi.createBlastFromSubmission(campaignId, submissionId),
    onSuccess: (data) => {
      toast.success('Blast target dibuat dari submission PIC.')
      queryClient.invalidateQueries({ queryKey: ['eligible-pic-submissions', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      const targetId =
        typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string'
          ? data.id
          : null
      if (targetId) {
        router.push(`/campaigns/${campaignId}/blast-links/${targetId}`)
        return
      }
      router.push(`/campaigns/${campaignId}/blast-links`)
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const submissions = submissionsQuery.data?.data ?? []

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <Link href={`/campaigns/${campaignId}/blast-links`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
              <ArrowLeft size={15} /> Back to Blast Links
            </Link>
            <div className="section-kicker">Blast Source Picker</div>
            <h2 className="section-title">Create Blast From PIC Submission</h2>
            <p className="section-subtitle">
              Admin tidak mengetik URL posting manual lagi. Pilih submission PIC yang sudah approved untuk dijadikan blast target snapshot.
            </p>
          </div>
        </div>

        <div className="info-banner info-banner-cyan">
          Blast target akan mengambil snapshot dari posted URL dan akun sosmed PIC pada saat dibuat. Perubahan submission setelah itu tidak akan mengubah blast target yang sudah tercipta.
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
            description="Approve submission PIC dari Posting Bank dulu, lalu submission yang eligible untuk blast akan muncul di sini."
            action={
              <Link href={`/campaigns/${campaignId}/posting-bank`} className="btn-primary" style={{ textDecoration: 'none' }}>
                Open Posting Bank
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {submissions.map((submission) => (
              <article key={submission.id} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <PlatformBadge platform={submission.postingOrder?.platform ?? submission.socialAccount?.platform ?? 'INSTAGRAM'} size="sm" />
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
                  {submission.blastTargetId ? (
                    <Link href={`/campaigns/${campaignId}/blast-links/${submission.blastTargetId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                      Existing Blast Target
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={createMutation.isPending}
                      onClick={() => createMutation.mutate(submission.id)}
                    >
                      <CheckCircle2 size={14} /> Create Blast Target
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </CampaignShell>
    </RoleGuard>
  )
}
