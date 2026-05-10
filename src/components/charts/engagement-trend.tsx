'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { TrendDataPoint } from '@/types'
import { formatNumber } from '@/lib/utils'

interface EngagementTrendProps {
  data: TrendDataPoint[]
  lines?: ('views' | 'likes' | 'comments' | 'shares' | 'engagement')[]
  height?: number
}

const LINE_COLORS: Record<string, string> = {
  views: '#00d4ff',
  likes: '#f43f5e',
  comments: '#f59e0b',
  shares: '#10b981',
  engagement: '#8b5cf6',
}

export function EngagementTrend({ data, lines = ['engagement'], height = 280 }: EngagementTrendProps) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        📈 Engagement Trend
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <defs>
            {lines.map(l => (
              <linearGradient key={l} id={`grad-${l}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={LINE_COLORS[l]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={LINE_COLORS[l]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => formatNumber(Number(v))} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: '0.8125rem' }}
            labelStyle={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
            formatter={(value) => formatNumber(Number(value ?? 0))}
          />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />}
          {lines.map(l => (
            <Area key={l} type="monotone" dataKey={l} stroke={LINE_COLORS[l]} fill={`url(#grad-${l})`} strokeWidth={2} name={l.charAt(0).toUpperCase() + l.slice(1)} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
