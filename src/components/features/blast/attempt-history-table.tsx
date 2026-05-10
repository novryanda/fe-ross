import { ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badges'
import { formatDateTime, formatNumber } from '@/lib/utils'
import type { BlastAttempt } from '@/types'

export function AttemptHistoryTable({ attempts }: { attempts: BlastAttempt[] }) {
  return (
    <div className="blast-table-shell">
      <div className="blast-table-scroll">
      <table className="blast-table" style={{ minWidth: 1120 }}>
        <thead>
          <tr>
            <th>Attempt No</th>
            <th>Status</th>
            <th>Kept By</th>
            <th>Kept At</th>
            <th>Keep Expires At</th>
            <th>Completed At</th>
            <th>Metrics Summary</th>
            <th>Proof Link</th>
            <th>Report Status</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map(attempt => {
            const report = attempt.report
            const engagement = report ? report.likes + report.comments + report.shares + report.reposts : 0
            return (
              <tr key={attempt.id}>
                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontWeight: 850 }}>
                    #{attempt.attemptNo}
                  </div>
                </td>
                <td><StatusBadge status={attempt.status} type="attempt" size="sm" /></td>
                <td>
                  {attempt.keptByUser ? (
                    <div className="source-account-cell">
                      <div className="source-avatar" style={{ width: 28, height: 28, borderRadius: 8 }}>{attempt.keptByUser.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{attempt.keptByUser.name}</div>
                        <div className="muted-meta">Buzzer</div>
                      </div>
                    </div>
                  ) : <span className="muted-meta">Not claimed</span>}
                </td>
                <td>{attempt.keptAt ? <span>{formatDateTime(attempt.keptAt)}</span> : <span className="muted-meta">-</span>}</td>
                <td>{attempt.keepExpiresAt ? <span>{formatDateTime(attempt.keepExpiresAt)}</span> : <span className="muted-meta">-</span>}</td>
                <td>{attempt.completedAt ? <span>{formatDateTime(attempt.completedAt)}</span> : <span className="muted-meta">-</span>}</td>
                <td>
                  {report ? (
                    <div>
                      <div style={{ fontWeight: 800 }}>{formatNumber(report.views)} views</div>
                      <div className="muted-meta">{formatNumber(engagement)} engagement</div>
                    </div>
                  ) : <span className="muted-meta">No metrics</span>}
                </td>
                <td>
                  {report?.proofLink ? (
                    <a href={report.proofLink} target="_blank" rel="noopener noreferrer" className="icon-action">
                      Proof <ExternalLink size={10} />
                    </a>
                  ) : <span className="muted-meta">-</span>}
                </td>
                <td>
                  {report ? (
                    <span className="icon-action" style={{ cursor: 'default' }}>{report.reviewStatus ?? 'SUBMITTED'}</span>
                  ) : <span className="muted-meta">-</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
