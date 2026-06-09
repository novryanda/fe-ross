'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FolderCheck } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PlatformBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { postingOrdersApi } from '@/lib/api/posting-orders'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'
import type { Platform, PostingSubmissionStatus } from '@/types'

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'X_TWITTER', label: 'X / Twitter' },
  { value: 'FACEBOOK', label: 'Facebook' },
]

function SubmissionChip({ status }: { status: PostingSubmissionStatus }) {
  const config: Record<PostingSubmissionStatus, { label: string; color: string }> = {
    SUBMITTED: { label: 'Submitted', color: 'var(--status-expired)' },
    APPROVED_FOR_BLAST: { label: 'Approved', color: 'var(--status-active)' },
    REJECTED: { label: 'Rejected', color: 'var(--status-rejected)' },
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

export default function PicMySubmissionsPage() {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const submissionsQuery = useQuery({
    queryKey: ['pic-my-submissions', platformFilter, statusFilter],
    queryFn: () =>
      postingOrdersApi.getMySubmissions({
        limit: 50,
        platform: (platformFilter || undefined) as Platform | undefined,
        submissionStatus: (statusFilter || undefined) as PostingSubmissionStatus | undefined,
      }),
  })

  const submissions = useMemo(() => {
    const all = submissionsQuery.data?.data ?? []
    if (!search.trim()) return all
    const keyword = search.toLowerCase()
    return all.filter((submission) =>
      (submission.postingOrder?.campaign?.name ?? '').toLowerCase().includes(keyword) ||
      (submission.socialAccount?.username ?? '').toLowerCase().includes(keyword) ||
      submission.postedUrl.toLowerCase().includes(keyword),
    )
  }, [search, submissionsQuery.data?.data])

  return (
    <RoleGuard roles={['PIC']}>
      <div className="page-container">
        <PageHeader
          title="My Submissions"
          subtitle="Pantau submission posting yang sudah Anda kirim dan lihat status review admin."
          actions={
            <Link href="/pic/posting-queue" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Back to Queue
            </Link>
          }
        />

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search campaign, account, or post URL..."
          filters={[
            { label: 'Platform', value: platformFilter, options: platformOptions, onChange: setPlatformFilter },
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'APPROVED_FOR_BLAST', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />

        {submissionsQuery.isLoading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 88, borderRadius: 16 }} />
            ))}
          </div>
        ) : submissionsQuery.isError ? (
          <ErrorState
            title="Gagal memuat submission"
            message={mapApiErrorToToastMessage(submissionsQuery.error)}
            retry={() => submissionsQuery.refetch()}
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<FolderCheck size={48} />}
            title="Belum ada submission"
            description="Setelah Anda submit hasil posting dari queue, riwayatnya akan tampil di sini."
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {submissions.map((submission) => (
              <article key={submission.id} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <PlatformBadge platform={submission.postingOrder?.platform ?? submission.socialAccount?.platform ?? 'INSTAGRAM'} size="sm" />
                      <SubmissionChip status={submission.status} />
                    </div>
                    <div style={{ fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                      {submission.postingOrder?.campaign?.name ?? 'Campaign'}
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
                    {submission.blastTargetId && (
                      <Link href={`/campaigns/${submission.postingOrder?.campaignId}/blast-links/${submission.blastTargetId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                        Blast Target
                      </Link>
                    )}
                  </div>
                </div>

                <div className="muted-meta">Submitted at {formatDateTime(submission.submittedAt)}</div>
                {submission.notes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{submission.notes}</div>}
                {submission.reviewNotes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Review note: {submission.reviewNotes}</div>}
              </article>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
