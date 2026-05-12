'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { socialAccountSchema, type SocialAccountForm } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PlatformSelector } from '@/components/ui/platform-selector'
import { SOCIAL_ACCOUNT_CATEGORIES } from '@/lib/constants'
import type { SocialAccount } from '@/types'

interface SocialAccountFormProps {
  initial?: SocialAccount
  onSubmit: (data: SocialAccountForm) => Promise<void>
  loading?: boolean
}

export function SocialAccountFormComponent({ initial, onSubmit, loading }: SocialAccountFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SocialAccountForm>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: initial ? { platform: initial.platform, username: initial.username, displayName: initial.displayName ?? '', profileUrl: initial.profileUrl, category: initial.category } : { platform: 'INSTAGRAM', username: '', displayName: '', profileUrl: '', category: 'MEDIA' },
  })

  const currentPlatform = watch('platform')

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label className="form-label">Platform</label>
        <PlatformSelector
          value={currentPlatform}
          onChange={(val) => setValue('platform', val, { shouldValidate: true })}
        />
        {errors.platform?.message && <span className="form-error">{errors.platform.message}</span>}
      </div>
      <Input label="Username" {...register('username')} error={errors.username?.message} placeholder="e.g. mediaupdate.id" />
      <Input label="Display Name" {...register('displayName')} error={errors.displayName?.message} placeholder="e.g. Media Update ID" />
      <Input label="Profile URL" type="url" {...register('profileUrl')} error={errors.profileUrl?.message} placeholder="https://tiktok.com/@..." />
      <Select label="Kategori" {...register('category')} error={errors.category?.message} options={SOCIAL_ACCOUNT_CATEGORIES.map(c => ({ value: c.value, label: c.label }))} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" loading={loading}>{initial ? 'Update Account' : 'Add Account'}</Button>
      </div>
    </form>
  )
}
