import type { UserRole } from '@/types'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants'

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: ROLE_COLORS[role], background: `color-mix(in srgb, ${ROLE_COLORS[role]} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${ROLE_COLORS[role]} 30%, transparent)` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ROLE_COLORS[role] }} />
      {ROLE_LABELS[role]}
    </span>
  )
}
