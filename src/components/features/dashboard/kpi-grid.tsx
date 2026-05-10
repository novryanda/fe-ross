import type { ReactNode } from 'react'
import { MetricCard } from '@/components/ui/metric-card'

interface KpiItem {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
  color?: string
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-grid">
      {items.map((item, i) => (
        <MetricCard key={i} label={item.label} value={String(item.value)} delta={item.delta} icon={item.icon} sparklineColor={item.color} />
      ))}
    </div>
  )
}
