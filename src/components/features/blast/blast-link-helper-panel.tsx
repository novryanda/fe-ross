import { CheckCircle2, Eye, RadioTower, Users, Zap } from 'lucide-react'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { formatDate } from '@/lib/utils'
import type { Campaign, Platform, SocialAccount } from '@/types'

interface BlastLinkHelperPanelProps {
  campaign?: Campaign
  selectedPlatform?: Platform
  selectedAccount?: SocialAccount
  postUrl?: string
}

export function BlastLinkHelperPanel({ campaign, selectedPlatform, selectedAccount, postUrl }: BlastLinkHelperPanelProps) {
  const steps = [
    'Admin publishes blast link',
    'All campaign buzzers can see it',
    'First buzzer to Keep locks the attempt',
    'Buzzer submits proof and metrics',
  ]

  return (
    <aside className="helper-panel">
      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.9rem' }}>
          <RadioTower size={16} style={{ color: 'var(--cyan)' }} />
          <strong>Campaign Summary</strong>
        </div>
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          <div>
            <div className="blast-metric-label">Campaign Name</div>
            <div style={{ fontWeight: 800 }}>{campaign?.name ?? '-'}</div>
          </div>
          <div>
            <div className="blast-metric-label">Status</div>
            {campaign && <StatusBadge status={campaign.status} type="campaign" size="sm" />}
          </div>
          <div>
            <div className="blast-metric-label">Available Platforms</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {campaign?.platforms.map(platform => <PlatformBadge key={platform} platform={platform} size="sm" />)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div className="blast-metric-label">Members</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                <Users size={13} style={{ color: 'var(--cyan)' }} />
                {campaign?.memberCount ?? 0}
              </div>
            </div>
            <div>
              <div className="blast-metric-label">Period</div>
              <div className="muted-meta">
                {campaign ? `${formatDate(campaign.startDate)} - ${campaign.endDate ? formatDate(campaign.endDate) : 'Open'}` : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
          <Zap size={16} style={{ color: 'var(--status-kept)' }} />
          <strong>How It Works</strong>
        </div>
        <div className="mini-stepper">
          {steps.map((step, index) => (
            <div className="mini-step" key={step}>
              <div className="mini-step-dot">{index + 1}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{step}</div>
                <div className="muted-meta">
                  {index === 2 ? 'The attempt is locked by the first eligible Buzzer.' : 'First-come-first-served blast flow.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
          <Eye size={16} style={{ color: 'var(--violet)' }} />
          <strong>Preview</strong>
        </div>
        <div className="preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.7rem' }}>
            {selectedPlatform ? <PlatformBadge platform={selectedPlatform} size="sm" /> : <span className="muted-meta">Select platform</span>}
            <StatusBadge status="AVAILABLE" type="attempt" size="sm" />
          </div>
          <div style={{ fontWeight: 800 }}>@{selectedAccount?.username ?? 'source_account'}</div>
          <div className="muted-meta">{selectedAccount?.displayName ?? 'Source account preview'}</div>
          <div style={{ marginTop: '0.85rem', color: postUrl ? 'var(--cyan)' : 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {postUrl || 'https://social-platform.com/post/...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.85rem', color: 'var(--status-active)', fontSize: '0.75rem', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            Open to all campaign Buzzer members
          </div>
        </div>
      </div>
    </aside>
  )
}
