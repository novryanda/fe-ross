'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { campaignSchema, type CampaignForm } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PLATFORMS } from '@/lib/constants'
import type { Campaign, Platform } from '@/types'

interface CampaignFormProps {
  initial?: Campaign
  onSubmit: (data: CampaignForm) => Promise<void>
  loading?: boolean
}

export function CampaignFormComponent({ initial, onSubmit, loading }: CampaignFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initial ? { name: initial.name, description: initial.description ?? '', startDate: initial.startDate, endDate: initial.endDate ?? '', platforms: initial.platforms, status: initial.status } : { name: '', description: '', startDate: '', endDate: '', platforms: [], status: 'DRAFT' },
  })

  const selectedPlatforms = watch('platforms')

  const togglePlatform = (p: Platform) => {
    const current = selectedPlatforms || []
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p]
    setValue('platforms', next, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Nama Campaign" {...register('name')} error={errors.name?.message} placeholder="e.g. Kampanye Literasi Digital Mei" />

      <div className="form-group">
        <label className="form-label">Deskripsi</label>
        <textarea {...register('description')} className="input-field" rows={3} placeholder="Deskripsi campaign..." style={{ resize: 'vertical' }} />
        {errors.description && <span className="form-error">{errors.description.message}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Input label="Tanggal Mulai" type="date" {...register('startDate')} error={errors.startDate?.message} />
        <Input label="Tanggal Selesai" type="date" {...register('endDate')} error={errors.endDate?.message} />
      </div>

      <Select label="Status" {...register('status')} error={errors.status?.message} options={[
        { value: 'DRAFT', label: 'Draft' }, { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' }, { value: 'ARCHIVED', label: 'Archived' },
      ]} />

      <div className="form-group">
        <label className="form-label">Platforms</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => {
            const selected = selectedPlatforms?.includes(p.value)
            return (
              <button key={p.value} type="button" onClick={() => togglePlatform(p.value)} style={{
                padding: '0.375rem 0.75rem', borderRadius: 8, fontSize: '0.8125rem', cursor: 'pointer',
                background: selected ? 'var(--cyan-dim)' : 'var(--bg-primary)', color: selected ? 'var(--cyan)' : 'var(--text-muted)',
                border: `1px solid ${selected ? 'rgba(0,212,255,0.4)' : 'var(--border-default)'}`, transition: 'all 0.15s',
              }}>
                {p.icon} {p.label}
              </button>
            )
          })}
        </div>
        {errors.platforms && <span className="form-error">{errors.platforms.message}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button type="submit" loading={loading}>{initial ? 'Update Campaign' : 'Create Campaign'}</Button>
      </div>
    </form>
  )
}
