import Link from 'next/link'
import type { Campaign } from '@/types'
import { getCampaignStatusConfig, formatDate, formatNumber } from '@/lib/utils'
import { Calendar, Users, Target, TrendingUp } from 'lucide-react'
import { StatusBadge, PlatformBadge } from '@/components/ui/badges'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const sc = getCampaignStatusConfig(campaign.status)
  return (
    <Link href={`/campaigns/${campaign.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '1.25rem', transition: 'all 0.2s', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{campaign.name}</h3>
            {campaign.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4, maxWidth: 400 }}>{campaign.description}</p>}
          </div>
          <StatusBadge status={campaign.status} type="campaign" />
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Calendar size={12} /> {formatDate(campaign.startDate)} {campaign.endDate ? `– ${formatDate(campaign.endDate)}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Users size={12} /> {campaign.memberCount ?? 0} member
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Target size={12} /> {campaign.blastTargetCount ?? 0} targets
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${campaign.completionRate ?? 0}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyan)' }}>
            {(campaign.completionRate ?? 0).toFixed(1)}%
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem' }}>
          {campaign.platforms.map(p => (
            <PlatformBadge key={p} platform={p} size="sm" />
          ))}
        </div>
      </div>
    </Link>
  )
}
