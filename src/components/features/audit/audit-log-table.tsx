'use client'
import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { AUDIT_ACTION_LABELS } from '@/lib/constants'
import type { AuditLog } from '@/types'

function prettyAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
}

function prettyEntity(log: AuditLog): string {
  return log.entityTypeRaw ?? log.targetType.replace(/_/g, ' ')
}

function stringifyPayload(value: unknown): string {
  if (value === undefined || value === null) return '-'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

interface AuditLogTableProps {
  logs: AuditLog[]
  onLoadDetail?: (auditLogId: string) => Promise<AuditLog>
}

export function AuditLogTable({ logs, onLoadDetail }: AuditLogTableProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [details, setDetails] = useState<Record<string, AuditLog>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggle = async (log: AuditLog) => {
    const nextOpen = !open[log.id]
    setOpen((prev) => ({ ...prev, [log.id]: nextOpen }))
    if (!nextOpen || details[log.id] || !onLoadDetail) return

    setLoading((prev) => ({ ...prev, [log.id]: true }))
    setErrors((prev) => ({ ...prev, [log.id]: '' }))
    try {
      const detail = await onLoadDetail(log.id)
      setDetails((prev) => ({ ...prev, [log.id]: detail }))
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [log.id]: error instanceof Error ? error.message : 'Gagal memuat detail audit.',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [log.id]: false }))
    }
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 32 }} />
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Event</th>
            <th>Entity</th>
            <th>Target</th>
            <th>Campaign</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isOpen = Boolean(open[log.id])
            const detail = details[log.id] ?? log
            return (
              <Fragment key={log.id}>
                <tr>
                  <td>
                    <button
                      onClick={() => void toggle(log)}
                      aria-label={isOpen ? 'Hide audit detail' : 'View audit detail'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
                    >
                      {loading[log.id] ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : isOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  </td>
                  <td>{log.timestamp ? formatDateTime(log.timestamp) : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.actorName ?? log.actor ?? 'System'}</span>
                      {log.actorEmail && <span className="muted-meta" style={{ fontSize: '0.7rem' }}>{log.actorEmail}</span>}
                    </div>
                  </td>
                  <td>{prettyAction(log.action)}</td>
                  <td>{prettyEntity(log)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.target || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.campaignName ?? log.campaignId ?? '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress ?? '-'}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td />
                    <td colSpan={7} style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)' }}>
                      {errors[log.id] ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--status-expired)' }}>{errors[log.id]}</div>
                      ) : loading[log.id] && !details[log.id] ? (
                        <div className="muted-meta" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '0.75rem' }}>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          Loading detail...
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Details</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{detail.details ?? prettyAction(detail.action)}</div>
                          </div>
                          <div>
                            <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Old Values</div>
                            <pre style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stringifyPayload(detail.oldValues)}</pre>
                          </div>
                          <div>
                            <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>New Values</div>
                            <pre style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stringifyPayload(detail.newValues)}</pre>
                          </div>
                          {detail.userAgent && (
                            <div>
                              <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>User Agent</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>{detail.userAgent}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
