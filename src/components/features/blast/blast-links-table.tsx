'use client'
import Link from 'next/link'
import { Archive, Eye, ExternalLink, PauseCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { formatDateTime } from '@/lib/utils'
import type { BlastTarget, BlastTargetStatus } from '@/types'

interface BlastLinksTableProps {
  campaignId: string
  targets: BlastTarget[]
  isAdmin?: boolean
  actionLoadingId?: string
  onStatusChange?: (target: BlastTarget, status: BlastTargetStatus) => void
  onReblast?: (target: BlastTarget) => void
}

export function BlastLinksTable({ campaignId, targets, isAdmin = true, actionLoadingId, onStatusChange, onReblast }: BlastLinksTableProps) {
  return (
    <div className="blast-table-shell">
      <div className="blast-table-scroll">
        <table className="blast-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Source Account</th>
              <th>Target Post URL</th>
              <th>Current Attempt</th>
              <th>Status</th>
              <th>Kept By / Claimed By</th>
              <th>Keep Expiry</th>
              <th>Completion</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.map(target => {
              const latest = target.latestAttempt
              const completed = target.completedAttempts ?? 0
              const total = target.totalAttempts ?? target.attempts?.length ?? 0
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0
              const claimedBy = latest?.keptByUser?.name
              const expiry = latest?.keepExpiresAt

              return (
                <tr key={target.id}>
                  <td><PlatformBadge platform={target.platform} size="sm" /></td>
                  <td>
                    <div className="source-account-cell">
                      <div className="source-avatar">{target.socialAccount?.username?.charAt(0).toUpperCase() ?? 'S'}</div>
                      <div>
                        <div style={{ fontWeight: 800 }}>@{target.socialAccount?.username ?? '-'}</div>
                        <div className="muted-meta">{target.socialAccount?.displayName ?? 'Source Account'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a href={target.postUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: 260 }}>
                      {target.postUrl.replace('https://', '')}
                      <ExternalLink size={11} />
                    </a>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800 }}>#{latest?.attemptNo ?? '-'}</div>
                    <div className="muted-meta">{completed} of {total} completed</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                      <StatusBadge status={target.status} type="campaign" size="sm" />
                      {latest && <StatusBadge status={latest.status} type="attempt" size="sm" />}
                    </div>
                  </td>
                  <td>
                    {claimedBy ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{claimedBy}</div>
                        <div className="muted-meta">{latest?.keptAt ? formatDateTime(latest.keptAt) : 'Claimed'}</div>
                      </div>
                    ) : (
                      <span className="muted-meta">Open to campaign buzzers</span>
                    )}
                  </td>
                  <td>
                    {expiry ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{formatDateTime(expiry)}</div>
                        <div className="muted-meta">Keep window</div>
                      </div>
                    ) : (
                      <span className="muted-meta">-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 120 }}>
                      <div className="progress-bar" style={{ height: 7 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progress}%`,
                            background: progress >= 100 ? 'var(--status-active)' : progress >= 50 ? 'var(--cyan)' : 'var(--status-kept)',
                          }}
                        />
                      </div>
                      <strong style={{ fontSize: '0.75rem' }}>{progress}%</strong>
                    </div>
                  </td>
                  <td>
                    <div className="action-row">
                      <Link className="icon-action" href={`/campaigns/${campaignId}/blast-links/${target.id}`}>
                        <Eye size={13} /> Detail
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            className="icon-action warning"
                            type="button"
                            onClick={() => onReblast?.(target)}
                            disabled={target.status !== 'ACTIVE' || actionLoadingId === target.id}
                            title={target.status === 'ACTIVE' ? 'Create reblast attempt' : 'Reblast hanya tersedia untuk target ACTIVE'}
                          >
                            <RefreshCw size={13} /> Reblast
                          </button>
                          {target.status === 'PAUSED' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={actionLoadingId === target.id}
                              onClick={() => onStatusChange?.(target, 'ACTIVE')}
                              className="icon-action"
                            >
                              <PauseCircle size={13} /> Resume
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={actionLoadingId === target.id}
                              disabled={target.status !== 'ACTIVE'}
                              onClick={() => onStatusChange?.(target, 'PAUSED')}
                              className="icon-action"
                            >
                              <PauseCircle size={13} /> Pause
                            </Button>
                          )}
                          <button
                            className="icon-action danger"
                            type="button"
                            onClick={() => onStatusChange?.(target, 'ARCHIVED')}
                            disabled={target.status === 'ARCHIVED' || actionLoadingId === target.id}
                          >
                            <Archive size={13} /> Archive
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination-footer">
        <span>Showing 1 to {targets.length} of {targets.length} blast links</span>
        <div className="pager">
          <button type="button" aria-label="Previous page">‹</button>
          <span>1</span>
          <button type="button" aria-label="Next page">›</button>
          <button type="button">10 per page</button>
        </div>
      </div>
    </div>
  )
}
