'use client'
import { useCountdown } from '@/hooks/use-countdown'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function KeepExpiryWidget({ expiresAt }: { expiresAt: string }) {
  const { timeStr, isWarning, isExpired } = useCountdown(expiresAt)

  if (isExpired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
        <AlertTriangle size={16} style={{ color: 'var(--status-expired)' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-expired)' }}>Expired</span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
      background: isWarning ? 'rgba(245,158,11,0.1)' : 'var(--cyan-dim)',
      border: `1px solid ${isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(0,212,255,0.2)'}`, borderRadius: 10,
    }}>
      <Clock size={18} style={{ color: isWarning ? 'var(--status-kept)' : 'var(--cyan)' }} />
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: isWarning ? 'var(--status-kept)' : 'var(--cyan)', letterSpacing: '0.05em' }}>{timeStr}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Keep expiry countdown</div>
      </div>
      {isWarning && <span style={{ fontSize: '0.7rem', color: 'var(--status-kept)', fontWeight: 600, marginLeft: 'auto' }}>⚠ Segera selesaikan!</span>}
    </div>
  )
}
