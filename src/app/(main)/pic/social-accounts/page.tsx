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
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
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
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 84, borderRadius: 16 }} />
            ))}
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
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {accounts.map((account) => (
              <article key={account.id} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <PlatformBadge platform={account.platform as Platform} size="sm" />
                      <StatusBadge type="social" status={account.status as SocialAccountStatus} size="sm" />
                    </div>
                    <div style={{ fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                      @{account.username}
                    </div>
                    <div className="muted-meta">{account.displayName ?? '-'} / {account.category as SocialAccountCategory}</div>
                  </div>
                  <a href={account.profileUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                    Open Profile
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingAccount(account)
                      setIsModalOpen(true)
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  {account.status === 'ARCHIVED' ? (
                    <button type="button" className="btn-ghost" onClick={() => statusMutation.mutate({ id: account.id, status: 'ACTIVE' })}>
                      <RotateCcw size={14} /> Restore
                    </button>
                  ) : (
                    <button type="button" className="btn-danger" onClick={() => statusMutation.mutate({ id: account.id, status: 'ARCHIVED' })}>
                      <Archive size={14} /> Archive
                    </button>
                  )}
                </div>
              </article>
            ))}
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
