import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  retry?: () => void
  icon?: ReactNode
}

export function ErrorState({ title = 'Terjadi Kesalahan', message = 'Tidak dapat memuat data. Coba lagi nanti.', retry, icon }: ErrorStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--status-expired)', marginBottom: '1rem' }}>
        {icon ?? <AlertTriangle size={48} />}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5 }}>{message}</p>
      {retry && <button onClick={retry} className="btn-secondary" style={{ marginTop: '1.25rem' }}>Coba Lagi</button>}
    </div>
  )
}
