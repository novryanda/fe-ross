'use client'
import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { getApiMode } from '@/lib/auth/session'
import type { UserRole } from '@/types'

interface RequireAuthProps {
  children: ReactNode
  /**
   * Optional list of roles allowed to see `children`. Omit to accept any
   * authenticated user. When the user is authenticated but lacks the role,
   * an inline "Access Denied" card is rendered (no redirect) so the page
   * layout / TopNav stay visible and the user can navigate elsewhere.
   */
  roles?: readonly UserRole[]
  /** Where to send unauthenticated visitors. Defaults to `/login`. */
  redirectTo?: string
}

/**
 * Client-side guard for protected regions. Proxy (`src/proxy.ts`) is still
 * the authoritative redirect for real-mode authentication; this component
 * handles:
 *
 *   - showing a skeleton while the auth provider hydrates,
 *   - defensive redirect when the session cookie exists but is already
 *     invalid (cleared by `AuthProvider`),
 *   - role mismatch rendering (no redirect — keeps layout alive).
 */
export function RequireAuth({ children, roles, redirectTo = '/login' }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isInitialized, user, role } = useAuth()

  useEffect(() => {
    if (!isInitialized) return
    if (user) return
    if (getApiMode() === 'mock') return

    const target = pathname && pathname !== '/' ? `${redirectTo}?redirect=${encodeURIComponent(pathname)}` : redirectTo
    router.replace(target)
  }, [isInitialized, user, pathname, router, redirectTo])

  if (!isInitialized) {
    return <AuthLoadingShell />
  }

  if (!user) {
    // In mock mode we render children anyway so unauthenticated preview
    // is possible; real mode is handled by proxy + effect above.
    if (getApiMode() === 'mock') return <>{children}</>
    return <AuthLoadingShell />
  }

  if (roles && role && !roles.includes(role)) {
    return <AccessDeniedCard />
  }

  return <>{children}</>
}

function AuthLoadingShell() {
  return (
    <div style={{ padding: '2rem', display: 'grid', gap: '1rem' }} aria-busy="true" aria-label="Memuat sesi">
      <div className="skeleton" style={{ height: 28, width: 200 }} />
      <div className="skeleton" style={{ height: 140, width: '100%', borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 240, width: '100%', borderRadius: 12 }} />
    </div>
  )
}

function AccessDeniedCard() {
  return (
    <div
      className="card"
      role="alert"
      style={{
        padding: '2.5rem',
        textAlign: 'center',
        maxWidth: 520,
        margin: '3rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldX size={26} style={{ color: 'var(--status-expired)' }} />
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Akses tidak tersedia</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
        Role akun Anda tidak memiliki izin untuk membuka halaman ini. Jika ini terlihat salah, hubungi administrator.
      </p>
      <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
