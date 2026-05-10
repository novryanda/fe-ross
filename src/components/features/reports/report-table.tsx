import { ExternalLink } from 'lucide-react'
import { formatDateTime, formatNumber, calcEngagement } from '@/lib/utils'
import type { BlastReport } from '@/types'

export function ReportTable({ reports }: { reports: BlastReport[] }) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Submitted By</th>
            <th>Submitted At</th>
            <th style={{ textAlign: 'right' }}>Views</th>
            <th style={{ textAlign: 'right' }}>Likes</th>
            <th style={{ textAlign: 'right' }}>Comments</th>
            <th style={{ textAlign: 'right' }}>Shares</th>
            <th style={{ textAlign: 'right' }}>Reposts</th>
            <th style={{ textAlign: 'right' }}>Engagement</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.submittedByUser?.name ?? report.submittedBy}</td>
              <td>{formatDateTime(report.submittedAt)}</td>
              <td style={{ textAlign: 'right', color: 'var(--cyan)', fontWeight: 700 }}>{formatNumber(report.views)}</td>
              <td style={{ textAlign: 'right' }}>{formatNumber(report.likes)}</td>
              <td style={{ textAlign: 'right' }}>{formatNumber(report.comments)}</td>
              <td style={{ textAlign: 'right' }}>{formatNumber(report.shares)}</td>
              <td style={{ textAlign: 'right' }}>{formatNumber(report.reposts)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(calcEngagement(report))}</td>
              <td>
                <a href={report.proofLink} target="_blank" rel="noopener noreferrer" className="ext-link">
                  Proof <ExternalLink size={10} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
