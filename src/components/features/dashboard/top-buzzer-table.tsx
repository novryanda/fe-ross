import type { BuzzerPerformance } from '@/types'
import { formatNumber } from '@/lib/utils'
import { Trophy, TrendingUp } from 'lucide-react'

export function TopBuzzerTable({ buzzers }: { buzzers: BuzzerPerformance[] }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Trophy size={16} style={{ color: 'var(--status-kept)' }} />
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Top Buzzer Performance</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th>Buzzer</th>
            <th>Completed</th>
            <th>Views</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {buzzers.map((b, i) => (
            <tr key={b.userId}>
              <td>
                <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, background: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.2)' : i === 2 ? 'rgba(180,83,9,0.2)' : 'var(--bg-primary)', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                  {i + 1}
                </span>
              </td>
              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.name}</td>
              <td>{b.completedAttempts}</td>
              <td>{formatNumber(b.totalViews)}</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-available)', fontWeight: 600 }}>
                  <TrendingUp size={11} /> {b.score.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
