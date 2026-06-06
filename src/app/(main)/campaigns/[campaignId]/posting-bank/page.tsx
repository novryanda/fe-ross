'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FolderCheck, Plus, XCircle } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformBadge } from '@/components/ui/badges'
import { campaignsApi } from '@/lib/api/campaigns'
import {
  postingOrdersApi,
  type CreatePostingOrderDto,
  type PostingOrderListParams,
} from '@/lib/api/posting-orders'
import { orgUnitsApi } from '@/lib/api/org-units'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'
import type { Platform, PostingOrderStatus, PostingSubmissionStatus } from '@/types'
import { toast } from 'sonner'

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'X_TWITTER', label: 'X / Twitter' },
  { value: 'FACEBOOK', label: 'Facebook' },
]

function WorkflowChip({
  value,
  type,
}: {
  value: PostingOrderStatus | PostingSubmissionStatus
  type: 'order' | 'submission'
}) {
  const palette =
    type === 'order'
      ? {
          PUBLISHED_TO_QUEUE: { label: 'Published', color: 'var(--cyan)' },
          CLAIMED: { label: 'Claimed', color: 'var(--status-expired)' },
          COMPLETED: { label: 'Completed', color: 'var(--status-active)' },
          CANCELLED: { label: 'Cancelled', color: 'var(--status-rejected)' },
        }
      : {
          SUBMITTED: { label: 'Submitted', color: 'var(--status-expired)' },
          APPROVED_FOR_BLAST: { label: 'Approved', color: 'var(--status-active)' },
          REJECTED: { label: 'Rejected', color: 'var(--status-rejected)' },
        }

  const config = palette[value] ?? { label: value, color: 'var(--text-muted)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.18rem 0.55rem',
        borderRadius: 999,
        fontSize: '0.66rem',
        fontWeight: 800,
        color: config.color,
        background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${config.color} 28%, transparent)`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      {config.label}
    </span>
  )
}

export default function CampaignPostingBankPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [targetUnitId, setTargetUnitId] = useState('')
  const [platform, setPlatform] = useState<Platform>('INSTAGRAM')
  const [contentDriveUrl, setContentDriveUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [caption, setCaption] = useState('')
  const [description, setDescription] = useState('')

  const campaignQuery = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  })
  const orgUnitsQuery = useQuery({
    queryKey: ['org-units', 'posting-bank'],
    queryFn: () => orgUnitsApi.list({ limit: 100, status: 'ACTIVE' }),
  })

  const orderParams = useMemo<PostingOrderListParams>(() => ({
    limit: 50,
    search: search || undefined,
    platform: (platformFilter || undefined) as Platform | undefined,
    status: (orderStatusFilter || undefined) as PostingOrderStatus | undefined,
  }), [orderStatusFilter, platformFilter, search])

  const submissionParams = useMemo<PostingOrderListParams>(() => ({
    limit: 50,
    platform: (platformFilter || undefined) as Platform | undefined,
    submissionStatus: (submissionStatusFilter || undefined) as PostingSubmissionStatus | undefined,
  }), [platformFilter, submissionStatusFilter])

  const ordersQuery = useQuery({
    queryKey: ['posting-orders', campaignId, orderParams],
    queryFn: () => postingOrdersApi.listCampaignOrders(campaignId, orderParams),
  })
  const submissionsQuery = useQuery({
    queryKey: ['posting-submissions', campaignId, submissionParams],
    queryFn: () => postingOrdersApi.listCampaignSubmissions(campaignId, submissionParams),
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreatePostingOrderDto) => postingOrdersApi.createCampaignOrder(campaignId, dto),
    onSuccess: () => {
      toast.success('Posting order berhasil dibuat.')
      setIsCreateOpen(false)
      setTargetUnitId('')
      setPlatform('INSTAGRAM')
      setContentDriveUrl('')
      setScheduledAt('')
      setCaption('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['posting-orders', campaignId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: PostingSubmissionStatus }) =>
      postingOrdersApi.reviewSubmission(submissionId, { status }),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'APPROVED_FOR_BLAST' ? 'Submission di-approve untuk blast.' : 'Submission ditolak.')
      queryClient.invalidateQueries({ queryKey: ['posting-submissions', campaignId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const blastMutation = useMutation({
    mutationFn: (submissionId: string) => postingOrdersApi.createBlastFromSubmission(campaignId, submissionId),
    onSuccess: () => {
      toast.success('Blast target dibuat dari submission PIC.')
      queryClient.invalidateQueries({ queryKey: ['posting-submissions', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const orders = ordersQuery.data?.data ?? []
  const submissions = submissionsQuery.data?.data ?? []
  const canCreate =
    targetUnitId &&
    platform &&
    contentDriveUrl.startsWith('http') &&
    scheduledAt

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Posting Bank</div>
            <h2 className="section-title">Campaign Posting Orders</h2>
            <p className="section-subtitle">
              Buat posting order untuk PIC berdasarkan unit organisasi, lalu review hasil submission sebelum dijadikan blast source.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={14} /> New Posting Order
          </button>
        </div>

        <div className="info-banner info-banner-cyan">
          PIC mengambil order dari queue unitnya, memilih akun sosmed miliknya sendiri saat submit, lalu admin meng-approve submission untuk blast.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search caption, description, or unit..."
          filters={[
            { label: 'Platform', value: platformFilter, options: platformOptions, onChange: setPlatformFilter },
            {
              label: 'Order Status',
              value: orderStatusFilter,
              options: [
                { value: 'PUBLISHED_TO_QUEUE', label: 'Published' },
                { value: 'CLAIMED', label: 'Claimed' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ],
              onChange: setOrderStatusFilter,
            },
            {
              label: 'Submission',
              value: submissionStatusFilter,
              options: [
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'APPROVED_FOR_BLAST', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
              onChange: setSubmissionStatusFilter,
            },
          ]}
          actions={
            <Link href={`/campaigns/${campaignId}/blast-links/new`} className="btn-secondary" style={{ textDecoration: 'none' }}>
              Create Blast From PIC
            </Link>
          }
        />

        {(ordersQuery.isError || submissionsQuery.isError) && (
          <ErrorState
            title="Gagal memuat data posting bank"
            message={mapApiErrorToToastMessage(ordersQuery.error ?? submissionsQuery.error)}
            retry={() => {
              ordersQuery.refetch()
              submissionsQuery.refetch()
            }}
          />
        )}

        {!ordersQuery.isError && !submissionsQuery.isError && (
          <div className="two-col" style={{ alignItems: 'start' }}>
            <section className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Posting Orders</h3>
                  <p className="muted-meta">Queue yang akan dibaca PIC sesuai unit target.</p>
                </div>
                <span className="selected-chip">{orders.length} orders</span>
              </div>

              {ordersQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton" style={{ height: 58, borderRadius: 12, marginBottom: '0.65rem' }} />
                ))
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={<FolderCheck size={44} />}
                  title="Belum ada posting order"
                  description="Buat posting order pertama untuk campaign ini."
                  action={<button type="button" className="btn-primary" onClick={() => setIsCreateOpen(true)}>Create Order</button>}
                />
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {orders.map((order) => (
                    <article key={order.id} className="preview-card" style={{ display: 'grid', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <PlatformBadge platform={order.platform} size="sm" />
                            <WorkflowChip type="order" value={order.status} />
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.45rem' }}>
                            {order.targetUnit?.name ?? 'Unknown Unit'}
                          </div>
                        </div>
                        <a href={order.contentDriveUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                          Open Drive
                        </a>
                      </div>
                      <div className="muted-meta">Schedule: {formatDateTime(order.scheduledAt)}</div>
                      {order.caption && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Caption: {order.caption}</div>}
                      {order.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Desc: {order.description}</div>}
                      {order.claimedByUser && (
                        <div className="muted-meta">
                          Claimed by {order.claimedByUser.name} {order.claimedAt ? `at ${formatDateTime(order.claimedAt)}` : ''}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>PIC Submissions</h3>
                  <p className="muted-meta">Review hasil posting sebelum dijadikan sumber blast.</p>
                </div>
                <span className="selected-chip">{submissions.length} submissions</span>
              </div>

              {submissionsQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: '0.65rem' }} />
                ))
              ) : submissions.length === 0 ? (
                <EmptyState
                  icon={<FolderCheck size={44} />}
                  title="Belum ada submission"
                  description="Submission PIC akan muncul di sini setelah mereka submit hasil posting."
                />
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {submissions.map((submission) => (
                    <article key={submission.id} className="preview-card" style={{ display: 'grid', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <PlatformBadge platform={submission.postingOrder?.platform ?? submission.socialAccount?.platform ?? 'INSTAGRAM'} size="sm" />
                            <WorkflowChip type="submission" value={submission.status} />
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginTop: '0.45rem' }}>
                            {submission.submittedByUser?.name ?? submission.submittedById}
                          </div>
                          <div className="muted-meta">
                            {submission.socialAccount ? `@${submission.socialAccount.username}` : submission.socialAccountId}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={submission.postedUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                            Posted URL
                          </a>
                          <a href={submission.proofDriveUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                            Proof Drive
                          </a>
                        </div>
                      </div>

                      <div className="muted-meta">
                        Submitted at {formatDateTime(submission.submittedAt)}
                      </div>
                      {submission.notes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{submission.notes}</div>}

                      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        {submission.status === 'SUBMITTED' && (
                          <>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: 'APPROVED_FOR_BLAST' })}
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: 'REJECTED' })}
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {submission.status === 'APPROVED_FOR_BLAST' && !submission.blastTargetId && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => blastMutation.mutate(submission.id)}
                            disabled={blastMutation.isPending}
                          >
                            Create Blast Target
                          </button>
                        )}

                        {submission.blastTargetId && (
                          <Link href={`/campaigns/${campaignId}/blast-links/${submission.blastTargetId}`} className="btn-ghost" style={{ textDecoration: 'none' }}>
                            Open Blast Target
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <Modal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Posting Order"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Select
              label="Target PIC Unit"
              value={targetUnitId}
              onChange={(event) => setTargetUnitId(event.target.value)}
              options={(orgUnitsQuery.data?.data ?? []).map((unit) => ({
                value: unit.id,
                label: unit.parent ? `${unit.parent.name} / ${unit.name}` : unit.name,
              }))}
              placeholder="Select unit"
            />
            <Select
              label="Platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as Platform)}
              options={platformOptions}
            />
            <Input
              label="Content Drive URL"
              type="url"
              value={contentDriveUrl}
              onChange={(event) => setContentDriveUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
            />
            <Input
              label="Scheduled At"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
            <Input
              label="Caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Optional caption"
            />
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input-field"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description or additional brief"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!canCreate || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    targetUnitId,
                    platform,
                    contentDriveUrl,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    caption: caption || undefined,
                    description: description || undefined,
                  })
                }
              >
                Create Order
              </button>
            </div>
          </div>
        </Modal>
      </CampaignShell>
    </RoleGuard>
  )
}
