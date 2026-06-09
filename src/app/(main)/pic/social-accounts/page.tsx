'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Edit2, Plus, RotateCcw, UserRound } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { SocialAccountFormComponent } from '@/components/features/social-account/social-account-form'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { PLATFORMS, SOCIAL_ACCOUNT_CATEGORIES } from '@/lib/constants'
import type { SocialAccountForm } from '@/lib/validations'
import type { Platform, SocialAccount, SocialAccountCategory, SocialAccountStatus } from '@/types'
import { toast } from 'sonner'

export default function PicSocialAccountsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null)

  useEffect(() => {
    if (!isModalOpen) setEditingAccount(null)
  }, [isModalOpen])

  const accountsQuery = useQuery({
    queryKey: ['pic-social-accounts', { search, platform, status, category }],
    queryFn: () =>
      socialAccountsApi.list({
        search: search || undefined,
        platform: platform || undefined,
        status: status || undefined,
        category: category || undefined,
        limit: 100,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (form: SocialAccountForm) => socialAccountsApi.create(form),
    onSuccess: () => {
      toast.success('Akun sosmed berhasil ditambahkan.')
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts', 'active'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: (form: SocialAccountForm) => {
      if (!editingAccount) throw new Error('Akun belum dipilih.')
      return socialAccountsApi.update(editingAccount.id, form)
    },
    onSuccess: () => {
      toast.success('Akun sosmed berhasil diperbarui.')
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts', 'active'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SocialAccountStatus }) =>
      socialAccountsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'ARCHIVED' ? 'Akun diarsipkan.' : 'Status akun diperbarui.')
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['pic-social-accounts', 'active'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const accounts = accountsQuery.data?.data ?? []
  const submitAccount = async (form: SocialAccountForm) => {
    if (editingAccount) {
      await updateMutation.mutateAsync(form)
      return
    }
    await createMutation.mutateAsync(form)
  }

  return (
    <RoleGuard roles={['PIC']}>
      <div className="page-container">
        <PageHeader
          title="My Social Accounts"
          subtitle="Kelola daftar akun sosmed Anda sendiri yang dipakai saat submit hasil posting."
          actions={
            <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} /> Add Account
            </button>
          }
        />

        <div className="info-banner info-banner-cyan">
          Saat submit posting result, Anda memilih salah satu akun aktif dari daftar ini. Admin tidak perlu mengetik ulang akun tersebut.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search username..."
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
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton" style={{ height: 28, marginBottom: '0.75rem' }} />
              ))}
            </div>
          </div>
        ) : accountsQuery.isError ? (
          <ErrorState
            title="Gagal memuat akun sosmed"
            message={mapApiErrorToToastMessage(accountsQuery.error)}
            retry={() => accountsQuery.refetch()}
          />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={<UserRound size={48} />}
            title="Belum ada akun sosmed"
            description="Tambahkan akun pertama Anda agar bisa dipilih saat submit hasil posting."
            action={<button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Account</button>}
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
                        <button
                          type="button"
                          className="icon-action"
                          onClick={() => {
                            setEditingAccount(account)
                            setIsModalOpen(true)
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
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
              <span>Showing {accounts.length} social account{accounts.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingAccount ? 'Edit My Social Account' : 'Add My Social Account'}
        >
          <SocialAccountFormComponent
            initial={editingAccount ?? undefined}
            onSubmit={submitAccount}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        </Modal>
      </div>
    </RoleGuard>
  )
}
