import type { CampaignStatus } from '@/types'
import { getCampaignStatusConfig } from '@/lib/utils'

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = getCampaignStatusConfig(status)
  return (
    <span style={{ padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, color: config.color, background: config.bg }}>
      {config.label}
    </span>
  )
}
