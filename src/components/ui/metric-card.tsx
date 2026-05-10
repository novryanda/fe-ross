import { formatNumber } from '@/lib/utils'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  icon?: ReactNode
  sparklineColor?: string
  mini?: boolean
}

export function MetricCard({ label, value, delta, deltaPositive = true, icon, sparklineColor, mini }: MetricCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <div className="card" style={{
      padding: mini ? '1rem' : '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      transition: 'all 0.2s', cursor: 'default',
      borderLeft: `2px solid ${sparklineColor ?? 'var(--border-accent)'}`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = sparklineColor ?? 'var(--cyan)'
        e.currentTarget.style.boxShadow = `0 0 20px ${sparklineColor ?? 'var(--cyan-dim)'}40`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${sparklineColor ?? 'var(--border-accent)'}`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {icon && (
          <div style={{ color: sparklineColor ?? 'var(--cyan)', opacity: 0.8 }}>{icon}</div>
        )}
      </div>
      <div style={{ fontSize: mini ? '1.5rem' : '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {displayValue}
      </div>
      {delta && (
        <div style={{ fontSize: '0.75rem', color: deltaPositive ? 'var(--status-available)' : 'var(--status-expired)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>{deltaPositive ? '↑' : '↑'}</span>
          <span>{delta}</span>
        </div>
      )}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="skeleton" style={{ height: 12, width: '60%' }} />
      <div className="skeleton" style={{ height: 32, width: '80%' }} />
      <div className="skeleton" style={{ height: 10, width: '40%' }} />
    </div>
  )
}
