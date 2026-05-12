'use client'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Circle, FileText, Flag, Info, Save, Send, Shield, Users, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformBadge, StatusBadge, RoleBadge } from '@/components/ui/badges'
import type { CampaignStatus, Platform } from '@/types'
import { AddCampaignMemberModal } from './add-campaign-member-modal'

export type CampaignMemberRole = 'ADMIN' | 'BUZZER' | 'VIEWER'

export interface MockMember {
  id: string
  name: string
  role: CampaignMemberRole
  email?: string
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

export function SectionHeader({ number, title, icon, action }: { number: number; title: string; icon: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div className="section-number-title" style={{ marginBottom: 0 }}>
        <span className="section-number">{number}</span>
        <span style={{ color: 'var(--cyan)', display: 'flex' }}>{icon}</span>
        <strong>{title}</strong>
      </div>
      {action}
    </div>
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)

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
    { label: 'Platforms selected', ready: platforms.length > 0, emptyLabel: 'Belum dipilih' },
    { label: 'Admin members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Buzzer members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Status', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [endDate, name, periodInvalid, platforms.length, startDate, status])

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

  const handleConfirmMembers = (users: MockMember[]) => {
    setAdminIds(users.filter(u => u.role === 'ADMIN').map(u => u.id))
    setBuzzerIds(users.filter(u => u.role === 'BUZZER').map(u => u.id))
    setViewerIds(users.filter(u => u.role === 'VIEWER').map(u => u.id))
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
            <SectionHeader 
              number={5} 
              title="Campaign Members" 
              icon={<Users size={15} />} 
              action={
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsMemberModalOpen(true)} icon={<Plus size={14} />}>
                  Add Member
                </Button>
              }
            />
            <p className="section-helper-text">Assignment ini berlaku untuk Campaign. Blast Link baru otomatis terbuka untuk semua Buzzer member campaign.</p>
            {membersLoading && <p className="muted-meta">Memuat user aktif...</p>}
            
            {(!selectedAdmins.length && !selectedBuzzers.length && !selectedViewers.length) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 12, background: 'var(--bg-surface)' }}>
                <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Belum ada member dipilih. Klik Add Member untuk menambahkan user.</p>
                <Button type="button" onClick={() => setIsMemberModalOpen(true)} icon={<Plus size={16} />}>Add Member</Button>
              </div>
            ) : (
              <div className="member-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <MemberGroup 
                  title="ADMIN" 
                  users={selectedAdmins} 
                  required 
                  onRemove={(id) => setAdminIds(prev => prev.filter(x => x !== id))} 
                />
                <MemberGroup 
                  title="BUZZERS" 
                  users={selectedBuzzers} 
                  required={status === 'ACTIVE'} 
                  onRemove={(id) => setBuzzerIds(prev => prev.filter(x => x !== id))} 
                />
                <MemberGroup 
                  title="VIEWERS" 
                  users={selectedViewers} 
                  onRemove={(id) => setViewerIds(prev => prev.filter(x => x !== id))} 
                />
              </div>
            )}
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

      <AddCampaignMemberModal
        open={isMemberModalOpen}
        onOpenChange={setIsMemberModalOpen}
        availableMembers={availableMembers}
        selectedUserIds={[...adminIds, ...buzzerIds, ...viewerIds]}
        onConfirm={handleConfirmMembers}
      />
    </div>
  )
}

export function MemberGroup({ title, required, users, onRemove }: { title: string; required?: boolean; users: MockMember[]; onRemove: (id: string) => void }) {
  if (users.length === 0 && !required) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 1 }}>{title}</h4>
        <span style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '0 6px', borderRadius: 12 }}>{users.length}</span>
        {required && <span className="required-dot" style={{ marginLeft: 'auto' }}>REQUIRED</span>}
      </div>
      
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {users.length === 0 ? (
          <div style={{ padding: '0.75rem', border: '1px dashed var(--border-subtle)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Belum ada member
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8
            }}>
              <div className="mini-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>{initials(user.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                {user.email && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>}
                <div style={{ marginTop: 2 }}><RoleBadge role={user.role} /></div>
              </div>
              <button 
                type="button"
                onClick={() => onRemove(user.id)}
                style={{
                  background: 'rgba(255,0,60,0.1)', border: 'none', color: 'var(--red)', 
                  padding: 6, borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                }}
                title="Remove Member"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
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
