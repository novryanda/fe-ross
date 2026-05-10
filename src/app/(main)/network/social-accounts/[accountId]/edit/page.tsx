'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { RoleGuard } from '@/components/layout/role-guard'
import { ErrorState } from '@/components/ui/error-state'
import { SocialAccountFormComponent } from '@/components/features/social-account/social-account-form'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage, isApiError } from '@/lib/api/errors'
import { useAuth } from '@/hooks/use-auth'
import type { SocialAccountForm } from '@/lib/validations'

export default function EditSocialAccountPage() {
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

  const updateMutation = useMutation({
    mutationFn: (form: SocialAccountForm) => socialAccountsApi.update(accountId, form),
    onSuccess: () => {
      toast.success('Social account berhasil diupdate.')
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['social-accounts', 'detail', accountId] })
      router.push('/network/social-accounts')
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
        <div className="skeleton" style={{ height: 340, borderRadius: 16 }} />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    const notFound = isApiError(detailQuery.error) && detailQuery.error.code === 'NOT_FOUND'
    return (
      <div className="page-container">
        <PageHeader title="Edit Social Account" backHref="/network/social-accounts" />
        <ErrorState
          title={notFound ? 'Social account tidak ditemukan' : 'Gagal memuat social account'}
          message={mapApiErrorToToastMessage(detailQuery.error)}
          retry={notFound ? undefined : () => detailQuery.refetch()}
        />
      </div>
    )
  }

  const account = detailQuery.data

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Edit Social Account"
          subtitle={`@${account.username}`}
          backHref="/network/social-accounts"
        />
        <div className="card" style={{ padding: '1.5rem', maxWidth: 520 }}>
          <SocialAccountFormComponent
            initial={account}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync(data)
            }}
            loading={updateMutation.isPending}
          />
        </div>
      </div>
    </RoleGuard>
  )
}
