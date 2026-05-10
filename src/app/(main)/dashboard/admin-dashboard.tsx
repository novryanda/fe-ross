'use client'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card'
import { formatNumber, formatRelativeTime, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/badges'
import {
  Eye, Heart, MessageCircle, Share2, Percent, AlertTriangle,
  Activity, Users, TrendingUp, Plus, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'global'],
    queryFn: () => dashboardApi.getGlobalDashboard(),
  })

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Dashboard</h1>
          <p className="page-subtitle">Real-time operational overview across all campaigns and networks.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Data as of {formatDate(new Date(), { hour: '2-digit', minute: '2-digit' })} UTC
          </span>
          <Link href="/campaigns/new" className="btn-primary">
            <Plus size={15} />
            New Campaign
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1.5rem' }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : data ? (
          <>
            <MetricCard label="Active Campaigns" value={data.activeCampaigns} delta="↑14% vs last 7 days" deltaPositive icon={<Activity size={18} />} sparklineColor="var(--cyan)" />
            <MetricCard label="Total Views" value={data.totalViews} delta="↑22.7% vs last 7 days" deltaPositive icon={<Eye size={18} />} sparklineColor="var(--violet)" />
            <MetricCard label="Total Engagement" value={data.totalEngagement} delta="↑18.3% vs last 7 days" deltaPositive icon={<Heart size={18} />} sparklineColor="#e040fb" />
            <MetricCard label="Completion Rate" value={`${data.completionRate}%`} delta="↑5.6pp vs last 7 days" deltaPositive icon={<Percent size={18} />} sparklineColor="var(--cyan)" />
            <MetricCard label="Overdue Tasks" value={data.overdueTasks} delta="↑19 vs last 7 days" deltaPositive={false} icon={<AlertTriangle size={18} />} sparklineColor="var(--status-expired)" />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Engagement Trend */}
        <div className="card" style={{ padding: '1.25rem', gridColumn: '1 / 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Engagement Trend Across Campaigns
              </span>
            </div>
            <select className="input-field" style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.engagementTrend ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatNumber(v)} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="engagement" name="Total Engagement" stroke="var(--cyan)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Buzzers */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Top Buzzer Performance</span>
            </div>
          </div>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 4 }} /><div className="skeleton" style={{ height: 10, width: '50%' }} /></div>
              </div>
            ))
          ) : data?.topBuzzers.map((b, idx) => (
            <div key={b.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ width: 20, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {b.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatNumber(b.totalEngagement)} eng</div>
              </div>
              <span style={{ background: 'var(--violet-dim)', color: 'var(--text-violet)', padding: '0.125rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>{b.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {/* Campaign Performance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Campaign Performance</span>
          </div>
          <div className="data-table-container" style={{ background: 'transparent', border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Completion</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {(data?.campaignPerformance ?? []).map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/campaigns/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.8125rem' }}>{c.name}</Link>
                    </td>
                    <td>
                      <StatusBadge status={c.status} type="campaign" size="sm" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', minWidth: 40 }}>
                          <div style={{ height: '100%', width: `${c.completion}%`, background: 'linear-gradient(90deg, var(--cyan), var(--violet))', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36 }}>{c.completion}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: c.risk === 'Low' ? 'var(--status-available)' : c.risk === 'Medium' ? 'var(--status-kept)' : 'var(--status-expired)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {c.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/campaigns" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.875rem', fontSize: '0.8125rem', color: 'var(--cyan)', textDecoration: 'none' }}>
            View all campaigns <ChevronRight size={14} />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recent Activity</span>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', fontSize: '0.75rem' }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(data?.recentActivity ?? []).map(act => (
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
        </div>

        {/* Active Buzzers / Stats */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Audit Summary (Last 7 Days)
          </div>
          {[
            { label: 'Active Buzzers', value: data?.activeBuzzers ?? 0, icon: <Users size={16} />, color: 'var(--cyan)' },
            { label: 'Expired Keeps', value: data?.expiredKeeps ?? 0, icon: <AlertTriangle size={16} />, color: 'var(--status-expired)' },
          ].map(stat => (
            <div key={stat.label} className="card-elevated" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
          <Link href="/audit" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--cyan)', textDecoration: 'none' }}>
            View full audit log <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
