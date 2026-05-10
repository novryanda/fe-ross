'use client'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { campaignsApi } from '@/lib/api/campaigns'
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/badges'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { formatNumber, formatDate, formatRelativeTime } from '@/lib/utils'
import {
  Eye, BarChart2, FileText, Download, Activity,
  CheckCircle, Users, Percent, ChevronRight, Shield
} from 'lucide-react'
import Link from 'next/link'

export function ViewerDashboard() {
  const { user } = useAuthStore()

  const { data: dashData, isLoading: dLoading } = useQuery({
    queryKey: ['dashboard', 'global'],
    queryFn: () => dashboardApi.getGlobalDashboard(),
  })
  const { data: campaignData, isLoading: cLoading } = useQuery({
    queryKey: ['campaigns-viewer'],
    queryFn: () => campaignsApi.list({ limit: 10 }),
  })

  const campaigns = campaignData?.data ?? []
  const isLoading = dLoading || cLoading

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Selamat datang, {user?.name}. Tampilan read-only campaign performance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read-Only Mode</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : dashData ? (
          <>
            <MetricCard label="Total Campaigns" value={campaigns.length} icon={<BarChart2 size={18} />} sparklineColor="var(--cyan)" />
            <MetricCard label="Active Campaigns" value={dashData.activeCampaigns} icon={<Activity size={18} />} sparklineColor="var(--status-available)" />
            <MetricCard label="Total Views" value={dashData.totalViews} icon={<Eye size={18} />} sparklineColor="var(--violet)" />
            <MetricCard label="Completion Rate" value={`${dashData.completionRate}%`} icon={<Percent size={18} />} sparklineColor="var(--cyan)" />
          </>
        ) : null}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Campaigns', href: '/campaigns', icon: <BarChart2 size={20} />, desc: 'Lihat semua campaign aktif dan performa.', color: 'var(--cyan)' },
          { label: 'Reports', href: '/campaigns', icon: <FileText size={20} />, desc: 'Lihat laporan blast dari campaign.', color: 'var(--violet)' },
          { label: 'Exports', href: '/campaigns', icon: <Download size={20} />, desc: 'Download laporan PDF atau Excel.', color: 'var(--status-kept)' },
        ].map(item => (
          <Link key={item.href + item.label} href={item.href} className="card" style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'border-color 0.15s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Campaign Performance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Overview Performa Campaign
              </span>
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={40} style={{ marginBottom: '0.5rem' }} />)
          ) : (
            <div className="data-table-container" style={{ background: 'transparent', border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Members</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 6).map(c => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/campaigns/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.8125rem' }}>
                          {c.name}
                        </Link>
                      </td>
                      <td><StatusBadge status={c.status} type="campaign" size="sm" /></td>
                      <td><span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{c.memberCount ?? 0}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', minWidth: 40 }}>
                            <div style={{ height: '100%', width: `${c.completionRate ?? 0}%`, background: 'linear-gradient(90deg, var(--cyan), var(--violet))', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 32 }}>{c.completionRate ?? 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link href="/campaigns" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.875rem', fontSize: '0.8125rem', color: 'var(--cyan)', textDecoration: 'none' }}>
            View all campaigns <ChevronRight size={14} />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FileText size={16} style={{ color: 'var(--violet)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Insight & Catatan
            </span>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={36} style={{ marginBottom: '0.5rem' }} />)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(dashData?.recentActivity ?? []).slice(0, 5).map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem' }}>
                    {act.type === 'campaign' ? '🎯' : act.type === 'blast' ? '⚡' : act.type === 'comment' ? '💬' : '📋'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{act.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{formatRelativeTime(act.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Banner */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.875rem 1.25rem',
        background: 'var(--bg-elevated)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Shield size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Tampilan Read-Only (Viewer) — Anda hanya dapat melihat data campaign dan laporan. Untuk mengelola campaign, hubungi Admin.
        </span>
      </div>
    </div>
  )
}
