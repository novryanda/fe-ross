'use client'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Circle, FileText, Flag, Info, Save, Send, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import type { CampaignStatus, Platform } from '@/types'

export type CampaignMemberRole = 'ADMIN' | 'BUZZER' | 'VIEWER'

export interface MockMember {
  id: string
  name: string
  role: CampaignMemberRole
}

export interface ChecklistItem {
  label: string
  ready: boolean
  emptyLabel: string
  invalid?: boolean
}

export interface EnterpriseCampaignPayload {
  name: string
  description?: string
  objective: string
  startDate: string
  endDate: string
  platforms: Platform[]
  status: Extract<CampaignStatus, 'DRAFT' | 'ACTIVE'>
  members: {
    adminIds: string[]
    buzzerIds: string[]
    viewerIds: string[]
  }
  internalNotes?: string
}

interface EnterpriseCampaignFormProps {
  onCreate: (data: EnterpriseCampaignPayload) => void
  onSaveDraft: (data: Partial<EnterpriseCampaignPayload>) => void
  loading?: boolean
  availableMembers?: MockMember[]
  membersLoading?: boolean
}

export const PLATFORM_OPTIONS: { value: Platform; label: string; description: string; icon: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram', description: 'Feed, Reels, dan post URL', icon: '/instagram.svg' },
  { value: 'TIKTOK', label: 'TikTok', description: 'Video post dan campaign awareness', icon: '/tiktok.svg' },
  { value: 'X_TWITTER', label: 'X/Twitter', description: 'Thread, post, dan conversation', icon: '/x.svg' },
  { value: 'FACEBOOK', label: 'Facebook', description: 'Community dan page post', icon: '/facebook.svg' },
]

export const MOCK_MEMBERS: MockMember[] = [
  { id: 'admin-reza', name: 'Reza Admin', role: 'ADMIN' },
  { id: 'buzzer-bytewraith', name: 'ByteWraith', role: 'BUZZER' },
  { id: 'buzzer-novasyn', name: 'NovaSyn', role: 'BUZZER' },
  { id: 'buzzer-sparkwave', name: 'SparkWave', role: 'BUZZER' },
  { id: 'buzzer-cipherqueen', name: 'CipherQueen', role: 'BUZZER' },
  { id: 'viewer-jordan', name: 'Jordan Lee', role: 'VIEWER' },
  { id: 'viewer-viralvortex', name: 'ViralVortex', role: 'VIEWER' },
  { id: 'viewer-echolaunch', name: 'EchoLaunch', role: 'VIEWER' },
]

export function initials(name: string) {
  return name.split(' ').map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase()
}

export function SectionHeader({ number, title, icon }: { number: number; title: string; icon: ReactNode }) {
  return (
    <div className="section-number-title">
      <span className="section-number">{number}</span>
      <span style={{ color: 'var(--cyan)', display: 'flex' }}>{icon}</span>
      <strong>{title}</strong>
    </div>
  )
}

export function UserChip({ user }: { user: MockMember }) {
  return (
    <span className="selected-chip">
      <span className="mini-avatar" style={{ width: 20, height: 20, borderRadius: 7, fontSize: '0.58rem' }}>{initials(user.name)}</span>
      {user.name}
    </span>
  )
}

export function EnterpriseCampaignForm({ onCreate, onSaveDraft, loading, availableMembers = MOCK_MEMBERS, membersLoading }: EnterpriseCampaignFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [objective, setObjective] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [status, setStatus] = useState<Extract<CampaignStatus, 'DRAFT' | 'ACTIVE'>>('DRAFT')
  const [adminIds, setAdminIds] = useState<string[]>([])
  const [buzzerIds, setBuzzerIds] = useState<string[]>([])
  const [viewerIds, setViewerIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const admins = availableMembers.filter(user => user.role === 'ADMIN')
  const buzzers = availableMembers.filter(user => user.role === 'BUZZER')
  const viewers = availableMembers.filter(user => user.role === 'VIEWER')
  const selectedAdmins = admins.filter(user => adminIds.includes(user.id))
  const selectedBuzzers = buzzers.filter(user => buzzerIds.includes(user.id))
  const selectedViewers = viewers.filter(user => viewerIds.includes(user.id))
  const periodInvalid = Boolean(startDate && endDate && endDate < startDate)

  const checklist = useMemo(() => [
    { label: 'Campaign name', ready: name.trim().length >= 3, emptyLabel: 'Belum diisi' },
    { label: 'Objective (UI-only)', ready: true, emptyLabel: 'Opsional' },
    { label: 'Period', ready: Boolean(startDate && endDate && !periodInvalid), emptyLabel: periodInvalid ? 'Tanggal tidak valid' : 'Belum lengkap', invalid: periodInvalid },
    { label: 'Platforms (UI-only)', ready: true, emptyLabel: 'Opsional' },
    { label: 'Admin members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Buzzer members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Status', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [endDate, name, periodInvalid, startDate, status])

  const canCreate = checklist.every(item => item.ready)

  const togglePlatform = (platform: Platform) => {
    setPlatforms(current => current.includes(platform) ? current.filter(item => item !== platform) : [...current, platform])
  }

  const toggleId = (id: string, current: string[], setter: (value: string[]) => void, single = false) => {
    if (single) {
      setter(current.includes(id) ? [] : [id])
      return
    }
    setter(current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  const buildPayload = (draftStatus: Extract<CampaignStatus, 'DRAFT' | 'ACTIVE'> = status): EnterpriseCampaignPayload => ({
    name: name.trim() || 'Untitled Campaign Draft',
    description: description.trim() || undefined,
    objective: objective.trim(),
    startDate,
    endDate,
    platforms,
    status: draftStatus,
    members: {
      adminIds,
      buzzerIds,
      viewerIds,
    },
    internalNotes: notes.trim() || undefined,
  })

  const summaryText = (value: string) => value.trim() || 'Belum diisi'

  return (
    <div className="campaign-create-grid">
      <div className="enterprise-form-card">
        <form onSubmit={(event) => { event.preventDefault(); if (canCreate) onCreate(buildPayload(status)) }}>
          <section className="campaign-create-section">
            <SectionHeader number={1} title="Campaign Information" icon={<Flag size={15} />} />
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <Input label="Campaign Name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Kampanye Literasi Digital Mei" required />
              <div className="form-group">
                <label className="form-label">Description <span className="form-label-optional">Optional</span></label>
                <textarea className="input-field" rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Deskripsi singkat campaign..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Objective <span className="required-dot">Required</span></label>
                <textarea className="input-field" rows={3} value={objective} onChange={event => setObjective(event.target.value)} placeholder="Tujuan utama campaign dan outcome yang ingin dicapai..." style={{ resize: 'vertical' }} required />
              </div>
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={2} title="Period" icon={<CalendarDays size={15} />} />
            <div className="field-grid-2">
              <Input label="Start Date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required />
              <Input label="End Date" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} error={periodInvalid ? 'End Date tidak boleh sebelum Start Date.' : undefined} required />
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={3} title="Platforms" icon={<Info size={15} />} />
            <div className="platform-card-grid">
              {PLATFORM_OPTIONS.map(platform => {
                const selected = platforms.includes(platform.value)
                return (
                  <button 
                    key={platform.value} 
                    type="button" 
                    className={`platform-select-card-wide ${selected ? 'selected' : ''}`} 
                    onClick={() => togglePlatform(platform.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-surface)',
                      border: selected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 8, 
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div 
                        style={{ 
                          width: 20, height: 20, 
                          background: platform.value === 'INSTAGRAM' ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
                            : platform.value === 'TIKTOK' ? '#69C9D0'
                            : platform.value === 'FACEBOOK' ? '#1877F2'
                            : '#FFFFFF',
                          WebkitMaskImage: `url(${platform.icon})`,
                          maskImage: `url(${platform.icon})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          opacity: selected ? 1 : 0.6,
                          transition: 'all 0.2s'
                        }} 
                      />
                    </div>
                    
                    <span style={{ 
                      flex: 1, 
                      textAlign: 'left', 
                      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {platform.label}
                    </span>

                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: selected ? 'none' : '2px solid var(--border-subtle)',
                      background: selected ? 'var(--cyan)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {selected && <CheckCircle2 size={14} style={{ color: '#000' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={4} title="Status" icon={<Shield size={15} />} />
            <div className="status-card-grid">
              {([
                { value: 'DRAFT' as const, title: 'Draft', description: 'Siapkan struktur campaign sebelum aktif.' },
                { value: 'ACTIVE' as const, title: 'Active', description: 'Campaign langsung tersedia untuk operasi.' },
              ]).map(option => (
                <button key={option.value} type="button" className={`status-select-card ${status === option.value ? 'selected' : ''}`} onClick={() => setStatus(option.value)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 850 }}>{option.title}</div>
                      <div className="muted-meta">{option.description}</div>
                    </div>
                    <StatusBadge status={option.value} type="campaign" size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={5} title="Campaign Members" icon={<Users size={15} />} />
            <p className="section-helper-text">Assignment ini berlaku untuk Campaign. Blast Link baru otomatis terbuka untuk semua Buzzer member campaign.</p>
            {membersLoading && <p className="muted-meta">Memuat user aktif...</p>}
            <div className="member-grid">
              <MemberColumn title="Admin" required users={admins} selectedIds={adminIds} onToggle={id => toggleId(id, adminIds, setAdminIds, true)} />
              <MemberColumn title="Buzzers" required users={buzzers} selectedIds={buzzerIds} onToggle={id => toggleId(id, buzzerIds, setBuzzerIds)} />
              <MemberColumn title="Viewers" users={viewers} selectedIds={viewerIds} onToggle={id => toggleId(id, viewerIds, setViewerIds)} />
            </div>
            <div className="selected-chip-row">
              {[...selectedAdmins, ...selectedBuzzers, ...selectedViewers].map(user => <UserChip key={user.id} user={user} />)}
              {!selectedAdmins.length && !selectedBuzzers.length && !selectedViewers.length && <span className="muted-meta">Belum ada member dipilih.</span>}
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={6} title="Notes" icon={<FileText size={15} />} />
            <div className="form-group">
              <label className="form-label">Internal Notes <span className="form-label-optional">Optional</span></label>
              <textarea className="input-field" rows={4} value={notes} onChange={event => setNotes(event.target.value.slice(0, 500))} placeholder="Catatan internal untuk tim campaign..." style={{ resize: 'vertical' }} />
              <span className="form-hint">{notes.length}/500 characters</span>
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Button type="button" variant="secondary" icon={<Save size={14} />} onClick={() => onSaveDraft(buildPayload('DRAFT'))}>Save Draft</Button>
            <Button type="submit" disabled={!canCreate || loading} loading={loading} icon={<Send size={14} />}>Create Campaign</Button>
          </div>
        </form>
      </div>

      <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
        <CampaignSummaryCard
          name={summaryText(name)}
          objective={summaryText(objective)}
          period={startDate || endDate ? `${startDate || '-'} - ${endDate || '-'}` : 'Belum diisi'}
          platforms={platforms}
          status={status}
          adminCount={adminIds.length}
          buzzerCount={buzzerIds.length}
          viewerCount={viewerIds.length}
          notes={notes.trim() || 'Belum diisi'}
        />
        <CompletionChecklistCard items={checklist} />
        <div className="campaign-summary-panel">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 850, marginBottom: '0.25rem' }}>Campaign sebagai container utama</div>
              <p className="muted-meta" style={{ lineHeight: 1.7 }}>
                Campaign akan menjadi container utama untuk Blast Links, Comment Commands, Tasks, Reports, Members, dan Audit.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function MemberColumn({ title, required, users, selectedIds, onToggle }: { title: string; required?: boolean; users: MockMember[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <div className="member-column-title">{title} {required && <span className="required-dot">Required</span>}</div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {users.length === 0 ? (
          <div className="muted-meta" style={{ padding: '0.65rem 0' }}>Tidak ada user aktif.</div>
        ) : users.map(user => {
          const selected = selectedIds.includes(user.id)
          return (
            <button key={user.id} type="button" className={`member-select-row ${selected ? 'selected' : ''}`} onClick={() => onToggle(user.id)}>
              <span className="mini-avatar">{initials(user.name)}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800 }}>{user.name}</span>
                <span className="muted-meta">{user.role}</span>
              </span>
              {selected && <CheckCircle2 size={15} style={{ color: 'var(--status-active)', marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CampaignSummaryCard({
  title = 'Campaign Summary',
  name,
  objective,
  period,
  platforms,
  status,
  adminCount,
  buzzerCount,
  viewerCount,
  notes,
}: {
  title?: string
  name: string
  objective: string
  period: string
  platforms: Platform[]
  status: CampaignStatus
  adminCount: number
  buzzerCount: number
  viewerCount: number
  notes: string
}) {
  return (
    <div className="campaign-summary-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
        <Flag size={16} style={{ color: 'var(--cyan)' }} />
        <strong>{title}</strong>
      </div>
      <div className="summary-line"><div className="summary-label">Name</div><div className="summary-value">{name}</div></div>
      <div className="summary-line"><div className="summary-label">Objective</div><div className="summary-value">{objective}</div></div>
      <div className="summary-line"><div className="summary-label">Period</div><div className="summary-value">{period}</div></div>
      <div className="summary-line">
        <div className="summary-label">Platforms</div>
        <div className="summary-value" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {platforms.length ? platforms.map(platform => <PlatformBadge key={platform} platform={platform} size="sm" />) : 'Belum dipilih'}
        </div>
      </div>
      <div className="summary-line"><div className="summary-label">Status</div><div className="summary-value"><StatusBadge status={status} type="campaign" size="sm" /></div></div>
      <div className="summary-line">
        <div className="summary-label">Members</div>
        <div className="summary-value">{adminCount} Admin / {buzzerCount} Buzzer / {viewerCount} Viewer</div>
      </div>
      <div className="summary-line"><div className="summary-label">Notes</div><div className="summary-value">{notes}</div></div>
    </div>
  )
}

export function CompletionChecklistCard({ items, title = 'Completion Checklist', badge }: { items: ChecklistItem[]; title?: string; badge?: ReactNode }) {
  return (
    <div className="campaign-summary-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.55rem', marginBottom: '0.65rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--status-active)' }} />
          <strong>{title}</strong>
        </span>
        {badge}
      </div>
      {items.map(item => (
        <div key={item.label} className={`checklist-item ${item.invalid ? 'invalid' : ''}`}>
          {item.ready
            ? <CheckCircle2 size={18} style={{ color: 'var(--status-active)' }} />
            : item.invalid
              ? <AlertCircle size={18} style={{ color: 'var(--status-rejected)' }} />
              : <Circle size={18} style={{ color: 'var(--text-muted)' }} />}
          <div style={{ fontWeight: 800 }}>{item.label}</div>
          <div className={`checklist-status ${item.ready ? 'ready' : item.invalid ? 'invalid' : ''}`}>{item.ready ? 'Siap' : item.emptyLabel}</div>
        </div>
      ))}
    </div>
  )
}
