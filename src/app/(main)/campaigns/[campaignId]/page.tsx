'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { campaignsApi } from '@/lib/api/campaigns'
import { dashboardApi } from '@/lib/api/dashboard'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { KpiGrid } from '@/components/features/dashboard/kpi-grid'
import { EngagementTrend } from '@/components/charts/engagement-trend'
import { PlatformBreakdown } from '@/components/charts/platform-breakdown'
import { TopBuzzerTable } from '@/components/features/dashboard/top-buzzer-table'
import { RecentReportsList } from '@/components/features/dashboard/recent-reports-list'
import { OverdueWidget } from '@/components/features/dashboard/overdue-widget'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/api/errors'
import { formatNumber } from '@/lib/utils'
import { AlertCircle, Eye, Heart, Repeat2, Target } from 'lucide-react'

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()

  const { data: campaign, isLoading, isError, error, refetch } = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const { data: dashData, isLoading: dashboardLoading, isError: dashboardError, error: dashboardErrorValue, refetch: refetchDashboard } = useQuery({ queryKey: ['campaign-dashboard', campaignId], queryFn: () => dashboardApi.getCampaignDashboard(campaignId), enabled: !!campaignId })

  if (isLoading) {
    return (
      <div>
        <Skeleton height={150} />
        <Skeleton height={220} style={{ marginTop: '1rem' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <div className="campaign-summary-panel">
          <AlertCircle size={24} style={{ color: 'var(--status-rejected)', marginBottom: '0.75rem' }} />
          <strong>Campaign gagal dimuat.</strong>
          <p className="muted-meta" style={{ marginTop: '0.5rem' }}>{getErrorMessage(error, 'Campaign tidak ditemukan atau tidak dapat diakses.')}</p>
          <button type="button" className="btn-secondary" onClick={() => refetch()} style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="campaign-summary-panel">
        <strong>Campaign not found.</strong>
        <p className="muted-meta" style={{ marginTop: '0.5rem' }}>Data campaign tidak tersedia.</p>
      </div>
    )
  }

  return (
    <CampaignShell campaign={campaign} campaignId={campaignId}>
      <div className="section-heading-row">
        <div>
          <div className="section-kicker">Campaign Overview</div>
          <h2 className="section-title">Operational Dashboard</h2>
          <p className="section-subtitle">Ringkasan performa, engagement, report terbaru, dan item operasional untuk campaign ini.</p>
        </div>
      </div>

      {dashboardError && (
        <div className="blast-info-banner" style={{ marginBottom: '1.25rem', borderColor: 'rgba(239,68,68,0.35)' }}>
          <AlertCircle size={18} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
          <span>{getErrorMessage(dashboardErrorValue, 'Dashboard campaign gagal dimuat.')}</span>
          <button type="button" className="btn-ghost" onClick={() => refetchDashboard()} style={{ marginLeft: 'auto', padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {dashboardLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Skeleton height={120} />
          <Skeleton height={320} />
        </div>
      ) : !dashData ? (
        <div className="campaign-summary-panel">
          <strong>Dashboard belum tersedia.</strong>
          <p className="muted-meta" style={{ marginTop: '0.5rem' }}>Campaign berhasil dimuat, tetapi data dashboard belum dapat ditampilkan.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <KpiGrid items={[
            { label: 'Total Views', value: formatNumber(dashData.totalViews), icon: <Eye size={16} />, color: 'var(--cyan)' },
            { label: 'Engagement', value: formatNumber(dashData.totalEngagement), icon: <Heart size={16} />, color: '#f43f5e' },
            { label: 'Completion', value: `${dashData.completionRate.toFixed(1)}%`, icon: <Target size={16} />, color: 'var(--status-available)' },
            { label: 'Completed', value: `${dashData.completedAttempts}/${dashData.totalAttempts}`, icon: <Repeat2 size={16} /> },
          ]} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '1.25rem' }}>
            <EngagementTrend data={dashData.engagementTrend} lines={['views', 'likes', 'comments']} />
            <PlatformBreakdown data={dashData.platformBreakdown} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.25rem' }}>
            <TopBuzzerTable buzzers={dashData.topBuzzers} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <RecentReportsList reports={dashData.recentReports} />
              <OverdueWidget items={dashData.overdueItems} />
            </div>
          </div>
        </div>
      )}
    </CampaignShell>
  )
}
