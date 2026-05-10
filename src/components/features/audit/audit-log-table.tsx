'use client'
import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { AUDIT_ACTION_LABELS } from '@/lib/constants'
import type { AuditLog } from '@/types'

function prettyAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
}

function prettyEntity(log: AuditLog): string {
  return log.entityTypeRaw ?? log.targetType.replace(/_/g, ' ')
}

function hasPayload(log: AuditLog): boolean {
  return Boolean(log.oldValues || log.newValues || log.metadata)
}

function stringifyPayload(value: unknown): string {
  if (value === undefined || value === null) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

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
          {logs.map(log => {
            const canExpand = hasPayload(log)
            const isOpen = Boolean(open[log.id])
            return (
              <Fragment key={log.id}>
                <tr>
                  <td>
                    {canExpand ? (
                      <button
                        onClick={() => toggle(log.id)}
                        aria-label={isOpen ? 'Hide metadata' : 'Show metadata'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : null}
                  </td>
                  <td>{log.timestamp ? formatDateTime(log.timestamp) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.actorName ?? log.actor ?? 'System'}</span>
                      {log.actorEmail && <span className="muted-meta" style={{ fontSize: '0.7rem' }}>{log.actorEmail}</span>}
                    </div>
                  </td>
                  <td>{prettyAction(log.action)}</td>
                  <td>{prettyEntity(log)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.target || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.campaignId ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress ?? '—'}</td>
                </tr>
                {canExpand && isOpen && (
                  <tr>
                    <td />
                    <td colSpan={7} style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                        {log.details && (
                          <div>
                            <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Details</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{log.details}</div>
                          </div>
                        )}
                        <div>
                          <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Old Values</div>
                          <pre style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stringifyPayload(log.oldValues)}</pre>
                        </div>
                        <div>
                          <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>New Values</div>
                          <pre style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stringifyPayload(log.newValues)}</pre>
                        </div>
                        {log.userAgent && (
                          <div>
                            <div className="muted-meta" style={{ fontSize: '0.7rem', marginBottom: 4 }}>User Agent</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>{log.userAgent}</div>
                          </div>
                        )}
                      </div>
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
