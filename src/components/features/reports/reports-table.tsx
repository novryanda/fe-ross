'use client'
import { ExternalLink } from 'lucide-react'
import type { BlastReport, CommentTask, Platform } from '@/types'
import {
  calcEngagement,
  formatDateTime,
  formatNumber,
  getPlatformLabel,
} from '@/lib/utils'

export type ReportsTableItem =
  | ({ kind: 'BLAST'; campaignId?: string; campaignName?: string } & BlastReport)
  | ({ kind: 'COMMENT'; campaignId?: string; campaignName?: string } & CommentTask)

function metricsSummary(item: ReportsTableItem): string {
  if (item.kind === 'BLAST') {
    const engagement = calcEngagement(item)
    return `${formatNumber(item.views)} views · ${formatNumber(engagement)} eng.`
  }
  return 'Comment proof submitted'
}

function resolvePlatform(item: ReportsTableItem): Platform | undefined {
  if (item.kind === 'BLAST') return item.platform
  return item.command?.platform
}

function submittedBy(item: ReportsTableItem): string {
  if (item.kind === 'BLAST') return item.submittedByUser?.name ?? item.submittedBy
  return item.keptByUser?.name ?? item.keptBy ?? '—'
}

function submittedAt(item: ReportsTableItem): string {
  if (item.kind === 'BLAST') return item.submittedAt
  return item.completedAt ?? item.updatedAt
}

function proofLink(item: ReportsTableItem): string | undefined {
  if (item.kind === 'BLAST') return item.proofLink
  return item.proofLink ?? undefined
}

function statusLabel(item: ReportsTableItem): string {
  if (item.kind === 'BLAST') {
    return item.reviewStatus ?? 'SUBMITTED'
  }
  return item.status
}

export function ReportsTable({ items }: { items: ReportsTableItem[] }) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Type</th>
            <th>Platform</th>
            <th>Submitted By</th>
            <th>Submitted At</th>
            <th>Metrics</th>
            <th>Proof</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const platform = resolvePlatform(item)
            const proof = proofLink(item)
            return (
              <tr key={`${item.kind}-${item.id}`}>
                <td>{item.campaignName ?? item.campaignId ?? '—'}</td>
                <td>{item.kind === 'BLAST' ? 'Blast Report' : 'Comment Proof'}</td>
                <td>{platform ? getPlatformLabel(platform) : '—'}</td>
                <td>{submittedBy(item)}</td>
                <td>{submittedAt(item) ? formatDateTime(submittedAt(item)) : '—'}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{metricsSummary(item)}</td>
                <td>
                  {proof ? (
                    <a href={proof} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Proof <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="muted-meta">—</span>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{statusLabel(item)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
