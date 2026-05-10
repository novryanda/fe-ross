import type { OverdueItem } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { AlertTriangle, Clock, MessageCircle, Zap } from 'lucide-react'

export function OverdueWidget({ items }: { items: OverdueItem[] }) {
  return (
    <div className="card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--status-expired)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <AlertTriangle size={16} style={{ color: 'var(--status-expired)' }} />
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Overdue Items</h3>
        {items.length > 0 && <span style={{ padding: '0.1rem 0.375rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: 'var(--status-expired)' }}>{items.length}</span>}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>✅ Tidak ada item overdue.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ padding: '0.625rem 0.75rem', background: 'rgba(239,68,68,0.05)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                {item.type === 'blast' ? <Zap size={12} style={{ color: 'var(--cyan)' }} /> : <MessageCircle size={12} style={{ color: 'var(--status-kept)' }} />}
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{item.title}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {item.actor && <span>{item.actor}</span>}
                <span>{item.campaignName}</span>
                <span style={{ color: 'var(--status-expired)' }}>Due: {formatRelativeTime(item.dueAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
