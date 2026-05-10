'use client'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { RoleBadge } from './role-badge'

/**
 * Secondary profile dropdown. `TopNav` already ships with an inline
 * dropdown — this component exists for other surfaces (e.g. mobile sheet,
 * embedded headers). Keeping both in sync avoids divergent behaviour.
 */
export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  if (!user) return null

  const initial = user.name.charAt(0).toUpperCase()

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    setOpen(false)
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.625rem 0.25rem 0.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 99, cursor: 'pointer' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
          {initial}
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
      </button>

      {open && (
        <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
            <div style={{ marginTop: '0.375rem' }}><RoleBadge role={user.role} /></div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              router.push('/profile/settings')
              setOpen(false)
            }}
            style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={14} /> Profile Settings
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              router.push('/profile/security')
              setOpen(false)
            }}
            style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <KeyRound size={14} /> Security
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: signingOut ? 'not-allowed' : 'pointer', color: 'var(--status-expired)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', opacity: signingOut ? 0.6 : 1 }}
          >
            <LogOut size={14} /> {signingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  )
}
