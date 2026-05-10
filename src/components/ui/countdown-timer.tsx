'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { formatCountdown, isExpiringSoon } from '@/lib/utils'

interface CountdownTimerProps {
  expiresAt: string
  onExpired?: () => void
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [timeStr, setTimeStr] = useState(formatCountdown(expiresAt))
  const [expired, setExpired] = useState(false)
  const [warning, setWarning] = useState(isExpiringSoon(expiresAt))

  useEffect(() => {
    const tick = () => {
      const str = formatCountdown(expiresAt)
      const exp = str === 'Expired'
      setTimeStr(str)
      setExpired(exp)
      setWarning(isExpiringSoon(expiresAt))
      if (exp) onExpired?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpired])

  const color = expired
    ? 'var(--status-expired)'
    : warning
      ? 'var(--status-kept)'
      : 'var(--status-available)'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 8, padding: '0.375rem 0.75rem',
    }}>
      {(warning || expired) && <AlertTriangle size={14} style={{ color }} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color, letterSpacing: '0.05em' }}>
        {timeStr}
      </span>
      {warning && !expired && (
        <span style={{ fontSize: '0.7rem', color: 'var(--status-kept)' }}>Segera expire!</span>
      )}
    </div>
  )
}
