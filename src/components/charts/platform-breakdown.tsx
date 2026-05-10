'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PlatformBreakdown as PB } from '@/types'
import { formatNumber, getPlatformLabel } from '@/lib/utils'

interface PlatformBreakdownProps {
  data: PB[]
  height?: number
}

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: '#E1306C',
  TIKTOK: '#00f2ea',
  X_TWITTER: '#1DA1F2',
  FACEBOOK: '#1877F2',
}

export function PlatformBreakdown({ data, height = 280 }: PlatformBreakdownProps) {
  const chartData = data.map(d => ({ name: getPlatformLabel(d.platform), value: d.views, engagement: d.engagement, pct: d.percentage, fill: PLATFORM_COLORS[d.platform] || '#666' }))

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        📊 Platform Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="var(--bg-primary)" strokeWidth={2}>
            {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: '0.8125rem' }}
            formatter={(value) => formatNumber(Number(value ?? 0))}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} formatter={v => v} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {data.map(d => (
          <div key={d.platform} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: PLATFORM_COLORS[d.platform] }} />
            {getPlatformLabel(d.platform)}: {d.percentage.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  )
}
