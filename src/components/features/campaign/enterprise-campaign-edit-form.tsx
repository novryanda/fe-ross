'use client'
import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, FileText, Flag, Info, Save, Shield, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import type { CampaignStatus, Platform } from '@/types'
import {
  CampaignSummaryCard,
  CompletionChecklistCard,
  MemberColumn,
  MOCK_MEMBERS,
  PLATFORM_OPTIONS,
  SectionHeader,
  UserChip,
  type ChecklistItem,
  type MockMember,
} from '@/components/features/campaign/enterprise-campaign-form'

export interface EnterpriseCampaignEditPayload {
  name: string
  description?: string
  objective: string
  startDate: string
  endDate: string
  platforms: Platform[]
  status: CampaignStatus
  members: {
    adminIds: string[]
    buzzerIds: string[]
    viewerIds: string[]
  }
  internalNotes?: string
}

interface EnterpriseCampaignEditFormProps {
  initial: EnterpriseCampaignEditPayload
  onCancel: () => void
  onSave: (data: EnterpriseCampaignEditPayload) => void
  onArchive: () => void
  loading?: boolean
  archiveLoading?: boolean
  availableMembers?: MockMember[]
  membersLoading?: boolean
}

const STATUS_OPTIONS: { value: CampaignStatus; title: string; description: string }[] = [
  { value: 'DRAFT', title: 'Draft', description: 'Campaign masih disiapkan.' },
  { value: 'ACTIVE', title: 'Active', description: 'Campaign tersedia untuk operasi.' },
  { value: 'COMPLETED', title: 'Completed', description: 'Campaign selesai dan tetap tersimpan.' },
  { value: 'ARCHIVED', title: 'Archived', description: 'Campaign disembunyikan dari operasi aktif.' },
]

function normalizePayload(data: EnterpriseCampaignEditPayload) {
  return {
    ...data,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    objective: data.objective.trim(),
    internalNotes: data.internalNotes?.trim() || undefined,
    platforms: [...data.platforms].sort(),
    members: {
      adminIds: [...data.members.adminIds].sort(),
      buzzerIds: [...data.members.buzzerIds].sort(),
      viewerIds: [...data.members.viewerIds].sort(),
    },
  }
}

function makeSignature(data: EnterpriseCampaignEditPayload) {
  return JSON.stringify(normalizePayload(data))
}

export function EnterpriseCampaignEditForm({ initial, onCancel, onSave, onArchive, loading, archiveLoading, availableMembers = MOCK_MEMBERS, membersLoading }: EnterpriseCampaignEditFormProps) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [objective, setObjective] = useState(initial.objective)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [platforms, setPlatforms] = useState<Platform[]>(initial.platforms)
  const [status, setStatus] = useState<CampaignStatus>(initial.status)
  const [adminIds, setAdminIds] = useState<string[]>(initial.members.adminIds)
  const [buzzerIds, setBuzzerIds] = useState<string[]>(initial.members.buzzerIds)
  const [viewerIds, setViewerIds] = useState<string[]>(initial.members.viewerIds)
  const [notes, setNotes] = useState(initial.internalNotes ?? '')

  const admins = availableMembers.filter(user => user.role === 'ADMIN')
  const buzzers = availableMembers.filter(user => user.role === 'BUZZER')
  const viewers = availableMembers.filter(user => user.role === 'VIEWER')
  const selectedAdmins = admins.filter(user => adminIds.includes(user.id))
  const selectedBuzzers = buzzers.filter(user => buzzerIds.includes(user.id))
  const selectedViewers = viewers.filter(user => viewerIds.includes(user.id))
  const periodInvalid = Boolean(startDate && endDate && endDate < startDate)

  const payload: EnterpriseCampaignEditPayload = {
    name,
    description,
    objective,
    startDate,
    endDate,
    platforms,
    status,
    members: { adminIds, buzzerIds, viewerIds },
    internalNotes: notes,
  }

  const hasChanges = makeSignature(payload) !== makeSignature(initial)

  const checklist = useMemo<ChecklistItem[]>(() => [
    { label: 'Campaign name valid', ready: name.trim().length >= 3, emptyLabel: 'Belum valid' },
    { label: 'Objective (UI-only)', ready: true, emptyLabel: 'Opsional' },
    { label: 'Period valid', ready: Boolean(startDate && endDate && !periodInvalid), emptyLabel: periodInvalid ? 'Tanggal tidak valid' : 'Belum lengkap', invalid: periodInvalid },
    { label: 'Platforms (UI-only)', ready: true, emptyLabel: 'Opsional' },
    { label: 'Admin members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Buzzer members', ready: true, emptyLabel: 'Opsional' },
    { label: 'Status selected', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [endDate, name, periodInvalid, startDate, status])

  const canSave = checklist.every(item => item.ready) && hasChanges

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

  const summaryText = (value: string) => value.trim() || 'Belum diisi'

  return (
    <div className="campaign-create-grid">
      <div className="enterprise-form-card">
        <form onSubmit={(event) => { event.preventDefault(); if (canSave) onSave(normalizePayload(payload)) }}>
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
            <div className="status-card-grid status-card-grid-4">
              {STATUS_OPTIONS.map(option => (
                <button key={option.value} type="button" className={`status-select-card ${status === option.value ? 'selected' : ''}`} onClick={() => setStatus(option.value)}>
                  <div style={{ display: 'grid', gap: '0.55rem', textAlign: 'left' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 850 }}>{option.title}</div>
                    <StatusBadge status={option.value} type="campaign" size="sm" />
                    <div className="muted-meta">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="campaign-create-section">
            <SectionHeader number={5} title="Campaign Members" icon={<Users size={15} />} />
            <p className="section-helper-text">Assignment ini berlaku di level Campaign. Blast Link tetap tidak memiliki manual assignment.</p>
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
            <Button type="button" variant="secondary" icon={<X size={14} />} onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={!canSave || loading} loading={loading} icon={<Save size={14} />}>Save Changes</Button>
          </div>
        </form>
      </div>

      <aside style={{ position: 'sticky', top: 72, display: 'grid', gap: '1rem' }}>
        <CampaignSummaryCard
          title="Current Campaign Summary"
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
        <CompletionChecklistCard
          title="Validation Checklist"
          items={checklist}
          badge={<span className={`unsaved-pill ${hasChanges ? 'active' : ''}`}>{hasChanges ? 'Unsaved changes' : 'No changes'}</span>}
        />
        <div className="campaign-summary-panel danger-zone-card">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ color: 'var(--status-rejected)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 850, marginBottom: '0.25rem' }}>Danger Zone</div>
              <p className="muted-meta" style={{ lineHeight: 1.7, marginBottom: '0.85rem' }}>
                Archiving will hide this campaign from active operation but preserve history.
              </p>
              <button type="button" className="btn-danger-outline" onClick={onArchive} disabled={archiveLoading} style={{ opacity: archiveLoading ? 0.7 : undefined, cursor: archiveLoading ? 'wait' : undefined }}>
                {archiveLoading ? 'Archiving...' : 'Archive Campaign'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
