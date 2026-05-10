'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, KeyRound, LogOut, Save, Shield, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { RoleBadge } from '@/components/layout/role-badge'
import { StatusBadge } from '@/components/ui/badges'
import { useAuth } from '@/hooks/use-auth'
import { profileApi } from '@/lib/api/profile'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { User as UiUser } from '@/types'

const roleCopy = {
  ADMIN: 'Akses admin untuk mengelola campaign, social accounts, members, reports, exports, dan audit.',
  BUZZER: 'Akses queue untuk mengambil blast/comment tasks, keep pekerjaan, dan submit proof/report.',
  VIEWER: 'Akses read-only untuk dashboard, reports, dan exports.',
} as const

export default function ProfilePage() {
  const { refreshUser, logout } = useAuth()
  const profileQuery = useQuery({
    queryKey: ['profile', 'detail'],
    queryFn: () => profileApi.getProfileDetail(),
  })

  const profile = profileQuery.data
  const user = profile?.user
  const [signingOut, setSigningOut] = useState(false)

  if (profileQuery.isLoading) {
    return (
      <div className="page-container" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: 220, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    )
  }

  if (profileQuery.isError || !user) {
    return (
      <div className="page-container">
        <PageHeader title="Profile" subtitle="Gagal memuat profil." />
        <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <AlertCircle size={18} style={{ color: 'var(--status-expired)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Tidak dapat memuat data profil.</strong>
            <p className="muted-meta">{mapApiErrorToToastMessage(profileQuery.error)}</p>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '0.75rem' }}
              onClick={() => profileQuery.refetch()}
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
      toast.success('Anda telah keluar dari sesi.')
    } catch (error) {
      toast.error(mapApiErrorToToastMessage(error))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Profile"
        subtitle="Kelola informasi dasar akun dan sesi Anda."
        actions={
          <>
            <Link href="/profile/settings" className="btn-secondary" style={{ textDecoration: 'none' }}>Settings</Link>
            <Link href="/profile/security" className="btn-primary" style={{ textDecoration: 'none' }}><KeyRound size={14} /> Change Password</Link>
          </>
        }
      />

      <div className="form-dashboard-grid">
        <section style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 78, height: 78, borderRadius: 20,
                  background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1.75rem', fontWeight: 900,
                  boxShadow: '0 0 28px rgba(0, 212, 255, 0.18)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>{user.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{user.email}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                  <RoleBadge role={user.role} />
                  <StatusBadge type="user" status={user.status} size="sm" />
                </div>
              </div>
              <div className="preview-card" style={{ minWidth: 220 }}>
                <div className="summary-line"><div className="summary-label">Last Login</div><div className="summary-value">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}</div></div>
                <div className="summary-line"><div className="summary-label">Joined Date</div><div className="summary-value">{user.createdAt ? formatDate(user.createdAt) : '-'}</div></div>
                <div className="summary-line"><div className="summary-label">Campaign Memberships</div><div className="summary-value">{profile?.campaignCount ?? 0}</div></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div className="kpi-v2-icon" style={{ background: 'var(--violet-dim)', color: 'var(--violet)' }}><Shield size={20} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 850, marginBottom: '0.35rem' }}>Role Access</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>{roleCopy[user.role]}</p>
              </div>
            </div>
          </div>

          <ProfileNameForm key={`${user.id}-${user.updatedAt}`} user={user} onSaved={() => refreshUser()} />
        </section>

        <aside style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 850, marginBottom: '0.85rem' }}>Security</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
              Ubah password atau tinjau aktif session dari halaman security.
            </p>
            <Link href="/profile/security" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              <KeyRound size={14} /> Change Password
            </Link>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 850, marginBottom: '0.85rem' }}>Current Session</h3>
            <div className="preview-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="dot-pulse" />
                <div>
                  <div style={{ fontWeight: 800 }}>Sesi aktif ini</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Cookie dikelola Better Auth secara otomatis.</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.85rem', color: 'var(--status-expired)' }}
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={14} /> {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 850, marginBottom: '0.85rem' }}>Domain Boundary</h3>
            <div className="preview-card" style={{ display: 'flex', gap: '0.65rem' }}>
              <Users size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Profile ini adalah akun login sistem. Social Accounts adalah akun sumber postingan yang dikelola dari menu Network.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/**
 * Keyed form component. Re-mounted whenever `user.updatedAt` changes, so
 * local state stays in sync with server data without a setState-in-effect.
 */
function ProfileNameForm({ user, onSaved }: { user: UiUser; onSaved: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)

  const updateMutation = useMutation({
    mutationFn: (nextName: string) => profileApi.updateProfile({ name: nextName }),
    onSuccess: async (updated) => {
      toast.success('Perubahan profil tersimpan.')
      queryClient.invalidateQueries({ queryKey: ['profile', 'detail'] })
      setName(updated.name)
      onSaved()
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const canSubmit = name.trim().length >= 2 && name.trim() !== user.name && !updateMutation.isPending

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    updateMutation.mutate(name.trim())
  }

  return (
    <form className="card" style={{ padding: '1.25rem' }} onSubmit={handleSave}>
      <h3 style={{ fontSize: '1rem', fontWeight: 850, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        <User size={17} style={{ color: 'var(--cyan)' }} /> Personal Information
      </h3>
      <div className="field-grid-2">
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={updateMutation.isPending}
          required
        />
        <Input
          label="Email"
          type="email"
          value={user.email}
          disabled
          readOnly
          hint="Email tidak dapat diubah lewat halaman ini. Hubungi admin untuk mengganti email."
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          <Save size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
