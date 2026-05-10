import type { BlastAttemptStatus } from '@/types'
import { getAttemptStatusConfig } from '@/lib/utils'

export function AttemptStatusBadge({ status }: { status: BlastAttemptStatus }) {
  const config = getAttemptStatusConfig(status)
  return (
    <span style={{ padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, color: config.color, background: config.bg }}>
      {config.label}
    </span>
  )
}
