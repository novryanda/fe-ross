'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, RadioTower, Send, Settings2 } from 'lucide-react'
import { z } from 'zod'
import { blastApi } from '@/lib/api/blast'
import { campaignsApi } from '@/lib/api/campaigns'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { BlastLinkHelperPanel } from '@/components/features/blast/blast-link-helper-panel'
import { RoleGuard } from '@/components/layout/role-guard'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PLATFORMS } from '@/lib/constants'
import { toast } from 'sonner'
import type { Platform } from '@/types'

const blastTargetCreateSchema = z.object({
  socialAccountId: z.string().min(1, 'Social account wajib dipilih.'),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'X_TWITTER', 'FACEBOOK']),
  postUrl: z.string().url('URL tidak valid.'),
  sourceType: z.enum(['ADMIN_SUBMITTED', 'BUZZER_SUGGESTED']).default('ADMIN_SUBMITTED'),
  instruction: z.string().max(500, 'Notes maksimal 500 karakter.').optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).default('ACTIVE'),
})

type BlastTargetCreateForm = z.infer<typeof blastTargetCreateSchema>

export default function NewBlastLinkPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()

  const { data: campaign } = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const { data: accounts } = useQuery({ queryKey: ['social-accounts'], queryFn: () => socialAccountsApi.list() })

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BlastTargetCreateForm>({
    resolver: zodResolver(blastTargetCreateSchema),
    defaultValues: {
      socialAccountId: '',
      platform: 'INSTAGRAM',
      postUrl: '',
      sourceType: 'ADMIN_SUBMITTED',
      instruction: '',
      status: 'ACTIVE',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: BlastTargetCreateForm) => blastApi.addTarget(campaignId, data),
    onSuccess: (target) => {
      toast.success('Blast link berhasil ditambahkan.')
      router.push(`/campaigns/${campaignId}/blast-links/${target.id}`)
    },
    onError: () => toast.error('Gagal menambahkan blast link.'),
  })

  const selectedPlatform = watch('platform') as Platform
  const selectedAccountId = watch('socialAccountId')
  const postUrl = watch('postUrl')
  const selectedAccount = accounts?.data.find(account => account.id === selectedAccountId)

  return (
    <RoleGuard roles={['ADMIN']}>
    <div>
      <CampaignShell campaign={campaign} campaignId={campaignId}>

      <div className="section-heading-row">
        <div>
          <Link href={`/campaigns/${campaignId}/blast-links`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cyan)', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.45rem' }}>
            <ArrowLeft size={14} /> Back to Blast Links
          </Link>
          <div className="section-kicker">Create Target</div>
          <h2 className="section-title">Add Blast Link</h2>
          <p className="section-subtitle">Register an existing social media post as a campaign BlastTarget.</p>
        </div>
      </div>

      <div className="blast-info-banner">
        <RadioTower size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <div>
          <strong>First come, first served.</strong>
          <span> This blast link will be visible to all Buzzer members in the campaign. The first Keep locks one attempt.</span>
        </div>
      </div>

      <div className="form-dashboard-grid">
        <div className="form-panel">
          <form onSubmit={handleSubmit(data => mutation.mutate(data))}>
            <section className="form-section">
              <div className="form-section-title">
                <span className="step-number">1</span>
                Basic Target Info
              </div>
              <div className="field-grid-2">
                <Select
                  label="Source Account"
                  {...register('socialAccountId')}
                  error={errors.socialAccountId?.message}
                  placeholder="Choose source account..."
                  options={(accounts?.data ?? []).map(account => ({ value: account.id, label: `@${account.username} - ${account.platform}` }))}
                />
                <Select
                  label="Platform"
                  {...register('platform')}
                  error={errors.platform?.message}
                  options={PLATFORMS.map(platform => ({ value: platform.value, label: platform.label }))}
                />
              </div>
              <div style={{ marginTop: '0.9rem' }}>
                <Input label="Target Post URL" type="url" {...register('postUrl')} error={errors.postUrl?.message} placeholder="https://instagram.com/p/..." />
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-title">
                <span className="step-number">2</span>
                Instructions
              </div>
              <div className="field-grid-2">
                <div className="form-group">
                  <label className="form-label">Notes / Instruction Optional</label>
                  <textarea
                    {...register('instruction')}
                    className="input-field"
                    rows={5}
                    placeholder="Guidance for Buzzer before performing the blast..."
                    style={{ resize: 'vertical' }}
                    maxLength={500}
                  />
                  <span className="form-hint">Visible to Buzzer when they view or keep the attempt.</span>
                  {errors.instruction?.message && <span className="form-error">{errors.instruction.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Source Type</label>
                  <select className="input-field" {...register('sourceType')}>
                    <option value="ADMIN_SUBMITTED">Admin submitted</option>
                    <option value="BUZZER_SUGGESTED">Buzzer suggested</option>
                  </select>
                  <span className="form-hint">Tidak memilih atau assign Buzzer. Claim tetap first-come-first-served.</span>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-title">
                <span className="step-number">3</span>
                Target Status
              </div>
              <div className="field-grid-2">
                <Select
                  label="Initial Status"
                  {...register('status')}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'PAUSED', label: 'Paused' },
                  ]}
                />
              </div>
              <div className="muted-meta" style={{ marginTop: '0.75rem' }}>
                Backend otomatis membuat BlastAttempt #1 saat BlastTarget dibuat. Tidak ada manual assignment ke Buzzer.
              </div>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.9rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button type="submit" loading={mutation.isPending} icon={<Send size={14} />}>
                  Publish Target
                </Button>
              </div>
            </div>
          </form>
        </div>

        <BlastLinkHelperPanel
          campaign={campaign}
          selectedPlatform={selectedPlatform}
          selectedAccount={selectedAccount}
          postUrl={postUrl}
        />
      </div>

      <div className="preview-card" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Settings2 size={16} style={{ color: 'var(--violet)' }} />
        <div>
          <div style={{ fontWeight: 800 }}>No per-Buzzer selection required</div>
          <div className="muted-meta">BlastTarget is campaign-wide. Kept By belongs to BlastAttempt after a Buzzer claims it.</div>
        </div>
        <FileText size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
      </div>
      </CampaignShell>
    </div>
    </RoleGuard>
  )
}
