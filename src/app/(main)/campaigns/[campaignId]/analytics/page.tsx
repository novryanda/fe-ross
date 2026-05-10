'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { PageHeader } from '@/components/ui/page-header'
import { KpiGrid } from '@/components/features/dashboard/kpi-grid'
import { EngagementTrend } from '@/components/charts/engagement-trend'
import { PlatformBreakdown } from '@/components/charts/platform-breakdown'
import { TopBuzzerTable } from '@/components/features/dashboard/top-buzzer-table'
import { formatNumber } from '@/lib/utils'
import { Eye, Heart, Target, TrendingUp } from 'lucide-react'

export default function CampaignAnalyticsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { data: dashData } = useQuery({ queryKey: ['campaign-dashboard', campaignId], queryFn: () => dashboardApi.getCampaignDashboard(campaignId) })

  if (!dashData) return null

  return (
    <div className="page-container">
      <PageHeader title="Campaign Analytics" subtitle="Analisis mendalam performa campaign" backHref={`/campaigns/${campaignId}`} />

      <KpiGrid items={[
        { label: 'Total Views', value: formatNumber(dashData.totalViews), icon: <Eye size={16} />, color: 'var(--cyan)' },
        { label: 'Total Likes', value: formatNumber(dashData.totalLikes), icon: <Heart size={16} />, color: '#f43f5e' },
        { label: 'Completion', value: `${dashData.completionRate.toFixed(1)}%`, icon: <Target size={16} />, color: 'var(--status-available)' },
        { label: 'Engagement', value: formatNumber(dashData.totalEngagement), icon: <TrendingUp size={16} />, color: 'var(--violet)' },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
        <EngagementTrend data={dashData.engagementTrend} lines={['views', 'likes', 'comments', 'shares']} />
        <PlatformBreakdown data={dashData.platformBreakdown} />
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <TopBuzzerTable buzzers={dashData.topBuzzers} />
      </div>
    </div>
  )
}
