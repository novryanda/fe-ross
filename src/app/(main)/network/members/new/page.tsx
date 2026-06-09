'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, KeyRound, Mail, Save } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RoleGuard } from '@/components/layout/role-guard'
import { RoleBadge } from '@/components/layout/role-badge'
import { StatusBadge } from '@/components/ui/badges'
import { usersApi, type CreateUserDto } from '@/lib/api/users'
import { campaignsApi } from '@/lib/api/campaigns'
import { orgUnitsApi } from '@/lib/api/org-units'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { createMemberSchema } from '@/lib/validations'
import { useAuth } from '@/hooks/use-auth'
import type { UserRole, UserStatus } from '@/types'

const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: ['Manage campaigns', 'Manage social accounts', 'Manage members', 'View reports/audit'],
  BUZZER: ['View blast/comment queue', 'Keep tasks', 'Submit reports/proof'],
  PIC: ['View posting bank queue', 'Manage own social accounts', 'Submit posting result/proof'],
  VIEWER: ['Read-only dashboard/reports/exports'],
}

export default function NewMemberPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role: currentRole, isInitialized } = useAuth()
  const canLoadCampaigns = isInitialized && currentRole === 'ADMIN'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('BUZZER')
  const [status, setStatus] = useState<UserStatus>('ACTIVE')
  const [picUnitId, setPicUnitId] = useState('')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [sendInviteEmail, setSendInviteEmail] = useState(true)
  const [setTemporaryPasswordOn, setSetTemporaryPasswordOn] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [requirePasswordChange, setRequirePasswordChange] = useState(true)
  const [notes, setNotes] = useState('')

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', 'create-member-picker'],
    queryFn: () => campaignsApi.list({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: canLoadCampaigns,
  })
  const orgUnitsQuery = useQuery({
    queryKey: ['org-units', 'create-member-picker'],
    queryFn: () => orgUnitsApi.list({ limit: 100, status: 'ACTIVE' }),
    enabled: canLoadCampaigns,
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: (created) => {
      if (created.inviteRequested && created.inviteEmailSent) {
        toast.success('Member berhasil dibuat dan link password sudah dikirim ke email.')
      } else if (created.inviteRequested && !created.inviteEmailSent) {
        toast.warning('Member berhasil dibuat, tetapi email invite gagal dikirim.')
      } else {
        toast.success('Member berhasil dibuat.')
      }
      queryClient.invalidateQueries({ queryKey: ['users'] })
      router.push('/network/members')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId) ? prev.filter((id) => id !== campaignId) : [...prev, campaignId],
    )
  }

  const validation = useMemo(() => {
    const parsed = createMemberSchema.safeParse({
      name: fullName.trim(),
      email: email.trim(),
      role,
      status,
      campaignIds: selectedCampaigns.length ? selectedCampaigns : undefined,
      picUnitId: role === 'PIC' ? picUnitId || undefined : undefined,
      sendInviteEmail,
      setTemporaryPassword: setTemporaryPasswordOn,
      temporaryPassword: setTemporaryPasswordOn ? temporaryPassword : undefined,
      requirePasswordChange,
      notes: notes.trim() || undefined,
    })
    if (parsed.success) {
      return { ok: true as const, dto: parsed.data, issues: [] as string[] }
    }
    return {
      ok: false as const,
      issues: parsed.error.issues.map((issue) => issue.message),
    }
  }, [fullName, email, role, status, picUnitId, selectedCampaigns, sendInviteEmail, setTemporaryPasswordOn, temporaryPassword, requirePasswordChange, notes])

  const checklist = [
    { label: 'Full name (min 2 karakter)', ready: fullName.trim().length >= 2 },
    { label: 'Valid email', ready: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) },
    { label: 'Role selected', ready: Boolean(role) },
    {
      label: 'Credential flow selected',
      ready: sendInviteEmail || !setTemporaryPasswordOn || temporaryPassword.length >= 8,
    },
  ]

  const canSubmit = validation.ok && !createMutation.isPending

  const handleSubmit = () => {
    if (!validation.ok) {
      toast.error(validation.issues[0] ?? 'Input belum valid.')
      return
    }
    const parsed = validation.dto
    const payload: CreateUserDto = {
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      status: parsed.status,
    }
    if (parsed.picUnitId) payload.picUnitId = parsed.picUnitId
    if (parsed.campaignIds?.length) payload.campaignIds = parsed.campaignIds
    if (parsed.sendInviteEmail) payload.sendInviteEmail = true
    if (parsed.setTemporaryPassword && parsed.temporaryPassword) {
      payload.temporaryPassword = parsed.temporaryPassword
    }
    if (parsed.requirePasswordChange) payload.requirePasswordChange = true
    if (parsed.notes) payload.notes = parsed.notes
    createMutation.mutate(payload)
  }

  const campaigns = campaignsQuery.data?.data ?? []
  const orgUnits = orgUnitsQuery.data?.data ?? []
  const requiresPicUnit = role === 'PIC'

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Add Member"
          subtitle="Buat user internal baru untuk mengakses ROSS."
          backHref="/network/members"
          actions={
            <button type="button" className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
              <Save size={14} /> {createMutation.isPending ? 'Saving...' : 'Save Member'}
            </button>
          }
        />

        <div className="info-banner info-banner-cyan" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
          <div>
            Anda bisa kirim link email agar user membuat password sendiri, atau set temporary password manual bila diperlukan.
          </div>
        </div>

        <div className="form-dashboard-grid">
          <section className="form-panel">
            <div className="form-section">
              <div className="form-section-title"><span className="step-number">1</span> Account Information</div>
              <div className="field-grid-2">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. ByteWraith"
                  disabled={createMutation.isPending}
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="member@ross.id"
                  disabled={createMutation.isPending}
                />
                <Select
                  label="Role"
                  value={role}
                  onChange={(event) => {
                    const nextRole = event.target.value as UserRole
                    setRole(nextRole)
                    if (nextRole !== 'PIC') setPicUnitId('')
                  }}
                  options={[
                    { value: 'ADMIN', label: 'ADMIN' },
                    { value: 'BUZZER', label: 'BUZZER' },
                    { value: 'PIC', label: 'PIC' },
                    { value: 'VIEWER', label: 'VIEWER' },
                  ]}
                  disabled={createMutation.isPending}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as UserStatus)}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                  disabled={createMutation.isPending}
                />
              </div>
              {requiresPicUnit && (
                <div style={{ marginTop: '1rem' }}>
                  <Select
                    label="PIC Unit"
                    value={picUnitId}
                    onChange={(event) => setPicUnitId(event.target.value)}
                    options={orgUnits.map((unit) => ({
                      value: unit.id,
                      label: unit.parent ? `${unit.parent.name} / ${unit.name}` : unit.name,
                    }))}
                    error={!picUnitId ? 'PIC wajib di-assign ke unit aktif.' : undefined}
                    disabled={createMutation.isPending || orgUnitsQuery.isLoading}
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">2</span> Access & Campaigns</div>
              <p className="section-helper-text">
                Campaign membership menentukan campaign mana yang bisa diakses user. Buzzer mendapat blast queue, PIC mendapat posting bank campaign, Viewer read-only. PIC tetap wajib punya unit organisasi.
              </p>
              {campaignsQuery.isLoading ? (
                <div className="skeleton" style={{ height: 56, borderRadius: 10 }} />
              ) : !campaigns.length ? (
                <div className="preview-card" style={{ color: 'var(--text-muted)' }}>
                  Belum ada campaign yang bisa dipilih.
                </div>
              ) : (
                <div className="member-grid">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      className={`member-select-row ${selectedCampaigns.includes(campaign.id) ? 'selected' : ''}`}
                      onClick={() => toggleCampaign(campaign.id)}
                      disabled={createMutation.isPending}
                    >
                      <span className="mini-avatar">{campaign.name.charAt(0)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 800, color: 'var(--text-primary)' }}>{campaign.name}</span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{campaign.status}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">3</span> Initial Credentials</div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <label
                  className="preview-card"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: createMutation.isPending ? 'not-allowed' : 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={sendInviteEmail}
                    onChange={(event) => setSendInviteEmail(event.target.checked)}
                    disabled={createMutation.isPending}
                    aria-label="Send invite email"
                  />
                  <span style={{ color: 'var(--cyan)', display: 'flex' }}><Mail size={15} /></span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    Send invite email <span className="muted-meta">- link buat/reset password dikirim ke email user</span>
                  </span>
                </label>

                <label className="preview-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: createMutation.isPending ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={setTemporaryPasswordOn}
                    onChange={(event) => setSetTemporaryPasswordOn(event.target.checked)}
                    disabled={createMutation.isPending}
                  />
                  <span style={{ color: 'var(--cyan)', display: 'flex' }}><KeyRound size={15} /></span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Set temporary password</span>
                </label>

                {setTemporaryPasswordOn && (
                  <div style={{ paddingLeft: '1.75rem' }}>
                    <Input
                      label="Temporary Password"
                      type="text"
                      value={temporaryPassword}
                      onChange={(event) => setTemporaryPassword(event.target.value)}
                      placeholder="Min 8 karakter"
                      hint="Password akan di-hash oleh backend. Sampaikan ke user lewat channel aman di luar aplikasi."
                      disabled={createMutation.isPending}
                    />
                  </div>
                )}

                <label className="preview-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: createMutation.isPending ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requirePasswordChange}
                    onChange={(event) => setRequirePasswordChange(event.target.checked)}
                    disabled={createMutation.isPending}
                  />
                  <span style={{ color: 'var(--cyan)', display: 'flex' }}><CheckCircle2 size={15} /></span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    Require password change on first login <span className="muted-meta">- tercatat di audit log</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">4</span> Notes</div>
              <textarea
                className="input-field"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Internal notes optional"
                style={{ resize: 'vertical' }}
                maxLength={1000}
                disabled={createMutation.isPending}
              />
            </div>
          </section>

          <aside className="helper-panel">
            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Member Summary</h3>
              <div className="preview-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="mini-avatar">{fullName.trim().charAt(0) || 'M'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{fullName || 'New member'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{email || 'email pending'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                  <RoleBadge role={role} />
                  <StatusBadge type="user" status={status} size="sm" />
                </div>
              </div>
            </div>

            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Role Permission Preview</h3>
              <div className="mini-stepper">
                {rolePermissions[role].map((permission, index) => (
                  <div key={permission} className="mini-step">
                    <span className="mini-step-dot">{index + 1}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Completion Checklist</h3>
              {checklist.map((item) => (
                <div key={item.label} className={`checklist-item ${item.ready ? '' : 'invalid'}`}>
                  <CheckCircle2 size={17} style={{ color: item.ready ? 'var(--status-active)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700 }}>{item.label}</span>
                  <span className={`checklist-status ${item.ready ? 'ready' : 'invalid'}`}>{item.ready ? 'Ready' : 'Needed'}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </RoleGuard>
  )
}
