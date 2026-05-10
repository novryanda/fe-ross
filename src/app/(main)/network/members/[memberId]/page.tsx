'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, KeyRound, Save, Shield, UserMinus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RoleGuard } from '@/components/layout/role-guard'
import { RoleBadge } from '@/components/layout/role-badge'
import { StatusBadge } from '@/components/ui/badges'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/hooks/use-auth'
import {
  usersApi,
  type AdminResetPasswordDto,
  type UserDetail,
} from '@/lib/api/users'
import { mapApiErrorToToastMessage, isApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types'

export default function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { role, isInitialized } = useAuth()
  const canLoadMember = isInitialized && role === 'ADMIN'

  const detailQuery = useQuery({
    queryKey: ['users', 'detail', memberId],
    queryFn: () => usersApi.get(memberId),
    enabled: canLoadMember,
    retry: (failureCount, error) => {
      if (isApiError(error) && error.code === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })

  if (!canLoadMember) {
    return (
      <RoleGuard roles={['ADMIN']}>
        <div />
      </RoleGuard>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="page-container" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: 240, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    const notFound = isApiError(detailQuery.error) && detailQuery.error.code === 'NOT_FOUND'
    return (
      <div className="page-container">
        <PageHeader title="Member Detail" backHref="/network/members" />
        <ErrorState
          title={notFound ? 'Member tidak ditemukan' : 'Gagal memuat member'}
          message={mapApiErrorToToastMessage(detailQuery.error)}
          retry={notFound ? undefined : () => detailQuery.refetch()}
        />
      </div>
    )
  }

  return <MemberDetailBody key={`${detailQuery.data.id}-${detailQuery.data.updatedAt}`} user={detailQuery.data} memberId={memberId} />
}

function MemberDetailBody({ user, memberId }: { user: UserDetail; memberId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user: currentUser, refreshUser } = useAuth()

  const activityQuery = useQuery({
    queryKey: ['users', 'activity', memberId],
    queryFn: () => usersApi.getActivitySummary(memberId),
  })

  const [roleDraft, setRoleDraft] = useState<UserRole>(user.role)
  const [statusDraft, setStatusDraft] = useState<UserStatus>(user.status)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetRevokeSessions, setResetRevokeSessions] = useState(true)
  const [resetRequireChange, setResetRequireChange] = useState(true)

  const updateMutation = useMutation({
    mutationFn: (payload: { role?: UserRole; status?: UserStatus }) =>
      usersApi.update(memberId, payload),
    onSuccess: async () => {
      toast.success('Role/status diperbarui.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', memberId] })
      if (currentUser?.id === memberId) {
        await refreshUser()
      }
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: (nextStatus: UserStatus) =>
      usersApi.updateStatus(memberId, { status: nextStatus }),
    onSuccess: () => {
      toast.success('Status member diperbarui.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', memberId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const resetMutation = useMutation({
    mutationFn: (dto: AdminResetPasswordDto) => usersApi.resetPassword(memberId, dto),
    onSuccess: () => {
      toast.success('Password member berhasil direset.')
      setResetOpen(false)
      setResetPassword('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', memberId] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const memberships = user.campaignMemberships ?? []
  const isSelf = currentUser?.id === user.id
  const activity = activityQuery.data

  const roleChanged = roleDraft !== user.role
  const statusChanged = statusDraft !== user.status
  const hasEdit = roleChanged || statusChanged
  const saveDisabled = !hasEdit || updateMutation.isPending

  const canResetSubmit = resetPassword.length >= 8 && !resetMutation.isPending

  const handleSaveRoleStatus = () => {
    if (!hasEdit) return
    const payload: { role?: UserRole; status?: UserStatus } = {}
    if (roleChanged) payload.role = roleDraft
    if (statusChanged) payload.status = statusDraft
    updateMutation.mutate(payload)
  }

  const handleDeactivate = () => {
    if (isSelf) {
      toast.error('Admin tidak dapat menonaktifkan dirinya sendiri.')
      return
    }
    statusMutation.mutate(user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
  }

  const handleResetSubmit = () => {
    if (!canResetSubmit) return
    resetMutation.mutate({
      newPassword: resetPassword,
      revokeSessions: resetRevokeSessions,
      requirePasswordChange: resetRequireChange,
    })
  }

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title={user.name}
          subtitle="Detail member, akses, aktivitas, dan admin actions."
          backHref="/network/members"
          actions={
            <>
              <button type="button" className="btn-secondary" onClick={() => setResetOpen(true)}>
                <KeyRound size={14} /> Reset Password
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeactivate}
                disabled={isSelf || statusMutation.isPending}
                title={isSelf ? 'Admin tidak dapat menonaktifkan dirinya sendiri.' : undefined}
              >
                <UserMinus size={14} />
                {statusMutation.isPending
                  ? 'Saving...'
                  : user.status === 'ACTIVE'
                    ? 'Deactivate User'
                    : 'Activate User'}
              </button>
            </>
          }
        />

        <div className="form-dashboard-grid">
          <section className="form-panel">
            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 72, height: 72, borderRadius: 18,
                    background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.6rem', fontWeight: 900,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{user.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                    <RoleBadge role={user.role} />
                    <StatusBadge type="user" status={user.status} />
                  </div>
                </div>
              </div>
              <div className="summary-line"><div className="summary-label">User ID</div><div className="summary-value">{user.id}</div></div>
              <div className="summary-line"><div className="summary-label">Joined</div><div className="summary-value">{formatDate(user.createdAt)}</div></div>
              <div className="summary-line"><div className="summary-label">Last Login</div><div className="summary-value">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}</div></div>
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">1</span> Role & Status</div>
              <div className="field-grid-2">
                <Select
                  label="Role"
                  value={roleDraft}
                  onChange={(event) => setRoleDraft(event.target.value as UserRole)}
                  options={[
                    { value: 'ADMIN', label: 'ADMIN' },
                    { value: 'BUZZER', label: 'BUZZER' },
                    { value: 'VIEWER', label: 'VIEWER' },
                  ]}
                  disabled={updateMutation.isPending}
                />
                <Select
                  label="Status"
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as UserStatus)}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                  disabled={updateMutation.isPending || isSelf}
                />
              </div>
              {isSelf && statusDraft === 'INACTIVE' && (
                <div className="blast-info-banner" style={{ marginTop: '0.75rem', borderColor: 'rgba(239,68,68,0.35)' }}>
                  <AlertCircle size={16} style={{ color: 'var(--status-expired)', flexShrink: 0 }} />
                  <span>Tidak bisa menonaktifkan diri sendiri. Minta admin lain untuk melakukannya.</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-primary" onClick={handleSaveRoleStatus} disabled={saveDisabled}>
                  <Save size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">2</span> Campaign Memberships</div>
              {memberships.length ? (
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {memberships.map((member) => (
                    <div key={member.id} className="preview-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{member.campaign?.name ?? 'Unknown campaign'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Assigned {formatDate(member.createdAt)}
                        </div>
                      </div>
                      <span className="selected-chip">{member.memberRole}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-card" style={{ color: 'var(--text-muted)' }}>No campaign memberships assigned.</div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title"><span className="step-number">3</span> Activity Summary</div>
              {activityQuery.isLoading ? (
                <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
              ) : activityQuery.isError ? (
                <div className="preview-card" style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={16} style={{ color: 'var(--status-expired)' }} />
                  <span>{mapApiErrorToToastMessage(activityQuery.error)}</span>
                </div>
              ) : activity ? (
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 0 }}>
                  {[
                    { label: 'Completed Blast Attempts', value: activity.completedBlastAttempts },
                    { label: 'Completed Comment Tasks', value: activity.completedCommentTasks },
                    { label: 'Submitted Reports', value: activity.submittedReports },
                    { label: 'Assigned Campaigns', value: activity.assignedCampaigns },
                  ].map((card) => (
                    <div key={card.label} className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
                      <div>
                        <div className="kpi-v2-label">{card.label}</div>
                        <div className="kpi-v2-value">{card.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {activity?.lastActivityAt && (
                <div className="summary-line" style={{ marginTop: '0.75rem' }}>
                  <div className="summary-label">Last activity</div>
                  <div className="summary-value">{formatDateTime(activity.lastActivityAt)}</div>
                </div>
              )}
            </div>
          </section>

          <aside className="helper-panel">
            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Role Access</h3>
              <div className="preview-card">
                <RoleBadge role={user.role} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                  {user.role === 'ADMIN' && 'Can manage campaigns, social accounts, members, reports, exports, dan audit views.'}
                  {user.role === 'BUZZER' && 'Can view queues, keep assigned work, dan submit proof reports.'}
                  {user.role === 'VIEWER' && 'Can read dashboard, reports, dan exports tanpa write access.'}
                </p>
              </div>
            </div>

            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Admin Actions</h3>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => router.refresh()}
                >
                  <Shield size={14} /> Refresh data
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setResetOpen(true)}
                >
                  <KeyRound size={14} /> Reset password
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ justifyContent: 'center' }}
                  onClick={handleDeactivate}
                  disabled={isSelf || statusMutation.isPending}
                >
                  <UserMinus size={14} />
                  {user.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
                </button>
              </div>
            </div>

            <div className="helper-block">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Domain Boundary</h3>
              <div className="preview-card" style={{ display: 'flex', gap: '0.65rem' }}>
                <Users size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  This is a system login account. Social Accounts remain separate source accounts managed by Admin.
                </span>
              </div>
            </div>
          </aside>
        </div>

        <Modal
          open={resetOpen}
          onClose={() => {
            if (!resetMutation.isPending) {
              setResetOpen(false)
              setResetPassword('')
            }
          }}
          title={`Reset password — ${user.name}`}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <p className="muted-meta">
              Password baru akan di-hash oleh backend. Sampaikan ke user lewat channel aman (contoh: secure messenger). Opsi revoke sessions akan mem-force logout di semua perangkat user ini.
            </p>
            <Input
              label="New Password"
              type="text"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="Min 8 karakter"
              disabled={resetMutation.isPending}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={resetRevokeSessions}
                onChange={(event) => setResetRevokeSessions(event.target.checked)}
                disabled={resetMutation.isPending}
              />
              Revoke semua session user (disarankan)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={resetRequireChange}
                onChange={(event) => setResetRequireChange(event.target.checked)}
                disabled={resetMutation.isPending}
              />
              Tandai agar user ganti password saat login berikutnya (tercatat di audit log)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setResetOpen(false)
                  setResetPassword('')
                }}
                disabled={resetMutation.isPending}
              >
                <X size={14} /> Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleResetSubmit} disabled={!canResetSubmit}>
                <KeyRound size={14} />
                {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}
