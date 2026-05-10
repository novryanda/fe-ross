import { Compass, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={36} style={{ color: 'var(--cyan)' }} />
          </div>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--cyan)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>404</h1>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Halaman Tidak Ditemukan</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
