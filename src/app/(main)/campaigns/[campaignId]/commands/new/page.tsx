'use client'
import Link from 'next/link'
import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, FileText, Info, Link2, MessageCircle, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { RoleGuard } from '@/components/layout/role-guard'
import { CompletionChecklistCard, SectionHeader, type ChecklistItem } from '@/components/features/campaign/enterprise-campaign-form'
import { campaignsApi } from '@/lib/api/campaigns'
import { commentCommandsApi } from '@/lib/api/comment-commands'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import type { CommentCommandStatus, Platform, Stance } from '@/types'
import { toast } from 'sonner'

export default function NewCommandPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [targetPostUrl, setTargetPostUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('INSTAGRAM')
  const [socialAccountId, setSocialAccountId] = useState('')
  const [stance, setStance] = useState<Stance>('PRO')
  const [narrative, setNarrative] = useState('')
  const [instruction, setInstruction] = useState('')
  const [requiredSlots, setRequiredSlots] = useState(3)
  const [keepExpiryMinutes, setKeepExpiryMinutes] = useState(120)
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<Extract<CommentCommandStatus, 'DRAFT' | 'ACTIVE'>>('ACTIVE')
  const [notes, setNotes] = useState('')

  const campaignQuery = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const accountsQuery = useQuery({ queryKey: ['social-accounts', { platform, status: 'ACTIVE' }], queryFn: () => socialAccountsApi.list({ platform, status: 'ACTIVE', limit: 100 }) })

  const createMutation = useMutation({
    mutationFn: () => commentCommandsApi.create(campaignId, {
      targetPostUrl,
      platform,
      socialAccountId: socialAccountId || undefined,
      stance,
      narrative,
      instruction: instruction || undefined,
      requiredSlots,
      keepExpiryMinutes,
      deadline: new Date(deadline).toISOString(),
      status,
    }),
    onSuccess: (command) => {
      queryClient.invalidateQueries({ queryKey: ['comment-commands', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['comment-tasks', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      toast.success('Comment command berhasil dibuat.')
      router.push(`/campaigns/${campaignId}/commands/${command.id}`)
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const checklist = useMemo<ChecklistItem[]>(() => [
    { label: 'Target URL', ready: targetPostUrl.trim().startsWith('http'), emptyLabel: 'Belum valid' },
    { label: 'Platform', ready: Boolean(platform), emptyLabel: 'Belum dipilih' },
    { label: 'Stance', ready: Boolean(stance), emptyLabel: 'Belum dipilih' },
    { label: 'Narrative', ready: narrative.trim().length >= 1, emptyLabel: 'Belum diisi' },
    { label: 'Required slots', ready: requiredSlots > 0, emptyLabel: 'Minimal 1' },
    { label: 'Deadline', ready: Boolean(deadline), emptyLabel: 'Belum diisi' },
    { label: 'Status', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [deadline, narrative, platform, requiredSlots, stance, status, targetPostUrl])

  const canCreate = checklist.every(item => item.ready)
  const accounts = accountsQuery.data?.data ?? []
  const selectedAccount = accounts.find(account => account.id === socialAccountId)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canCreate) {
      toast.error('Lengkapi field wajib sebelum membuat command.')
      return
    }
    createMutation.mutate()
  }

  return (
    <RoleGuard roles={['ADMIN']}>
      <div>
        <Link href={`/campaigns/${campaignId}/commands`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
          <ArrowLeft size={15} /> Back to Comment Commands
        </Link>

        <div className="section-heading-row" style={{ marginTop: 0 }}>
          <div>
            <div className="section-kicker">Comment Keep Queue</div>
            <h1 className="section-title" style={{ fontSize: '2rem' }}>Create Comment Command</h1>
            <p className="section-subtitle">Publish comment slots for all campaign Buzzers using first come, first served Keep.</p>
            <div className="blast-info-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <span>Comment command terbuka untuk semua Buzzer member campaign. Buzzer pertama yang melakukan Keep akan mengunci satu comment slot.</span>
            </div>
          </div>
        </div>

        {campaignQuery.isError ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat campaign" description={mapApiErrorToToastMessage(campaignQuery.error)} />
        ) : (
          <div className="campaign-create-grid">
            <div className="enterprise-form-card">
              <form onSubmit={handleSubmit}>
                <section className="campaign-create-section">
                  <SectionHeader number={1} title="Target Information" icon={<Link2 size={15} />} />
                  <div className="field-grid-2">
                    <div className="form-group">
                      <label className="form-label">Platform <span className="required-dot">Required</span></label>
                      <div className="platform-card-grid platform-card-grid-compact" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        {(['INSTAGRAM', 'TIKTOK', 'X_TWITTER', 'FACEBOOK'] as Platform[]).map(item => {
                          const selected = platform === item
                          const brandStyles: Record<Platform, { bg: string; icon: string }> = {
                            INSTAGRAM: { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', icon: '/instagram.svg' },
                            TIKTOK: { bg: '#69C9D0', icon: '/tiktok.svg' },
                            X_TWITTER: { bg: '#FFFFFF', icon: '/x.svg' },
                            FACEBOOK: { bg: '#1877F2', icon: '/facebook.svg' }
                          }
                          const style = brandStyles[item]
                          
                          return (
                            <button 
                              key={item} 
                              type="button" 
                              className={`platform-select-card-wide ${selected ? 'selected' : ''}`} 
                              onClick={() => { setPlatform(item); setSocialAccountId('') }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.65rem 0.85rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: selected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                width: '100%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div 
                                style={{ 
                                  width: 18, height: 18, 
                                  background: style.bg,
                                  WebkitMaskImage: `url(${style.icon})`,
                                  maskImage: `url(${style.icon})`,
                                  WebkitMaskRepeat: 'no-repeat',
                                  maskRepeat: 'no-repeat',
                                  WebkitMaskSize: 'contain',
                                  maskSize: 'contain',
                                  opacity: selected ? 1 : 0.6
                                }} 
                              />
                              <span style={{ 
                                color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                textTransform: 'capitalize'
                              }}>
                                {item.toLowerCase().replace('_', ' ')}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label">Optional Social Account / Source Account</label>
                      <select className="input-field" value={socialAccountId} onChange={event => setSocialAccountId(event.target.value)} disabled={accountsQuery.isLoading}>
                        <option value="">No source account</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>@{account.username}</option>
                        ))}
                      </select>
                      <div className="muted-meta" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                        Pilih akun yang akan digunakan sebagai pengirim interaksi.
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.9rem' }}>
                    <Input label="Target Post URL" type="url" value={targetPostUrl} onChange={event => setTargetPostUrl(event.target.value)} placeholder="https://..." required />
                  </div>
                </section>

                <section className="campaign-create-section">
                  <SectionHeader number={2} title="Comment Narrative" icon={<MessageCircle size={15} />} />
                  <div className="status-card-grid">
                    {(['PRO', 'KONTRA'] as Stance[]).map(item => (
                      <button key={item} type="button" className={`status-select-card ${stance === item ? 'selected' : ''}`} onClick={() => setStance(item)}>
                        <StanceBadge stance={item} />
                        <div className="muted-meta" style={{ marginTop: '0.45rem', textAlign: 'left' }}>{item === 'PRO' ? 'Supportive narrative direction' : 'Critical narrative direction'}</div>
                      </button>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginTop: '0.9rem' }}>
                    <label className="form-label">Narrative <span className="required-dot">Required</span></label>
                    <textarea className="input-field" rows={4} value={narrative} onChange={event => setNarrative(event.target.value)} placeholder="Tuliskan narasi komentar..." style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Instruction <span className="form-label-optional">Optional</span></label>
                    <textarea className="input-field" rows={3} value={instruction} onChange={event => setInstruction(event.target.value)} placeholder="Instruksi tambahan untuk Buzzer..." style={{ resize: 'vertical' }} />
                  </div>
                </section>

                <section className="campaign-create-section">
                  <SectionHeader number={3} title="Keep & Slot Rules" icon={<ShieldCheck size={15} />} />
                  <div className="field-grid-2">
                    <Input label="Required Slots" type="number" min={1} value={requiredSlots} onChange={event => setRequiredSlots(Number(event.target.value))} required />
                    <Input label="Keep Expiry Duration (minutes)" type="number" min={1} max={1440} value={keepExpiryMinutes} onChange={event => setKeepExpiryMinutes(Number(event.target.value))} />
                    <Input label="Deadline" type="datetime-local" value={deadline} onChange={event => setDeadline(event.target.value)} required />
                    <div className="form-group">
                      <label className="form-label">Status <span className="required-dot">Required</span></label>
                      <div className="status-card-grid">
                        {(['DRAFT', 'ACTIVE'] as const).map(item => (
                          <button key={item} type="button" className={`status-select-card ${status === item ? 'selected' : ''}`} onClick={() => setStatus(item)}>
                            <StatusBadge status={item} type="command" size="sm" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="campaign-create-section">
                  <SectionHeader number={4} title="Notes" icon={<FileText size={15} />} />
                  <div className="form-group">
                    <label className="form-label">Internal Notes <span className="form-label-optional">Optional</span></label>
                    <textarea className="input-field" rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Catatan internal UI saja..." style={{ resize: 'vertical' }} />
                  </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Button type="submit" disabled={!canCreate} loading={createMutation.isPending} icon={<Send size={14} />}>Create Command</Button>
                </div>
              </form>
            </div>

            <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
              <div className="campaign-summary-panel">
                <strong>Command Summary</strong>
                <SummaryLine label="Campaign" value={campaignQuery.data?.name ?? '-'} />
                <SummaryLine label="Target URL" value={targetPostUrl || 'Belum diisi'} />
                <SummaryLine label="Platform" value={<PlatformBadge platform={platform} size="sm" />} />
                <SummaryLine label="Source" value={selectedAccount ? `@${selectedAccount.username}` : '-'} />
                <SummaryLine label="Stance" value={<StanceBadge stance={stance} size="sm" />} />
                <SummaryLine label="Required slots" value={requiredSlots} />
                <SummaryLine label="Deadline" value={deadline || 'Belum diisi'} />
                <SummaryLine label="Status" value={<StatusBadge status={status} type="command" size="sm" />} />
              </div>
              <div className="campaign-summary-panel">
                <strong>How It Works</strong>
                {['Admin publishes comment command', 'All campaign Buzzers can see it', 'First Buzzer to Keep locks one comment slot', 'Buzzer submits proof after commenting'].map((item, index) => (
                  <div key={item} className="checklist-item">
                    <span className="section-number" style={{ width: 22, height: 22 }}>{index + 1}</span>
                    <div style={{ gridColumn: 'span 2', fontWeight: 800 }}>{item}</div>
                  </div>
                ))}
              </div>
              <CompletionChecklistCard items={checklist} />
            </aside>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return <div className="summary-line"><div className="summary-label">{label}</div><div className="summary-value">{value}</div></div>
}
