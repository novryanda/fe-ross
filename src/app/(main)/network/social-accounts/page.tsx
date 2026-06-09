'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Edit2, Eye, Facebook, Globe, Info, Instagram, Music2, Plus, RadioTower, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { Modal } from '@/components/ui/modal'
import { RoleGuard } from '@/components/layout/role-guard'
import { SocialAccountFormComponent } from '@/components/features/social-account/social-account-form'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { PLATFORMS, SOCIAL_ACCOUNT_CATEGORIES } from '@/lib/constants'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import type { SocialAccountForm } from '@/lib/validations'
import type { Platform, SocialAccountCategory, SocialAccountStatus } from '@/types'

const platformIcons: Record<Platform | 'TOTAL', React.ReactNode> = {
  TOTAL: <Globe size={20} />,
  INSTAGRAM: <Instagram size={20} />,
  TIKTOK: <Music2 size={20} />,
  X_TWITTER: <RadioTower size={20} />,
  FACEBOOK: <Facebook size={20} />,
}

export default function SocialAccountsPage() {
  const { role, isInitialized } = useAuth()
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const canLoadAccounts = isInitialized && role === 'ADMIN'

  useEffect(() => {
    setPage(1)
  }, [search, platform, status, category])

  const accountsQuery = useQuery({
    queryKey: ['social-accounts', { search, platform, status, category, page, limit }],
    queryFn: () =>
      socialAccountsApi.list({
        search: search || undefined,
        platform: platform || undefined,
        status: status || undefined,
        category: category || undefined,
        page,
        limit,
      }),
    enabled: canLoadAccounts,
  })

  const createMutation = useMutation({
    mutationFn: (form: SocialAccountForm) => socialAccountsApi.create(form),
    onSuccess: () => {
      toast.success('Social account berhasil ditambahkan.')
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      setIsAddModalOpen(false)
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SocialAccountStatus }) =>
      socialAccountsApi.updateStatus(id, status),
    onSuccess: (_account, variables) => {
      toast.success(variables.status === 'ACTIVE' ? 'Social account direstore.' : 'Social account di-archive.')
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const accounts = accountsQuery.data?.data ?? []
  const meta = accountsQuery.data?.meta
  const total = meta?.total ?? accounts.length

  const kpis = [
    { label: 'Total Accounts', value: total, accent: 'var(--cyan)', icon: platformIcons.TOTAL },
    {
      label: 'Instagram',
      value: accounts.filter((a) => a.platform === 'INSTAGRAM').length,
      accent: '#e1306c',
      icon: platformIcons.INSTAGRAM,
    },
    {
      label: 'TikTok',
      value: accounts.filter((a) => a.platform === 'TIKTOK').length,
      accent: '#00f2ea',
      icon: platformIcons.TIKTOK,
    },
    {
      label: 'X/Twitter',
      value: accounts.filter((a) => a.platform === 'X_TWITTER').length,
      accent: 'var(--text-primary)',
      icon: platformIcons.X_TWITTER,
    },
    {
      label: 'Facebook',
      value: accounts.filter((a) => a.platform === 'FACEBOOK').length,
      accent: '#1877f2',
      icon: platformIcons.FACEBOOK,
    },
  ]

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Social Accounts"
          subtitle="Kelola akun sumber postingan untuk blast dan comment."
          actions={
            <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
              <Plus size={14} /> Add Account
            </button>
          }
        />

        <div className="tabs-bar">
          <Link href="/network/social-accounts" className="tab-btn active" style={{ textDecoration: 'none' }}>Social Accounts</Link>
          <Link href="/network/members" className="tab-btn" style={{ textDecoration: 'none' }}>Members</Link>
        </div>

        <div className="info-banner info-banner-cyan">
          <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
          <div>Social Account adalah akun sumber postingan yang dikelola Admin, bukan akun milik Buzzer.</div>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-v2" style={{ borderLeftColor: kpi.accent }}>
              <div className="kpi-v2-icon" style={{ background: 'var(--bg-elevated)', color: kpi.accent }}>{kpi.icon}</div>
              <div>
                <div className="kpi-v2-label">{kpi.label}</div>
                <div className="kpi-v2-value">{accountsQuery.isLoading ? '—' : kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search username/display name..."
          filters={[
            { label: 'Platform', value: platform, options: PLATFORMS.map((item) => ({ value: item.value, label: item.label })), onChange: setPlatform },
            {
              label: 'Status',
              value: status,
              options: [
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'ARCHIVED', label: 'Archived' },
              ],
              onChange: setStatus,
            },
            { label: 'Category', value: category, options: SOCIAL_ACCOUNT_CATEGORIES.map((item) => ({ value: item.value, label: item.label })), onChange: setCategory },
          ]}
        />

        {accountsQuery.isLoading ? (
          <div className="data-table-container" aria-busy="true">
            <div style={{ padding: '1.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 28, marginBottom: '0.75rem' }} />
              ))}
            </div>
          </div>
        ) : accountsQuery.isError ? (
          <ErrorState
            title="Gagal memuat social accounts"
            message={mapApiErrorToToastMessage(accountsQuery.error)}
            retry={() => accountsQuery.refetch()}
          />
        ) : !accounts.length ? (
          <EmptyState
            icon={<RadioTower size={48} />}
            title="No social accounts found"
            description="Adjust filters or add a new source account."
            action={
              <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                <Plus size={14} /> Add Account
              </button>
            }
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td><PlatformBadge platform={account.platform as Platform} size="sm" /></td>
                    <td>
                      <SocialAccountUsernameLink account={account} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{account.displayName ?? '-'}</td>
                    <td>
                      <span className="selected-chip">{account.category as SocialAccountCategory}</span>
                    </td>
                    <td><StatusBadge type="social" status={account.status as SocialAccountStatus} size="sm" /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(account.createdAt)}</td>
                    <td>
                      <div className="action-row" style={{ justifyContent: 'flex-start' }}>
                        <Link href={`/network/social-accounts/${account.id}`} className="icon-action" style={{ textDecoration: 'none' }}>
                          <Eye size={13} /> View
                        </Link>
                        <Link href={`/network/social-accounts/${account.id}/edit`} className="icon-action" style={{ textDecoration: 'none' }}>
                          <Edit2 size={13} /> Edit
                        </Link>
                        {account.status === 'ARCHIVED' ? (
                          <button
                            type="button"
                            className="icon-action"
                            disabled={statusMutation.isPending && statusMutation.variables?.id === account.id}
                            onClick={() => statusMutation.mutate({ id: account.id, status: 'ACTIVE' })}
                          >
                            {statusMutation.isPending && statusMutation.variables?.id === account.id ? <span className="spinner" /> : <RotateCcw size={13} />}
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="icon-action danger"
                            disabled={statusMutation.isPending && statusMutation.variables?.id === account.id}
                            onClick={() => statusMutation.mutate({ id: account.id, status: 'ARCHIVED' })}
                          >
                            {statusMutation.isPending && statusMutation.variables?.id === account.id ? <span className="spinner" /> : <Archive size={13} />}
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-footer">
              <span>Showing {accounts.length} of {total} social accounts</span>
              <span>Archive = PATCH status ARCHIVED (soft). Tidak ada DELETE di backend.</span>
            </div>
            <PaginationControls
              meta={meta}
              pageSize={limit}
              itemLabel="social accounts"
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          </div>
        )}

        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Social Account"
        >
          <SocialAccountFormComponent
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data)
            }}
            loading={createMutation.isPending}
          />
        </Modal>
      </div>
    </RoleGuard>
  )
}
