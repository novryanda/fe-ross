import type { BlastReport } from '@/types'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import { FileText, Eye, Heart } from 'lucide-react'

export function RecentReportsList({ reports }: { reports: BlastReport[] }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <FileText size={16} style={{ color: 'var(--cyan)' }} />
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Reports</h3>
      </div>
      {reports.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Belum ada report.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {reports.map(r => (
            <div key={r.id} style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{r.submittedByUser?.name ?? 'Unknown'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(r.submittedAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--cyan)' }}><Eye size={11} /> {formatNumber(r.views)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--status-expired)' }}><Heart size={11} /> {formatNumber(r.likes)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
