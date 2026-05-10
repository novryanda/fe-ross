'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { blastReportSchema, type BlastReportForm } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProofLinkInput } from '@/components/ui/proof-link-input'
import { Eye, Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react'

interface BlastReportFormProps {
  onSubmit: (data: BlastReportForm) => Promise<void>
  loading?: boolean
}

export function BlastReportFormComponent({ onSubmit, loading }: BlastReportFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<BlastReportForm>({
    resolver: zodResolver(blastReportSchema),
    defaultValues: { views: 0, likes: 0, comments: 0, shares: 0, reposts: 0, proofLink: '', notes: '' },
  })

  const proofLink = watch('proofLink')

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <Input label="Views" type="number" icon={<Eye size={14} />} {...register('views', { valueAsNumber: true })} error={errors.views?.message} />
        <Input label="Likes" type="number" icon={<Heart size={14} />} {...register('likes', { valueAsNumber: true })} error={errors.likes?.message} />
        <Input label="Comments" type="number" icon={<MessageCircle size={14} />} {...register('comments', { valueAsNumber: true })} error={errors.comments?.message} />
        <Input label="Shares" type="number" icon={<Share2 size={14} />} {...register('shares', { valueAsNumber: true })} error={errors.shares?.message} />
        <Input label="Reposts" type="number" icon={<Repeat2 size={14} />} {...register('reposts', { valueAsNumber: true })} error={errors.reposts?.message} />
      </div>

      <ProofLinkInput value={proofLink} onChange={(v) => setValue('proofLink', v, { shouldValidate: true })} error={errors.proofLink?.message} />

      <div className="form-group">
        <label className="form-label">Catatan</label>
        <textarea {...register('notes')} className="input-field" rows={3} placeholder="Catatan tambahan (opsional)..." style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" loading={loading}>Submit Report</Button>
      </div>
    </form>
  )
}
