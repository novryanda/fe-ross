import { CalendarDays, ExternalLink } from 'lucide-react'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { formatDateTime } from '@/lib/utils'
import type { BlastAttempt, BlastTarget, Campaign } from '@/types'

export function BlastTargetSummary({ campaign, target, currentAttempt }: { campaign?: Campaign; target: BlastTarget; currentAttempt?: BlastAttempt }) {
  return (
    <div className="target-summary-strip">
      <div className="target-summary-cell">
        <div className="blast-metric-label">Platform</div>
        <div style={{ marginTop: '0.35rem' }}><PlatformBadge platform={target.platform} /></div>
      </div>
      <div className="target-summary-cell">
        <div className="blast-metric-label">Source Account</div>
        <div style={{ marginTop: '0.35rem', fontWeight: 800 }}>@{target.socialAccount?.username ?? '-'}</div>
        <div className="muted-meta">{target.socialAccount?.displayName ?? campaign?.name ?? 'Campaign source'}</div>
      </div>
      <div className="target-summary-cell">
        <div className="blast-metric-label">Target URL</div>
        <a href={target.postUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: '100%', marginTop: '0.35rem' }}>
          {target.postUrl.replace('https://', '')} <ExternalLink size={11} />
        </a>
      </div>
      <div className="target-summary-cell">
        <div className="blast-metric-label">Current Attempt</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem' }}>
          <strong>#{currentAttempt?.attemptNo ?? '-'}</strong>
          {currentAttempt && <StatusBadge status={currentAttempt.status} type="attempt" size="sm" />}
        </div>
      </div>
      <div className="target-summary-cell">
        <div className="blast-metric-label">Target Status</div>
        <div style={{ marginTop: '0.35rem' }}><StatusBadge status={target.status} type="campaign" size="sm" /></div>
        <div className="muted-meta" style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CalendarDays size={12} />
          {formatDateTime(target.createdAt)}
        </div>
      </div>
    </div>
  )
}
