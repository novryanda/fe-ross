'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { commentCommandsApi } from '@/lib/api/comment-commands'
import { PageHeader } from '@/components/ui/page-header'
import { CommentCommandCard } from '@/components/features/comment/comment-command-card'
import { ProKontraChart } from '@/components/charts/pro-kontra-chart'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageCircle } from 'lucide-react'

export default function CampaignCommentsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { data: commands } = useQuery({ queryKey: ['comment-commands', campaignId], queryFn: () => commentCommandsApi.list(campaignId) })

  const proCount = commands?.filter(c => c.stance === 'PRO').reduce((sum, c) => sum + (c.completedTasks ?? 0), 0) ?? 0
  const kontraCount = commands?.filter(c => c.stance === 'KONTRA').reduce((sum, c) => sum + (c.completedTasks ?? 0), 0) ?? 0

  return (
    <div className="page-container">
      <PageHeader title="Comment Summary" subtitle="Ringkasan komentar PRO vs KONTRA" backHref={`/campaigns/${campaignId}`} />

      {commands && commands.length > 0 && (
        <ProKontraChart data={[{ label: 'Completed Tasks', pro: proCount, kontra: kontraCount }]} />
      )}

      <div style={{ marginTop: '1.25rem' }}>
        {!commands?.length ? (
          <EmptyState icon={<MessageCircle size={48} />} title="Belum ada comment command" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '0.75rem' }}>
            {commands.map(cmd => <CommentCommandCard key={cmd.id} command={cmd} />)}
          </div>
        )}
      </div>
    </div>
  )
}
