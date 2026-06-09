'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderKanban } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PlatformBadge } from '@/components/ui/badges'
import { campaignsApi } from '@/lib/api/campaigns'
import { postingOrdersApi, type PostingOrderListParams } from '@/lib/api/posting-orders'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'
import type { Platform, PostingOrderStatus } from '@/types'

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'X_TWITTER', label: 'X / Twitter' },
  { value: 'FACEBOOK', label: 'Facebook' },
]

const statusOptions: { value: PostingOrderStatus; label: string }[] = [
  { value: 'PUBLISHED_TO_QUEUE', label: 'Assigned' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function PostingOrderStatusChip({ status }: { status: PostingOrderStatus }) {
  const config: Record<PostingOrderStatus, { label: string; color: string }> = {
    PUBLISHED_TO_QUEUE: { label: 'Assigned', color: 'var(--cyan)' },
    COMPLETED: { label: 'Completed', color: 'var(--status-active)' },
    CANCELLED: { label: 'Cancelled', color: 'var(--status-rejected)' },
    CLAIMED: { label: 'Assigned', color: 'var(--cyan)' },
  }

  const current = config[status]

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
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: current.color }}
      />
      {current.label}
    </span>
  )
}

export default function PostingBankOverviewPage() {
  const [search, setSearch] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [status, setStatus] = useState<PostingOrderStatus | ''>('')

  const campaignsQuery = useQuery({
    queryKey: ['posting-bank-campaign-filter'],
    queryFn: () =>
      campaignsApi.list({
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  })

  const params = useMemo<PostingOrderListParams>(
    () => ({
      limit: 100,
      campaignId: campaignId || undefined,
      platform: platform || undefined,
      status: status || undefined,
      search: search || undefined,
      sortBy: 'scheduledAt',
      sortOrder: 'desc',
    }),
    [campaignId, platform, search, status],
  )

  const ordersQuery = useQuery({
    queryKey: ['posting-bank-orders-overview', params],
    queryFn: () => postingOrdersApi.listOrders(params),
  })

  const orders = ordersQuery.data?.data ?? []
  const selectedCampaign = campaignsQuery.data?.data.find((item) => item.id === campaignId)

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Posting Bank"
          subtitle="Lihat seluruh bank konten yang sudah dibuat, filter berdasarkan campaign, lalu buka detail campaign bila perlu."
        />

        <div className="info-banner info-banner-cyan">
          Halaman ini menampilkan daftar posting order yang sudah dibuat. Campaign dipakai sebagai filter, sementara review submission dan blast tetap bisa dibuka dari campaign terkait.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search campaign, judul, unit, caption, atau drive link..."
          filters={[
            {
              label: 'Campaign',
              value: campaignId,
              options: (campaignsQuery.data?.data ?? []).map((campaign) => ({
                value: campaign.id,
                label: campaign.name,
              })),
              onChange: setCampaignId,
            },
            {
              label: 'Platform',
              value: platform,
              options: platformOptions,
              onChange: (value) => setPlatform(value as Platform | ''),
            },
            {
              label: 'Status',
              value: status,
              options: statusOptions,
              onChange: (value) => setStatus(value as PostingOrderStatus | ''),
            },
          ]}
          actions={
            selectedCampaign ? (
              <Link
                href={`/campaigns/${selectedCampaign.id}/posting-bank`}
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                Open {selectedCampaign.name}
              </Link>
            ) : undefined
          }
        />

        {ordersQuery.isLoading || campaignsQuery.isLoading ? (
          <div className="data-table-container" aria-busy="true">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Judul</th>
                  <th>Unit</th>
                  <th>Platform</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Drive</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={9}>
                      <div className="skeleton" style={{ height: 28, borderRadius: 8 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : ordersQuery.isError ? (
          <ErrorState
            title="Gagal memuat posting bank"
            message={mapApiErrorToToastMessage(ordersQuery.error)}
            retry={() => ordersQuery.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={48} />}
            title="Belum ada bank konten"
            description="Belum ada posting order yang cocok dengan filter saat ini."
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Judul</th>
                  <th>Unit</th>
                  <th>Platform</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Drive</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                          {order.campaign?.name ?? 'Campaign'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                          {order.title}
                        </span>
                        {order.caption && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                            {order.caption}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <span>{order.targetUnit?.name ?? '-'}</span>
                        {order.description && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                            {order.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <PlatformBadge platform={order.platform} size="sm" />
                    </td>
                    <td>{formatDateTime(order.scheduledAt)}</td>
                    <td>
                      <PostingOrderStatusChip status={order.status} />
                    </td>
                    <td>{order.submissionCount ?? 0}</td>
                    <td>
                      <a
                        href={order.contentDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost"
                        style={{ textDecoration: 'none' }}
                      >
                        Open Drive
                      </a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/campaigns/${order.campaignId}/posting-bank`}
                          className="btn-primary"
                          style={{ textDecoration: 'none' }}
                        >
                          Open
                        </Link>
                        <Link
                          href={`/campaigns/${order.campaignId}/blast-links/new`}
                          className="btn-secondary"
                          style={{ textDecoration: 'none' }}
                        >
                          Blast
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
