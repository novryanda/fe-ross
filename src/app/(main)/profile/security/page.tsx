'use client'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Monitor, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { profileApi } from '@/lib/api/profile'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/utils'

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (password.length >= 12) score += 1
  if (score <= 1) return { label: 'Weak', value: 25, color: 'var(--status-expired)' }
  if (score <= 3) return { label: 'Medium', value: 60, color: 'var(--status-kept)' }
  return { label: 'Strong', value: 100, color: 'var(--status-active)' }
}

export default function ProfileSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [revokeOthers, setRevokeOthers] = useState(true)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const sessionsQuery = useQuery({
    queryKey: ['profile', 'sessions'],
    queryFn: () => profileApi.listSessions(),
  })

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        revokeOtherSessions: revokeOthers,
      }),
    onSuccess: () => {
      toast.success('Password berhasil diperbarui.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      sessionsQuery.refetch()
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const validation = useMemo(
    () => ({
      currentRequired: currentPassword.trim().length > 0,
      minLength: newPassword.length >= 8,
      matches: confirmPassword.length > 0 && confirmPassword === newPassword,
      different: currentPassword.length > 0 && newPassword.length > 0 && currentPassword !== newPassword,
    }),
    [confirmPassword, currentPassword, newPassword],
  )

  const canSubmit = Object.values(validation).every(Boolean) && !changePasswordMutation.isPending

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    changePasswordMutation.mutate()
  }

  const passwordInput = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    autoComplete: 'current-password' | 'new-password',
    error?: string,
  ) => (
    <div style={{ position: 'relative' }}>
      <Input
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        icon={<Lock size={14} />}
        error={error}
        autoComplete={autoComplete}
        disabled={changePasswordMutation.isPending}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="btn-ghost"
        style={{ position: 'absolute', right: 6, top: 28, padding: '0.45rem', minWidth: 32 }}
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={changePasswordMutation.isPending}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )

  const sessions = sessionsQuery.data ?? []

  return (
    <div className="page-container">
      <PageHeader title="Security" subtitle="Ubah password dan tinjau status keamanan akun." backHref="/profile" />

      <div className="form-dashboard-grid">
        <section className="form-panel">
          <form onSubmit={handleSubmit} className="form-section">
            <div className="form-section-title"><span className="step-number">1</span> Change Password</div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {passwordInput('Current Password', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'current-password')}
              {passwordInput(
                'New Password',
                newPassword,
                setNewPassword,
                showNew,
                setShowNew,
                'new-password',
                newPassword.length > 0 && newPassword.length < 8 ? 'Minimum 8 characters' : undefined,
              )}
              {passwordInput(
                'Confirm New Password',
                confirmPassword,
                setConfirmPassword,
                showConfirm,
                setShowConfirm,
                'new-password',
                confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Confirm password must match' : undefined,
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <span>Password strength</span>
                <span style={{ color: strength.color, fontWeight: 800 }}>{strength.label}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${strength.value}%`, background: strength.color }} />
              </div>
            </div>

            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginTop: '1rem', padding: '0.75rem',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10,
                cursor: changePasswordMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={revokeOthers}
                onChange={(event) => setRevokeOthers(event.target.checked)}
                disabled={changePasswordMutation.isPending}
              />
              <span>
                <span style={{ display: 'block', fontWeight: 700 }}>Sign out other devices</span>
                <span className="muted-meta">Revoke sesi lain setelah password berhasil diubah. Disarankan aktif.</span>
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
              <button type="submit" className="btn-primary" disabled={!canSubmit}>
                <KeyRound size={14} /> {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        <aside className="helper-panel">
          <div className="helper-block">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Security Checklist</h3>
            {[
              { label: 'Current password required', ready: validation.currentRequired },
              { label: 'New password has 8+ characters', ready: validation.minLength },
              { label: 'Confirmation matches', ready: validation.matches },
              { label: 'New password differs from current', ready: validation.different },
            ].map((item) => (
              <div key={item.label} className={`checklist-item ${item.ready ? '' : 'invalid'}`}>
                <CheckCircle2 size={17} style={{ color: item.ready ? 'var(--status-active)' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: 700 }}>{item.label}</span>
                <span className={`checklist-status ${item.ready ? 'ready' : 'invalid'}`}>{item.ready ? 'OK' : 'Needed'}</span>
              </div>
            ))}
          </div>

          <div className="helper-block">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Password Rules</h3>
            <div className="preview-card" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Minimum 8 karakter. Gunakan kombinasi huruf besar, angka, dan simbol untuk password yang lebih kuat.
            </div>
          </div>

          <div className="helper-block">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Active Sessions</h3>
            {sessionsQuery.isLoading ? (
              <div className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ) : sessionsQuery.isError ? (
              <div className="preview-card" style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <AlertCircle size={15} style={{ color: 'var(--status-expired)' }} />
                <span>{mapApiErrorToToastMessage(sessionsQuery.error)}</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="preview-card" style={{ color: 'var(--text-muted)' }}>Tidak ada sesi aktif terdeteksi.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {sessions.map((session) => (
                  <div key={session.id} className="preview-card" style={{ display: 'grid', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                      <Monitor size={16} style={{ color: 'var(--cyan)' }} />
                      <span style={{ fontWeight: 800 }}>
                        {session.userAgent ? session.userAgent.slice(0, 60) : 'Unknown device'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                      <ShieldCheck size={14} style={{ color: 'var(--status-active)' }} />
                      <span className="muted-meta">
                        Token {session.tokenFingerprint} — expires {formatDateTime(session.expiresAt)}
                      </span>
                    </div>
                    {session.ipAddress && (
                      <span className="muted-meta">IP: {session.ipAddress}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
