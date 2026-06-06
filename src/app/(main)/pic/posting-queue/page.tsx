'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Inbox, Send } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformBadge } from '@/components/ui/badges'
import { postingOrdersApi } from '@/lib/api/posting-orders'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { useAuth } from '@/hooks/use-auth'
import { formatDateTime } from '@/lib/utils'
import type { Platform, PostingOrderStatus } from '@/types'
import { toast } from 'sonner'

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'X_TWITTER', label: 'X / Twitter' },
  { value: 'FACEBOOK', label: 'Facebook' },
]

function OrderChip({ status }: { status: PostingOrderStatus }) {
  const config: Record<PostingOrderStatus, { label: string; color: string }> = {
    PUBLISHED_TO_QUEUE: { label: 'Published', color: 'var(--cyan)' },
    CLAIMED: { label: 'Claimed', color: 'var(--status-expired)' },
    COMPLETED: { label: 'Completed', color: 'var(--status-active)' },
    CANCELLED: { label: 'Cancelled', color: 'var(--status-rejected)' },
  }
  const current = config[status] ?? { label: status, color: 'var(--text-muted)' }
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
        color: current.color,
        background: `color-mix(in srgb, ${current.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${current.color} 28%, transparent)`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: current.color }} />
      {current.label}
    </span>
  )
}

export default function PicPostingQueuePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [submitOrderId, setSubmitOrderId] = useState<string | null>(null)
  const [socialAccountId, setSocialAccountId] = useState('')
  const [postedUrl, setPostedUrl] = useState('')
  const [proofDriveUrl, setProofDriveUrl] = useState('')
  const [notes, setNotes] = useState('')

  const queueQuery = useQuery({
    queryKey: ['pic-posting-queue', search, platformFilter],
    queryFn: () =>
      postingOrdersApi.getPicQueue({
        limit: 50,
        search: search || undefined,
        platform: (platformFilter || undefined) as Platform | undefined,
      }),
  })

  const accountsQuery = useQuery({
    queryKey: ['pic-social-accounts', 'active'],
    queryFn: () => socialAccountsApi.list({ limit: 100, status: 'ACTIVE' }),
  })

  const claimMutation = useMutation({
    mutationFn: (orderId: string) => postingOrdersApi.claimOrder(orderId),
    onSuccess: () => {
      toast.success('Order berhasil di-claim.')
      queryClient.invalidateQueries({ queryKey: ['pic-posting-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pic-my-submissions'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const releaseMutation = useMutation({
    mutationFn: (orderId: string) => postingOrdersApi.releaseOrder(orderId),
    onSuccess: () => {
      toast.success('Order berhasil dilepas kembali ke queue.')
      queryClient.invalidateQueries({ queryKey: ['pic-posting-queue'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const submitMutation = useMutation({
    mutationFn: (orderId: string) =>
      postingOrdersApi.submitOrder(orderId, {
        socialAccountId,
        postedUrl,
        proofDriveUrl,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Hasil posting berhasil disubmit.')
      setSubmitOrderId(null)
      setSocialAccountId('')
      setPostedUrl('')
      setProofDriveUrl('')
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['pic-posting-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pic-my-submissions'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const orders = queueQuery.data?.data ?? []
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === submitOrderId),
    [orders, submitOrderId],
  )
  const eligibleAccounts = useMemo(
    () =>
      (accountsQuery.data?.data ?? []).filter((account) =>
        selectedOrder ? account.platform === selectedOrder.platform : true,
      ),
    [accountsQuery.data?.data, selectedOrder],
  )

  return (
    <RoleGuard roles={['PIC']}>
      <div className="page-container">
        <PageHeader
          title="Posting Queue"
          subtitle="Ambil posting order dari unit Anda, kerjakan postingnya, lalu submit URL hasil dan bukti drive."
        />

        <div className="info-banner info-banner-cyan">
          Gunakan akun sosmed milik Anda sendiri saat submit hasil posting. Submission akan direview admin sebelum bisa dipakai sebagai blast source.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search queue..."
          filters={[
            { label: 'Platform', value: platformFilter, options: platformOptions, onChange: setPlatformFilter },
          ]}
        />

        {queueQuery.isLoading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 86, borderRadius: 16 }} />
            ))}
          </div>
        ) : queueQuery.isError ? (
          <ErrorState
            title="Gagal memuat queue"
            message={mapApiErrorToToastMessage(queueQuery.error)}
            retry={() => queueQuery.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Inbox size={48} />}
            title="Queue kosong"
            description="Belum ada posting order yang cocok dengan unit atau filter Anda."
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {orders.map((order) => {
              const isClaimedByMe = order.claimedById === user?.id
              return (
                <article key={order.id} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <PlatformBadge platform={order.platform} size="sm" />
                        <OrderChip status={order.status} />
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                        {order.campaign?.name ?? 'Campaign'} / {order.targetUnit?.name ?? 'Unit'}
                      </div>
                    </div>
                    <a href={order.contentDriveUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                      Open Drive
                    </a>
                  </div>

                  <div className="muted-meta">Schedule: {formatDateTime(order.scheduledAt)}</div>
                  {order.caption && <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Caption: {order.caption}</div>}
                  {order.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Desc: {order.description}</div>}
                  {order.claimedByUser && (
                    <div className="muted-meta">
                      Claimed by {order.claimedByUser.name} {order.claimedAt ? `at ${formatDateTime(order.claimedAt)}` : ''}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {order.status === 'PUBLISHED_TO_QUEUE' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => claimMutation.mutate(order.id)}
                        disabled={claimMutation.isPending}
                      >
                        <CheckCircle2 size={14} /> Claim Order
                      </button>
                    )}
                    {isClaimedByMe && (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => setSubmitOrderId(order.id)}>
                          <Send size={14} /> Submit Result
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => releaseMutation.mutate(order.id)}
                          disabled={releaseMutation.isPending}
                        >
                          Release
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <Modal
          open={Boolean(submitOrderId)}
          onClose={() => setSubmitOrderId(null)}
          title="Submit Posting Result"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {selectedOrder && (
              <div className="preview-card">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <PlatformBadge platform={selectedOrder.platform} size="sm" />
                  <OrderChip status={selectedOrder.status} />
                </div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedOrder.campaign?.name ?? 'Campaign'} / {selectedOrder.targetUnit?.name ?? 'Unit'}
                </div>
              </div>
            )}

            <Select
              label="Akun Sosmed PIC"
              value={socialAccountId}
              onChange={(event) => setSocialAccountId(event.target.value)}
              options={eligibleAccounts.map((account) => ({
                value: account.id,
                label: `@${account.username}`,
              }))}
              placeholder="Pilih akun sosmed"
            />
            <Input
              label="Posted URL"
              type="url"
              value={postedUrl}
              onChange={(event) => setPostedUrl(event.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Proof Drive URL"
              type="url"
              value={proofDriveUrl}
              onChange={(event) => setProofDriveUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
            />
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="input-field"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-ghost" onClick={() => setSubmitOrderId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!submitOrderId || !socialAccountId || !postedUrl.startsWith('http') || !proofDriveUrl.startsWith('http') || submitMutation.isPending}
                onClick={() => submitMutation.mutate(submitOrderId!)}
              >
                Submit Result
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}
