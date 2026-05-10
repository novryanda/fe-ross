'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ClipboardList, ExternalLink } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { EmptyState } from '@/components/ui/empty-state'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { campaignsApi } from '@/lib/api/campaigns'
import { commentTasksApi } from '@/lib/api/comment-commands'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'

export default function CampaignTasksPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const campaignQuery = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const tasksQuery = useQuery({ queryKey: ['comment-tasks', campaignId], queryFn: () => commentTasksApi.listByCampaign(campaignId) })
  const tasks = tasksQuery.data ?? []
  const error = campaignQuery.error ?? tasksQuery.error

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Comment Slot Operations</div>
            <h2 className="section-title">Comment Tasks</h2>
            <p className="section-subtitle">Semua slot comment task dalam campaign, termasuk Keep, expiry, dan proof submission.</p>
          </div>
        </div>

        {campaignQuery.isLoading || tasksQuery.isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        ) : error ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat comment tasks" description={mapApiErrorToToastMessage(error)} />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task No</th>
                  <th>Command</th>
                  <th>Stance</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Kept By</th>
                  <th>Kept At</th>
                  <th>Keep Expires At</th>
                  <th>Completed At</th>
                  <th>Proof Link</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td><strong>#{task.taskNo}</strong></td>
                    <td>
                      <div style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>{task.command?.narrative ?? '-'}</div>
                      {task.command?.targetPostUrl ? <a href={task.command.targetPostUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: 260 }}>{task.command.targetPostUrl}</a> : '-'}
                    </td>
                    <td>{task.command && <StanceBadge stance={task.command.stance} size="sm" />}</td>
                    <td>{task.command && <PlatformBadge platform={task.command.platform} size="sm" />}</td>
                    <td><StatusBadge status={task.status} type="task" size="sm" /></td>
                    <td>{task.keptByUser?.name ?? '-'}</td>
                    <td>{task.keptAt ? formatDate(task.keptAt) : '-'}</td>
                    <td>{task.keepExpiresAt ? formatDate(task.keepExpiresAt) : '-'}</td>
                    <td>{task.completedAt ? formatDate(task.completedAt) : '-'}</td>
                    <td>{task.proofLink ? <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="ext-link"><ExternalLink size={10} /> Open</a> : '-'}</td>
                    <td>{task.notes ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tasks.length && (
              <EmptyState icon={<ClipboardList size={48} />} title="Belum ada comment task slot" />
            )}
          </div>
        )}
      </CampaignShell>
    </RoleGuard>
  )
}
