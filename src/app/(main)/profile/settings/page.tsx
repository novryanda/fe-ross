'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Bell, Globe2, Info, Monitor, Save, User } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { profileApi } from '@/lib/api/profile'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import type { User as UiUser } from '@/types'

const notificationOptions = [
  { key: 'taskAssigned', label: 'Task assigned/available' },
  { key: 'keepExpiring', label: 'Keep expiring' },
  { key: 'reportSubmitted', label: 'Report submitted' },
  { key: 'exportCompleted', label: 'Export completed' },
] as const

type NotificationKey = (typeof notificationOptions)[number]['key']

export default function ProfileSettingsPage() {
  const profileQuery = useQuery({
    queryKey: ['profile', 'detail'],
    queryFn: () => profileApi.getProfileDetail(),
  })

  if (profileQuery.isLoading) {
    return (
      <div className="page-container" aria-busy="true">
        <div className="skeleton" style={{ height: 28, width: 220, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 360, borderRadius: 16 }} />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="page-container">
        <PageHeader title="Profile Settings" subtitle="Gagal memuat data profil." backHref="/profile" />
        <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <AlertCircle size={18} style={{ color: 'var(--status-expired)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Tidak dapat memuat preferensi.</strong>
            <p className="muted-meta">{mapApiErrorToToastMessage(profileQuery.error)}</p>
            <button type="button" className="btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => profileQuery.refetch()}>
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  const user = profileQuery.data.user
  return <ProfileSettingsForm key={`${user.id}-${user.updatedAt}`} user={user} />
}

function ProfileSettingsForm({ user }: { user: UiUser }) {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  const [displayName, setDisplayName] = useState(user.name)
  const [language, setLanguage] = useState('id')
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    taskAssigned: true,
    keepExpiring: true,
    reportSubmitted: true,
    exportCompleted: false,
  })

  const updateMutation = useMutation({
    mutationFn: (nextName: string) => profileApi.updateProfile({ name: nextName }),
    onSuccess: async () => {
      toast.success('Preferensi akun disimpan.')
      queryClient.invalidateQueries({ queryKey: ['profile', 'detail'] })
      await refreshUser()
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const nameChanged = displayName.trim() !== user.name && displayName.trim().length >= 2
  const canSave = nameChanged && !updateMutation.isPending

  const handleSave = () => {
    if (!canSave) return
    updateMutation.mutate(displayName.trim())
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Profile Settings"
        subtitle="Atur preferensi akun, notifikasi, bahasa, dan tema."
        backHref="/profile"
        actions={
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!canSave}>
            <Save size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      <div className="info-banner info-banner-cyan" style={{ marginBottom: '1.25rem' }}>
        <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
        <div>
          Hanya <strong>Display Name</strong> yang tersinkron ke backend. Preferensi bahasa, tema, dan notifikasi saat ini disimpan lokal saja (backend belum punya endpoint preferences).
        </div>
      </div>

      <div className="form-dashboard-grid">
        <section className="form-panel">
          <div className="form-section">
            <div className="form-section-title"><span className="step-number">1</span> Account Preferences</div>
            <div className="field-grid-2">
              <Input
                label="Display Name"
                icon={<User size={14} />}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={updateMutation.isPending}
                hint="Tersinkron ke backend."
              />
              <Input
                label="Email"
                type="email"
                value={user.email}
                disabled
                readOnly
                hint="Email tidak dapat diubah di sini."
              />
              <Select
                label="Language Preference"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                options={[
                  { value: 'id', label: 'Bahasa Indonesia' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Select
                label="Theme Preference"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                options={[
                  { value: 'dark', label: 'Dark cyber professional' },
                  { value: 'system', label: 'Follow system' },
                ]}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title"><span className="step-number">2</span> Notification Preferences</div>
            <p className="muted-meta" style={{ marginBottom: '0.75rem' }}>
              Notifikasi preferensi akan diaktifkan saat backend endpoint tersedia. Saat ini toggle di bawah tidak mengubah perilaku sistem.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {notificationOptions.map((option) => (
                <label
                  key={option.key}
                  className="preview-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={15} style={{ color: 'var(--cyan)' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 750 }}>{option.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={notifications[option.key]}
                    onChange={() => toggleNotification(option.key)}
                    aria-label={option.label}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="helper-panel">
          <div className="helper-block">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Preference Summary</h3>
            <div className="summary-line"><div className="summary-label">Display</div><div className="summary-value">{displayName}</div></div>
            <div className="summary-line"><div className="summary-label">Language</div><div className="summary-value">{language === 'id' ? 'Bahasa Indonesia' : 'English'}</div></div>
            <div className="summary-line"><div className="summary-label">Theme</div><div className="summary-value">{theme}</div></div>
          </div>
          <div className="helper-block">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Environment</h3>
            <div className="preview-card" style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <Monitor size={16} style={{ color: 'var(--violet)' }} /> <span>Dark theme locked for this UI slice</span>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <Globe2 size={16} style={{ color: 'var(--cyan)' }} /> <span>Preferences lokal (belum disinkronkan)</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
