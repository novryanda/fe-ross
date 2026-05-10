'use client'
import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import type { UserRole } from '@/types'

/**
 * Inline role check. Renders a loading shell while the auth provider is
 * still hydrating so downstream effects don't accidentally short-circuit
 * on the initial render.
 *
 * For full-page authentication gates, prefer `<RequireAuth>` in
 * `components/layout/require-auth.tsx`.
 */
export function RoleGuard({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { role, isInitialized } = useAuth()

  if (!isInitialized) {
    return (
      <div
        className="skeleton"
        aria-busy="true"
        aria-label="Memuat sesi"
        style={{ height: 180, width: '100%', borderRadius: 12, margin: '1.5rem 0' }}
      />
    )
  }

  if (!role || !roles.includes(role)) {
    return (
      <div
        className="card"
        role="alert"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          maxWidth: 560,
          margin: '3rem auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <ShieldAlert size={40} style={{ color: 'var(--status-expired)' }} />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Akses tidak tersedia</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Role Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
