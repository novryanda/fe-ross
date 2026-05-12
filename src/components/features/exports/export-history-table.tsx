'use client'
import {
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { formatDateTime, formatNumber } from '@/lib/utils'
import type { ExportRecord, ExportStatus } from '@/types'

const SCOPE_LABELS: Record<string, string> = {
  SUMMARY: 'Summary',
  BLAST_REPORTS: 'Blast Reports',
  COMMENT_TASKS: 'Comment Tasks',
  FULL: 'Full Campaign Report',
}

const PROCESSING_TIMEOUT_MINUTES = 10

function isTakingTooLong(item: ExportRecord): boolean {
  if (item.status !== 'PROCESSING' && item.status !== 'PENDING') return false
  const started = item.startedAt ?? item.createdAt
  if (!started) return false
  return Date.now() - new Date(started).getTime() > PROCESSING_TIMEOUT_MINUTES * 60 * 1000
}

function StatusPill({ status }: { status: ExportStatus }) {
  const config: Record<ExportStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending',
      color: 'var(--status-kept)',
      bg: 'rgba(245,158,11,0.15)',
      icon: <Clock size={11} />,
    },
    PROCESSING: {
      label: 'Processing',
      color: 'var(--cyan)',
      bg: 'var(--cyan-dim)',
      icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />,
    },
    COMPLETED: {
      label: 'Completed',
      color: 'var(--status-available)',
      bg: 'var(--status-available-bg)',
      icon: <CheckCircle2 size={11} />,
    },
    FAILED: {
      label: 'Failed',
      color: 'var(--status-expired)',
      bg: 'rgba(239,68,68,0.15)',
      icon: <XCircle size={11} />,
    },
  }
  const cfg = config[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

interface ExportHistoryTableProps {
  exports: ExportRecord[]
  onDownload?: (record: ExportRecord) => void
  onRetry?: (record: ExportRecord) => void
  downloadingId?: string | null
  retryingId?: string | null
  onRefresh?: () => void
}

export function ExportHistoryTable({
  exports,
  onDownload,
  onRetry,
  downloadingId,
  retryingId,
  onRefresh,
}: ExportHistoryTableProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Format</th>
            <th>Scope</th>
            <th>Status</th>
            <th>Requested By</th>
            <th>Requested At</th>
            <th>Completed At</th>
            <th>Size</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((item) => {
            const isDownloadable = item.status === 'COMPLETED'
            const canRetry = item.status === 'FAILED' && Boolean(onRetry)
            const takingTooLong = isTakingTooLong(item)
            return (
              <tr key={item.id}>
                <td>{item.campaignName ?? item.campaignId}</td>
                <td>{item.format}</td>
                <td>{item.scope ? (SCOPE_LABELS[item.scope] ?? item.scope) : '-'}</td>
                <td><StatusPill status={item.status} /></td>
                <td>{item.requestedByName ?? item.requestedBy ?? '-'}</td>
                <td>{formatDateTime(item.requestedAt ?? item.createdAt)}</td>
                <td>{item.completedAt ? formatDateTime(item.completedAt) : '-'}</td>
                <td>{item.fileSize ? `${formatNumber(Math.round(item.fileSize / 1000))} KB` : '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  {isDownloadable && (
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      disabled={downloadingId === item.id || !onDownload}
                      onClick={() => onDownload?.(item)}
                    >
                      {downloadingId === item.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
                      Download
                    </button>
                  )}
                  {(item.status === 'PROCESSING' || item.status === 'PENDING') && (
                    <span className="muted-meta" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {takingTooLong ? 'Taking too long' : item.status === 'PROCESSING' ? 'Processing...' : 'Queued'}
                      {takingTooLong && onRefresh && (
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                          onClick={onRefresh}
                        >
                          Refresh
                        </button>
                      )}
                    </span>
                  )}
                  {canRetry && (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {item.errorMessage && (
                        <span className="muted-meta" style={{ fontSize: '0.68rem', color: 'var(--status-expired)', maxWidth: 220, whiteSpace: 'normal' }}>
                          {item.errorMessage}
                        </span>
                      )}
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        disabled={retryingId === item.id}
                        onClick={() => onRetry?.(item)}
                      >
                        {retryingId === item.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={11} />}
                        Retry
                      </button>
                    </div>
                  )}
                  {item.status === 'FAILED' && !canRetry && item.errorMessage && (
                    <span className="muted-meta" style={{ fontSize: '0.68rem', color: 'var(--status-expired)' }}>
                      {item.errorMessage}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
