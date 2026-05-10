import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }}>
        {icon ?? <Inbox size={48} />}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{title}</h3>
      {description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  )
}
