'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, FolderCheck, Plus, XCircle } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { campaignsApi } from '@/lib/api/campaigns'
import {
  postingOrdersApi,
  type CreatePostingOrderDto,
  type PostingOrderListParams,
} from '@/lib/api/posting-orders'
import { orgUnitsApi } from '@/lib/api/org-units'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/utils'
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
          PUBLISHED_TO_QUEUE: { label: 'Assigned', color: 'var(--cyan)' },
          CLAIMED: { label: 'Assigned', color: 'var(--cyan)' },
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
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersLimit, setOrdersLimit] = useState(10)
  const [submissionsPage, setSubmissionsPage] = useState(1)
  const [submissionsLimit, setSubmissionsLimit] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [targetUnitId, setTargetUnitId] = useState('')
  const [title, setTitle] = useState('')
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

  useEffect(() => {
    setOrdersPage(1)
    setSubmissionsPage(1)
  }, [search, platformFilter, orderStatusFilter, submissionStatusFilter])

  const orderParams = useMemo<PostingOrderListParams>(() => ({
    page: ordersPage,
    limit: ordersLimit,
    search: search || undefined,
    platform: (platformFilter || undefined) as Platform | undefined,
    status: (orderStatusFilter || undefined) as PostingOrderStatus | undefined,
  }), [orderStatusFilter, ordersLimit, ordersPage, platformFilter, search])

  const submissionParams = useMemo<PostingOrderListParams>(() => ({
    page: submissionsPage,
    limit: submissionsLimit,
    platform: (platformFilter || undefined) as Platform | undefined,
    submissionStatus: (submissionStatusFilter || undefined) as PostingSubmissionStatus | undefined,
  }), [platformFilter, submissionStatusFilter, submissionsLimit, submissionsPage])

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
      setTitle('')
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
  const ordersMeta = ordersQuery.data?.meta
  const submissions = submissionsQuery.data?.data ?? []
  const submissionsMeta = submissionsQuery.data?.meta
  const canCreate =
    targetUnitId &&
    title.trim() &&
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
          Posting order adalah tugas ke semua PIC di unit target. Setiap PIC submit hasilnya dengan akun sendiri, lalu admin meng-approve submission yang layak untuk blast.
        </div>

        <DataFilters
          search={search}
          onSearchChange={(value) => { setSearch(value); setOrdersPage(1) }}
          placeholder="Search judul, caption, description, atau unit..."
          filters={[
            { label: 'Platform', value: platformFilter, options: platformOptions, onChange: (value) => { setPlatformFilter(value); setOrdersPage(1); setSubmissionsPage(1) } },
            {
              label: 'Order Status',
              value: orderStatusFilter,
              options: [
                { value: 'PUBLISHED_TO_QUEUE', label: 'Assigned' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ],
              onChange: (value) => { setOrderStatusFilter(value); setOrdersPage(1) },
            },
            {
              label: 'Submission',
              value: submissionStatusFilter,
              options: [
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'APPROVED_FOR_BLAST', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
              onChange: (value) => { setSubmissionStatusFilter(value); setSubmissionsPage(1) },
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
          <div className="posting-bank-stack">
            <section className="posting-bank-section">
              <div className="posting-bank-section-header">
                <div>
                  <h3 className="posting-bank-section-title">Posting Orders</h3>
                  <p className="muted-meta">Daftar tugas posting yang harus dikerjakan semua PIC di unit target.</p>
                </div>
                <span className="selected-chip">{ordersMeta?.total ?? orders.length} orders</span>
              </div>

              {ordersQuery.isLoading ? (
                <div className="data-table-container" style={{ padding: '1rem' }}>
                  <Skeleton height={46} />
                  <Skeleton height={52} style={{ marginTop: '0.65rem' }} />
                  <Skeleton height={52} style={{ marginTop: '0.65rem' }} />
                </div>
              ) : (ordersMeta?.total ?? 0) === 0 ? (
                <EmptyState
                  icon={<FolderCheck size={44} />}
                  title="Belum ada posting order"
                  description="Buat posting order pertama untuk campaign ini."
                  action={<button type="button" className="btn-primary" onClick={() => setIsCreateOpen(true)}>Create Order</button>}
                />
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Title</th>
                        <th>Target Unit</th>
                        <th>Schedule</th>
                        <th>Submissions</th>
                        <th>Status</th>
                        <th>Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td><PlatformBadge platform={order.platform} size="sm" /></td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{order.title}</div>
                            {order.caption && (
                              <div className="muted-meta" style={{ marginTop: '0.2rem', maxWidth: 280 }}>
                                {order.caption}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{order.targetUnit?.name ?? 'Unknown Unit'}</td>
                          <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(order.scheduledAt)}</td>
                          <td style={{ fontWeight: 700 }}>{order.submissionCount ?? 0}</td>
                          <td><WorkflowChip type="order" value={order.status} /></td>
                          <td>
                            <a href={order.contentDriveUrl} target="_blank" rel="noreferrer" className="ext-link">
                              Open Drive <ExternalLink size={11} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationControls
                    meta={ordersMeta}
                    pageSize={ordersLimit}
                    itemLabel="posting orders"
                    onPageChange={setOrdersPage}
                    onPageSizeChange={(value) => {
                      setOrdersLimit(value)
                      setOrdersPage(1)
                    }}
                  />
                </div>
              )}
            </section>

            <section className="posting-bank-section">
              <div className="posting-bank-section-header">
                <div>
                  <h3 className="posting-bank-section-title">PIC Submissions</h3>
                  <p className="muted-meta">Review hasil posting sebelum dijadikan sumber blast.</p>
                </div>
                <span className="selected-chip">{submissionsMeta?.total ?? submissions.length} submissions</span>
              </div>

              {submissionsQuery.isLoading ? (
                <div className="data-table-container" style={{ padding: '1rem' }}>
                  <Skeleton height={46} />
                  <Skeleton height={52} style={{ marginTop: '0.65rem' }} />
                  <Skeleton height={52} style={{ marginTop: '0.65rem' }} />
                </div>
              ) : (submissionsMeta?.total ?? 0) === 0 ? (
                <EmptyState
                  icon={<FolderCheck size={44} />}
                  title="Belum ada submission"
                  description="Submission PIC akan muncul di sini setelah mereka submit hasil posting."
                />
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>PIC</th>
                        <th>Social Account</th>
                        <th>Posted URL</th>
                        <th>Proof</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>
                            <PlatformBadge
                              platform={submission.postingOrder?.platform ?? submission.socialAccount?.platform ?? 'INSTAGRAM'}
                              size="sm"
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                              {submission.submittedByUser?.name ?? submission.submittedById}
                            </div>
                            {submission.postingOrder?.title && (
                              <div className="muted-meta" style={{ marginTop: '0.2rem' }}>
                                {submission.postingOrder.title}
                              </div>
                            )}
                          </td>
                          <td>
                            {submission.socialAccount
                              ? <SocialAccountUsernameLink account={submission.socialAccount} />
                              : submission.socialAccountId}
                          </td>
                          <td>
                            <a href={submission.postedUrl} target="_blank" rel="noreferrer" className="ext-link" style={{ maxWidth: 220, display: 'inline-flex' }}>
                              {submission.postedUrl.replace(/^https?:\/\//, '').slice(0, 42)}
                              {(submission.postedUrl.replace(/^https?:\/\//, '').length > 42) ? '…' : ''}
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td>
                            <a href={submission.proofDriveUrl} target="_blank" rel="noreferrer" className="ext-link">
                              Proof <ExternalLink size={11} />
                            </a>
                          </td>
                          <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {formatDate(submission.submittedAt)}
                          </td>
                          <td><WorkflowChip type="submission" value={submission.status} /></td>
                          <td>
                            <div className="action-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                              {submission.status === 'SUBMITTED' && (
                                <>
                                  <button
                                    type="button"
                                    className="icon-action"
                                    onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: 'APPROVED_FOR_BLAST' })}
                                    disabled={reviewMutation.isPending}
                                  >
                                    <CheckCircle2 size={13} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-action danger"
                                    onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: 'REJECTED' })}
                                    disabled={reviewMutation.isPending}
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </>
                              )}

                              {submission.status === 'APPROVED_FOR_BLAST' && !submission.blastTargetId && (
                                <button
                                  type="button"
                                  className="icon-action"
                                  onClick={() => blastMutation.mutate(submission.id)}
                                  disabled={blastMutation.isPending}
                                >
                                  Create Blast
                                </button>
                              )}

                              {submission.status === 'APPROVED_FOR_BLAST' && !submission.commentCommandId && (
                                <Link
                                  href={`/campaigns/${campaignId}/commands/from-pic?submissionId=${submission.id}`}
                                  className="icon-action"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Create Comment
                                </Link>
                              )}

                              {submission.blastTargetId && (
                                <Link href={`/campaigns/${campaignId}/blast-links/${submission.blastTargetId}`} className="icon-action" style={{ textDecoration: 'none' }}>
                                  Open Blast
                                </Link>
                              )}

                              {submission.commentCommandId && (
                                <Link href={`/campaigns/${campaignId}/commands/${submission.commentCommandId}`} className="icon-action" style={{ textDecoration: 'none' }}>
                                  Open Command
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationControls
                    meta={submissionsMeta}
                    pageSize={submissionsLimit}
                    itemLabel="submissions"
                    onPageChange={setSubmissionsPage}
                    onPageSizeChange={(value) => {
                      setSubmissionsLimit(value)
                      setSubmissionsPage(1)
                    }}
                  />
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
            <Input
              label="Judul Bank Konten"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Video Literasi Digital TikTok"
            />
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
                    title: title.trim(),
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
