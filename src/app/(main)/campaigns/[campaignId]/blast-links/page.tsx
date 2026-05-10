'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { campaignsApi } from '@/lib/api/campaigns'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { CampaignBlastLinksView } from '@/components/features/blast/campaign-blast-links-view'
import { RoleGuard } from '@/components/layout/role-guard'

export default function BlastLinksPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { data: campaign } = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })

  return (
    <RoleGuard roles={['ADMIN', 'VIEWER']}>
      <CampaignShell campaign={campaign} campaignId={campaignId}>
        <CampaignBlastLinksView campaignId={campaignId} />
      </CampaignShell>
    </RoleGuard>
  )
}
