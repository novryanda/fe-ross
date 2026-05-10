'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { RoleGuard } from '@/components/layout/role-guard'
import { SocialAccountFormComponent } from '@/components/features/social-account/social-account-form'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import type { SocialAccountForm } from '@/lib/validations'

export default function NewSocialAccountPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (form: SocialAccountForm) => socialAccountsApi.create(form),
    onSuccess: () => {
      toast.success('Social account berhasil ditambahkan.')
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      router.push('/network/social-accounts')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader title="Add Social Account" subtitle="Tambahkan akun sumber postingan baru." backHref="/network/social-accounts" />
        <div className="card" style={{ padding: '1.5rem', maxWidth: 520 }}>
          <SocialAccountFormComponent
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data)
            }}
            loading={createMutation.isPending}
          />
        </div>
      </div>
    </RoleGuard>
  )
}
