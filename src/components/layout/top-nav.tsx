'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Megaphone, Network, MessageSquare, CheckSquare,
  FileText, Download, Shield, Bell, Search, ChevronDown,
  LogOut, User, Settings, Globe, KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { CyberLoading } from '@/components/ui/cyber-loading'
import type { UserRole } from '@/types'

// ——— Nav item definition ———
interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BUZZER', 'VIEWER'] },
  // Admin + Viewer share campaign browsing
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone, roles: ['ADMIN', 'VIEWER'] },
  { label: 'Network', href: '/network', icon: Network, roles: ['ADMIN'] },
  { label: 'Reports', href: '/reports', icon: FileText, roles: ['ADMIN', 'VIEWER'] },
  { label: 'Exports', href: '/exports', icon: Download, roles: ['ADMIN', 'VIEWER'] },
  { label: 'Audit', href: '/audit', icon: Shield, roles: ['ADMIN'] },
  // Buzzer-specific
  { label: 'Blast Queue', href: '/blast-queue', icon: Globe, roles: ['BUZZER'] },
  { label: 'My Blasts', href: '/my-blasts', icon: CheckSquare, roles: ['BUZZER'] },
  { label: 'Comment Tasks', href: '/comment-tasks', icon: MessageSquare, roles: ['BUZZER'] },
  { label: 'My Reports', href: '/my-reports', icon: FileText, roles: ['BUZZER'] },
]

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'var(--violet)',
  BUZZER: 'var(--cyan)',
  VIEWER: 'var(--status-kept)',
}

export function TopNav() {
  const pathname = usePathname()
  const { user, role, isInitialized, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const visibleItems = role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : []
  const showNavSkeleton = !isInitialized

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    setUserMenuOpen(false)
    
    // Play shutdown animation for a bit
    setTimeout(async () => {
      try {
        await logout()
        toast.success('System shutdown complete. Session terminated.')
      } catch (error) {
        toast.error(mapApiErrorToToastMessage(error))
        setSigningOut(false)
      }
    }, 3800)
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(7, 11, 20, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      height: '56px',
      display: 'flex', alignItems: 'center',
    }}>
      {signingOut && (
        <CyberLoading 
          title="INITIALIZING ROSS SYSTEM" 
          messages={[
            '[OK] Initializing kernel modules...',
            '[OK] Loading ROSS framework v4.2.1...',
            '[OK] Establishing secure tunnel...',
            '[OK] Verifying threat intelligence...',
            '[OK] Mounting encrypted filesystem...',
            '[OK] System ready. Awaiting auth...'
          ]}
        />
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0', width: '100%',
        padding: '0 1.5rem',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '60px', // Fixed width to prevent shifting
          height: '56px',
          position: 'relative',
          marginRight: '1.5rem', 
          flexShrink: 0 
        }}>
          <img
            src="/ross1.jpg-removebg-preview.png"
            alt="ROSS Logo"
            style={{
              height: '72px',
              width: 'auto',
              position: 'absolute',
              top: '50%',
              left: '0',
              transform: 'translateY(-50%)',
              display: 'block',
              zIndex: 10
            }}
          />
        </Link>

        {/* Nav Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, overflow: 'hidden' }} aria-label="Primary">
          {showNavSkeleton ? (
            <>
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 6, marginRight: '0.25rem' }} />
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 6, marginRight: '0.25rem' }} />
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 6 }} />
            </>
          ) : (
            visibleItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
                    color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                    background: active ? 'var(--cyan-dim)' : 'transparent',
                    borderBottom: active ? '2px solid var(--cyan)' : '2px solid transparent',
                    borderRadius: active ? '6px 6px 0 0' : '6px',
                  }}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              )
            })
          )}
        </nav>

        {/* Right side: Campaign selector + Search + Bell + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Campaign Selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: '8px', padding: '0.375rem 0.75rem', cursor: 'pointer',
            fontSize: '0.75rem', color: 'var(--text-secondary)',
          }}>
            <Globe size={13} />
            <span>All Campaigns</span>
            <ChevronDown size={12} />
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: '8px', padding: '0.375rem 0.75rem',
            fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 140,
          }}>
            <Search size={13} />
            <span>Search...</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '0 4px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>Ctrl K</span>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifikasi"
            style={{
              position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '0.375rem', borderRadius: '8px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute', top: 2, right: 2, width: 16, height: 16,
              background: 'var(--status-expired)', borderRadius: '50%',
              fontSize: '0.6rem', color: 'white', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--bg-primary)',
            }}>8</span>
          </button>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            {!isInitialized || !user ? (
              <div className="skeleton" style={{ width: 140, height: 34, borderRadius: 18 }} aria-label="Memuat profil" />
            ) : (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.25rem', borderRadius: '8px',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {user.name?.charAt(0) ?? 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: role ? ROLE_COLORS[role] : 'var(--text-muted)', letterSpacing: '0.06em' }}>{role ?? '—'}</div>
                </div>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}

            {userMenuOpen && user && (
              <>
                <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div role="menu" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: '12px', padding: '0.5rem', minWidth: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={14} /> Profile
                  </Link>
                  <Link
                    href="/profile/settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={14} /> Settings
                  </Link>
                  <Link
                    href="/profile/security"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <KeyRound size={14} /> Security
                  </Link>
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.375rem 0' }} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={signingOut}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%',
                      padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'var(--status-expired)',
                      fontSize: '0.8125rem', background: 'none', border: 'none',
                      cursor: signingOut ? 'not-allowed' : 'pointer',
                      opacity: signingOut ? 0.6 : 1,
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => !signingOut && (e.currentTarget.style.background = 'var(--status-expired-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={14} /> {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
