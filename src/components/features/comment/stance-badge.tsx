import type { Stance } from '@/types'
import { getStanceConfig } from '@/lib/utils'

export function StanceBadge({ stance }: { stance: Stance }) {
  const config = getStanceConfig(stance)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
      letterSpacing: '0.05em', color: config.color, background: config.bg,
      boxShadow: `0 0 8px ${config.bg}`,
    }}>
      {stance === 'PRO' ? '👍' : '👎'} {config.label}
    </span>
  )
}
