import { ShieldX, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldX size={36} style={{ color: 'var(--status-expired)' }} />
          </div>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Akses Ditolak</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
