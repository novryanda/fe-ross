'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Edit2, RadioTower } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { RoleGuard } from '@/components/layout/role-guard'
import { ErrorState } from '@/components/ui/error-state'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage, isApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export default function SocialAccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role, isInitialized } = useAuth()
  const canLoadAccount = isInitialized && role === 'ADMIN'

  const detailQuery = useQuery({
    queryKey: ['social-accounts', 'detail', accountId],
    queryFn: () => socialAccountsApi.get(accountId),
    enabled: canLoadAccount,
    retry: (failureCount, error) => {
      if (isApiError(error) && error.code === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => socialAccountsApi.archive(accountId),
    onSuccess: () => {
      toast.success('Social account di-archive.')
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['social-accounts', 'detail', accountId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  if (!canLoadAccount) {
    return (
      <RoleGuard roles={['ADMIN']}>
        <div />
      </RoleGuard>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="page-container" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: 220, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    const notFound = isApiError(detailQuery.error) && detailQuery.error.code === 'NOT_FOUND'
    return (
      <div className="page-container">
        <PageHeader title="Social Account" backHref="/network/social-accounts" />
        <ErrorState
          title={notFound ? 'Social account tidak ditemukan' : 'Gagal memuat social account'}
          message={mapApiErrorToToastMessage(detailQuery.error)}
          retry={notFound ? undefined : () => detailQuery.refetch()}
        />
      </div>
    )
  }

  const account = detailQuery.data
  const isArchived = account.status === 'ARCHIVED'

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title={account.displayName ?? `@${account.username}`}
          subtitle="Detail akun sumber postingan yang dikelola Admin."
          backHref="/network/social-accounts"
          actions={
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push(`/network/social-accounts/${accountId}/edit`)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => archiveMutation.mutate()}
                disabled={isArchived || archiveMutation.isPending}
              >
                <Archive size={14} /> {archiveMutation.isPending ? 'Archiving...' : isArchived ? 'Archived' : 'Archive'}
              </button>
            </>
          }
        />

        <div className="info-banner info-banner-cyan">
          <RadioTower size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
          <div>Social Account ini adalah sumber postingan untuk blast/comment. Ini bukan akun login user dan bukan akun milik Buzzer.</div>
        </div>

        <div className="form-dashboard-grid">
          <section className="form-panel">
            <div className="form-section">
              <div className="form-section-title"><span className="step-number">1</span> Account Identity</div>
              <div className="summary-line"><div className="summary-label">Platform</div><div className="summary-value"><PlatformBadge platform={account.platform} /></div></div>
              <div className="summary-line"><div className="summary-label">Username</div><div className="summary-value"><SocialAccountUsernameLink account={account} /></div></div>
              <div className="summary-line"><div className="summary-label">Display Name</div><div className="summary-value">{account.displayName ?? '-'}</div></div>
              <div className="summary-line"><div className="summary-label">Category</div><div className="summary-value">{account.category}</div></div>
              <div className="summary-line"><div className="summary-label">Status</div><div className="summary-value"><StatusBadge type="social" status={account.status} /></div></div>
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">2</span> Source Usage</div>
              <div className="summary-line"><div className="summary-label">Blast Targets</div><div className="summary-value">{account.blastTargetCount ?? 0}</div></div>
              <div className="summary-line"><div className="summary-label">Created</div><div className="summary-value">{formatDate(account.createdAt)}</div></div>
              <div className="summary-line"><div className="summary-label">Updated</div><div className="summary-value">{formatDate(account.updatedAt)}</div></div>
            </div>
          </section>

          <aside className="helper-panel">
            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Account Summary</h3>
              <div className="preview-card">
                <SocialAccountUsernameLink account={account} style={{ fontSize: '1rem' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{account.displayName}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <PlatformBadge platform={account.platform} size="sm" />
                  <StatusBadge type="social" status={account.status} size="sm" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </RoleGuard>
  )
}
