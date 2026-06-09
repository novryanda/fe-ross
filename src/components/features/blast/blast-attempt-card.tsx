'use client'
import { useEffect, useState } from 'react'
import type { BlastAttempt } from '@/types'
import { getAttemptStatusConfig, getPlatformLabel, formatRelativeTime } from '@/lib/utils'
import { useCountdown } from '@/hooks/use-countdown'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { Clock, ExternalLink, Zap } from 'lucide-react'

interface BlastAttemptCardProps {
  attempt: BlastAttempt
  onKeep?: (id: string) => void
  keepLoading?: boolean
  showAction?: boolean
}

export function BlastAttemptCard({ attempt, onKeep, keepLoading, showAction = true }: BlastAttemptCardProps) {
  const { timeStr, isWarning } = useCountdown(attempt.keepExpiresAt)
  const [now, setNow] = useState(0)
  const sc = getAttemptStatusConfig(attempt.status)
  const target = attempt.blastTarget
  const sa = target?.socialAccount
  const remainingPct = attempt.keepExpiresAt && now > 0
    ? Math.max(0, Math.min(100, ((new Date(attempt.keepExpiresAt).getTime() - now) / (2 * 60 * 60 * 1000)) * 100))
    : 0

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden' }}>
      {/* Header section (Platform + Status + Account) */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {target && <span className={`platform-badge platform-${target.platform.toLowerCase().replace('_', '-')}`}>
              {getPlatformLabel(target.platform)}
            </span>}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attempt #{attempt.attemptNo}</span>
          </div>
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
        </div>
        
        {sa && (
          <div style={{ marginBottom: '0.25rem' }}>
            <SocialAccountUsernameLink account={sa} style={{ fontSize: '1.25rem' }} />
          </div>
        )}

        {target && (
          <a href={target.postUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <ExternalLink size={11} /> Source URL
          </a>
        )}
      </div>

      {/* Timer / Keep Content */}
      <div style={{ padding: '1rem 1.25rem', flexGrow: 1 }}>
        {attempt.status === 'KEPT' && attempt.keepExpiresAt && (
          <div style={{ padding: '0.875rem', background: isWarning ? 'rgba(245,158,11,0.05)' : 'var(--cyan-dim)', border: `1px solid ${isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(0,212,255,0.2)'}`, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: isWarning ? 'var(--status-kept)' : 'var(--cyan)' }} />
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Waktu Tersisa</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: isWarning ? 'var(--status-kept)' : 'var(--cyan)' }}>{timeStr}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Selesaikan sebelum</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(attempt.keepExpiresAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</div>
              </div>
            </div>
            
            {/* A simple progress bar using remaining minutes vs 120 mins duration */}
            <div style={{ height: 4, width: '100%', background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${remainingPct}%`,
                background: isWarning ? 'var(--status-kept)' : 'var(--cyan)',
                transition: 'width 1s linear'
              }} />
            </div>
          </div>
        )}

        {attempt.status === 'COMPLETED' && attempt.report && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
             <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{attempt.report.views >= 1000 ? (attempt.report.views / 1000).toFixed(1) + 'K' : attempt.report.views}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Views</div>
             </div>
             <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{attempt.report.likes >= 1000 ? (attempt.report.likes / 1000).toFixed(1) + 'K' : attempt.report.likes}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Likes</div>
             </div>
             <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{attempt.report.comments >= 1000 ? (attempt.report.comments / 1000).toFixed(1) + 'K' : attempt.report.comments}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Komentar</div>
             </div>
             <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{attempt.report.shares >= 1000 ? (attempt.report.shares / 1000).toFixed(1) + 'K' : attempt.report.shares}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Shares</div>
             </div>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', minHeight: 64 }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dikerjakan</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{new Date(attempt.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ditugaskan oleh</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>System</div>
          </div>
        </div>

        {showAction && attempt.status === 'AVAILABLE' && onKeep && (
          <button onClick={() => onKeep(attempt.id)} disabled={keepLoading} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}>
            <Zap size={14} /> {keepLoading ? 'Keeping...' : 'Open Task \u2192'}
          </button>
        )}
        
        {attempt.status === 'KEPT' && (
           <button className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}>
             Open Task &rarr;
           </button>
        )}
      </div>
    </div>
  )
}
