'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, Link2, RadioTower, Send, Settings2, ShieldCheck } from 'lucide-react'
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
import { PlatformSelector } from '@/components/ui/platform-selector'
import { CompletionChecklistCard, SectionHeader, type ChecklistItem } from '@/components/features/campaign/enterprise-campaign-form'
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
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<BlastTargetCreateForm>({
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

  const selectedPlatform = watch('platform') as Platform

  const { data: accounts, isLoading: accountsLoading } = useQuery({ 
    queryKey: ['social-accounts', { platform: selectedPlatform, status: 'ACTIVE' }], 
    queryFn: () => socialAccountsApi.list({ platform: selectedPlatform, status: 'ACTIVE', limit: 100 }) 
  })

  const mutation = useMutation({
    mutationFn: (data: BlastTargetCreateForm) => blastApi.addTarget(campaignId, data),
    onSuccess: (target) => {
      toast.success('Blast link berhasil ditambahkan.')
      router.push(`/campaigns/${campaignId}/blast-links/${target.id}`)
    },
    onError: () => toast.error('Gagal menambahkan blast link.'),
  })

  const selectedAccountId = watch('socialAccountId')
  const postUrl = watch('postUrl')
  const status = watch('status')

  const filteredAccounts = accounts?.data ?? []
  const selectedAccount = filteredAccounts.find(account => account.id === selectedAccountId)

  const getUrlPlaceholder = (platform?: Platform) => {
    switch (platform) {
      case 'INSTAGRAM': return 'https://www.instagram.com/p/...'
      case 'TIKTOK': return 'https://www.tiktok.com/@account/video/...'
      case 'X_TWITTER': return 'https://x.com/account/status/...'
      case 'FACEBOOK': return 'https://facebook.com/page/posts/...'
      default: return 'https://...'
    }
  }

  const checklist = useMemo<ChecklistItem[]>(() => [
    { label: 'Platform', ready: Boolean(selectedPlatform), emptyLabel: 'Belum dipilih' },
    { label: 'Source Account', ready: Boolean(selectedAccountId), emptyLabel: 'Belum dipilih' },
    { label: 'Target URL', ready: postUrl.trim().startsWith('http'), emptyLabel: 'Belum valid' },
    { label: 'Status', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [selectedPlatform, selectedAccountId, postUrl, status])

  const canCreate = checklist.every(item => item.ready)

  const onSubmit = (data: BlastTargetCreateForm) => {
    if (!canCreate) {
      toast.error('Lengkapi field wajib sebelum publish target.')
      return
    }
    mutation.mutate(data)
  }

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

      <div className="campaign-create-grid">
        <div className="enterprise-form-card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <section className="campaign-create-section">
              <SectionHeader number={1} title="Target Information" icon={<Link2 size={15} />} />
              <div className="field-grid-2">
                <div className="form-group">
                  <label className="form-label">Platform <span className="required-dot">Required</span></label>
                  <PlatformSelector 
                    value={selectedPlatform} 
                    onChange={(item) => {
                       setValue('platform', item, { shouldValidate: true })
                       setValue('socialAccountId', '', { shouldValidate: true })
                    }} 
                  />
                  {errors.platform?.message && <span className="form-error">{errors.platform.message}</span>}
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Optional Social Account / Source Account</label>
                  <select 
                    className="input-field" 
                    disabled={!selectedPlatform || accountsLoading}
                    {...register('socialAccountId')}
                  >
                    <option value="">
                      {!selectedPlatform ? 'Pilih platform terlebih dahulu' : 'No source account'}
                    </option>
                    {filteredAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        @{account.username}
                      </option>
                    ))}
                  </select>
                  {filteredAccounts.length === 0 && selectedPlatform && !accountsLoading ? (
                    <div className="muted-meta" style={{ marginTop: '0.5rem', color: 'var(--destructive)' }}>
                      Tidak ada source account aktif untuk platform ini. <Link href="/social-accounts" style={{ textDecoration: 'underline' }}>Tambahkan</Link>
                    </div>
                  ) : (
                    <div className="muted-meta" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                      Pilih akun yang akan digunakan sebagai pengirim interaksi.
                    </div>
                  )}
                  {errors.socialAccountId?.message && <span className="form-error">{errors.socialAccountId.message}</span>}
                </div>
              </div>

              <div style={{ marginTop: '0.9rem' }}>
                <Input label="Target Post URL" type="url" {...register('postUrl')} error={errors.postUrl?.message} placeholder={getUrlPlaceholder(selectedPlatform)} disabled={!selectedPlatform} />
              </div>
            </section>

            <section className="campaign-create-section">
              <SectionHeader number={2} title="Instructions" icon={<FileText size={15} />} />
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

            <section className="campaign-create-section">
              <SectionHeader number={3} title="Target Status" icon={<ShieldCheck size={15} />} />
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
                <Button type="submit" disabled={!canCreate} loading={mutation.isPending} icon={<Send size={14} />}>
                  Publish Target
                </Button>
              </div>
            </div>
          </form>
        </div>

        <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
          <BlastLinkHelperPanel
            campaign={campaign}
            selectedPlatform={selectedPlatform}
            selectedAccount={selectedAccount}
            postUrl={postUrl}
          />
          <CompletionChecklistCard items={checklist} />
        </aside>
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
