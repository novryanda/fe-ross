import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions, badge }: PageHeaderProps) {
  return (
    <div>
      {backHref && (
        <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Kembali
        </Link>
      )}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{actions}</div>}
      </div>
    </div>
  )
}
