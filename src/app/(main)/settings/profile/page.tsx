'use client'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/layout/role-badge'
import { User, Mail, Shield, Save, Key, LogOut, Smartphone, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  const handleSave = () => {
    toast.success('Profil berhasil disimpan! (mock)')
  }

  return (
    <div className="page-container">
      <PageHeader title="Profile Settings" subtitle="Kelola informasi profil dan keamanan akun Anda" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Profile Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            Informasi Profil
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: 'white',
              boxShadow: '0 0 20px rgba(0,212,255,0.2)',
            }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{user.name}</h3>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{user.email}</div>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Nama Lengkap" icon={<User size={14} />} defaultValue={user.name} />
            <Input label="Email" icon={<Mail size={14} />} defaultValue={user.email} disabled />
            <Input label="Nomor Telepon" icon={<Smartphone size={14} />} placeholder="+62 xxx xxxx xxxx" />
            <div className="form-group">
              <label className="form-label"><Shield size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Role</label>
              <div style={{ padding: '0.625rem 0.875rem', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {user.role} — <span style={{ fontSize: '0.8125rem' }}>Tidak dapat diubah sendiri</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button onClick={handleSave} icon={<Save size={14} />}>Save Changes</Button>
            </div>
          </div>
        </div>

        {/* Sidebar: Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Security */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={15} style={{ color: 'var(--cyan)' }} /> Keamanan
            </h3>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
              onClick={() => toast.info('Change password flow (mock)')}>
              <Key size={14} /> Ubah Password
            </button>

            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--status-expired)' }}
              onClick={() => toast.info('Logout flow (mock)')}>
              <LogOut size={14} /> Logout dari Semua Perangkat
            </button>
          </div>

          {/* Sessions */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={15} style={{ color: 'var(--violet)' }} /> Sesi Aktif
            </h3>

            {[
              { device: 'Chrome · Windows', ip: '192.168.1.xx', time: 'Sesi ini', active: true },
              { device: 'Safari · iPhone', ip: '10.0.0.xx', time: '2 jam lalu', active: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0',
                borderBottom: i < 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: s.active ? 'var(--status-available)' : 'var(--text-muted)',
                  boxShadow: s.active ? '0 0 6px var(--status-available)' : 'none',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.device}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.ip} · {s.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Account Info */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Info Akun
            </h3>
            {[
              { label: 'User ID', value: user.id },
              { label: 'Bergabung', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Status', value: user.status ?? 'ACTIVE' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
