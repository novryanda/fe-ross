'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { MessageCircle, Settings, Target } from 'lucide-react'
import { CampaignHero } from '@/components/features/campaign/campaign-hero'
import { useAuth } from '@/hooks/use-auth'
import type { Campaign } from '@/types'

interface CampaignShellProps {
  campaign?: Campaign
  campaignId: string
  children: ReactNode
  actions?: ReactNode
}

export function CampaignShell({ campaign, campaignId, children, actions }: CampaignShellProps) {
  const { isAdmin, isViewer } = useAuth()
  const defaultActions = isAdmin ? (
    <>
      <Link href={`/campaigns/${campaignId}/blast-links/new`} className="btn-primary" style={{ textDecoration: 'none' }}>
        <Target size={14} /> Add Blast Link
      </Link>
      <Link href={`/campaigns/${campaignId}/commands/new`} className="btn-secondary" style={{ textDecoration: 'none' }}>
        <MessageCircle size={14} /> New Command
      </Link>
      <Link href={`/campaigns/${campaignId}/edit`} className="btn-ghost" style={{ textDecoration: 'none' }}>
        <Settings size={14} /> Edit
      </Link>
    </>
  ) : undefined

  return (
    <div>
      <CampaignHero
        campaign={campaign}
        campaignId={campaignId}
        viewer={isViewer}
        actions={actions ?? defaultActions}
      />
      {children}
    </div>
  )
}
