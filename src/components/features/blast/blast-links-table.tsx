'use client'
import Link from 'next/link'
import { Archive, ChevronLeft, ChevronRight, Eye, ExternalLink, PauseCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { formatDateTime } from '@/lib/utils'
import type { BlastTarget, BlastTargetStatus, PaginationMeta } from '@/types'

interface BlastLinksTableProps {
  campaignId: string
  targets: BlastTarget[]
  meta?: PaginationMeta
  pageSize?: number
  isAdmin?: boolean
  actionLoading?: { id: string; type: 'status' | 'reblast' }
  onStatusChange?: (target: BlastTarget, status: BlastTargetStatus) => void
  onReblast?: (target: BlastTarget) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function BlastLinksTable({
  campaignId,
  targets,
  meta,
  pageSize = 10,
  isAdmin = true,
  actionLoading,
  onStatusChange,
  onReblast,
  onPageChange,
  onPageSizeChange,
}: BlastLinksTableProps) {
  const showingStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : targets.length ? 1 : 0
  const showingEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : targets.length

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
              const completed = target.completedAttempts
              const total = target.totalAttempts ?? target.attempts?.length
              const progress = typeof completed === 'number' && total && total > 0 ? Math.round((completed / total) * 100) : undefined
              const claimedBy = latest?.keptByUser?.name
              const expiry = latest?.keepExpiresAt
              const isStatusLoading = actionLoading?.id === target.id && actionLoading.type === 'status'
              const isReblastLoading = actionLoading?.id === target.id && actionLoading.type === 'reblast'
              const isRowActionLoading = actionLoading?.id === target.id

              return (
                <tr key={target.id}>
                  <td><PlatformBadge platform={target.platform} size="sm" /></td>
                  <td>
                    <div className="source-account-cell">
                      <div className="source-avatar">{target.socialAccount?.username?.charAt(0).toUpperCase() ?? 'S'}</div>
                      <div>
                        <SocialAccountUsernameLink account={target.socialAccount} />
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
                    <div className="muted-meta">{typeof completed === 'number' && typeof total === 'number' ? `${completed} of ${total} completed` : 'Attempt summary unavailable'}</div>
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
                    {progress === undefined ? (
                      <span className="muted-meta">-</span>
                    ) : (
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
                    )}
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
                            disabled={target.status !== 'ACTIVE' || isRowActionLoading}
                            title={target.status === 'ACTIVE' ? 'Create reblast attempt' : 'Reblast hanya tersedia untuk target ACTIVE'}
                          >
                            {isReblastLoading ? <span className="spinner" /> : <RefreshCw size={13} />} Reblast
                          </button>
                          {target.status === 'ARCHIVED' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={isStatusLoading}
                              onClick={() => onStatusChange?.(target, 'ACTIVE')}
                              className="icon-action"
                            >
                              <RotateCcw size={13} /> Restore
                            </Button>
                          ) : target.status === 'PAUSED' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={isStatusLoading}
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
                              loading={isStatusLoading}
                              disabled={target.status !== 'ACTIVE'}
                              onClick={() => onStatusChange?.(target, 'PAUSED')}
                              className="icon-action"
                            >
                              <PauseCircle size={13} /> Pause
                            </Button>
                          )}
                          {target.status !== 'ARCHIVED' && (
                            <button
                              className="icon-action danger"
                              type="button"
                              onClick={() => onStatusChange?.(target, 'ARCHIVED')}
                              disabled={isRowActionLoading}
                            >
                              <Archive size={13} /> Archive
                            </button>
                          )}
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
        <span>Showing {showingStart} to {showingEnd} of {meta?.total ?? targets.length} blast links</span>
        <div className="pager">
          <button type="button" aria-label="Previous page" disabled={!meta || meta.page <= 1} onClick={() => meta && onPageChange?.(Math.max(1, meta.page - 1))}>
            <ChevronLeft size={15} />
          </button>
          <span>{meta ? `${meta.page} / ${Math.max(meta.totalPages, 1)}` : '1'}</span>
          <button type="button" aria-label="Next page" disabled={!meta || meta.page >= meta.totalPages} onClick={() => meta && onPageChange?.(meta.page + 1)}>
            <ChevronRight size={15} />
          </button>
          <select className="input-field" value={pageSize} onChange={event => onPageSizeChange?.(Number(event.target.value))} style={{ width: 112, padding: '0.45rem 0.6rem' }}>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    </div>
  )
}
