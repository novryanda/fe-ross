import type { CSSProperties, ReactNode } from 'react'

interface BlastMetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  accent?: string
}

export function BlastMetricCard({ label, value, sub, icon, accent = 'var(--cyan)' }: BlastMetricCardProps) {
  return (
    <div className="blast-metric-card" style={{ '--metric-accent': accent } as CSSProperties}>
      <div className="blast-metric-card-inner">
        <div className="blast-metric-icon">{icon}</div>
        <div>
          <div className="blast-metric-label">{label}</div>
          <div className="blast-metric-value">{value}</div>
          {sub && <div className="blast-metric-sub">{sub}</div>}
        </div>
      </div>
    </div>
  )
}
