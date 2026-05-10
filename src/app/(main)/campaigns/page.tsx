'use client'
import { useQuery } from '@tanstack/react-query'
import { campaignsApi } from '@/lib/api/campaigns'
import { useState } from 'react'
import { StatusBadge, PlatformBadge } from '@/components/ui/badges'
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDate, getCampaignStatusConfig } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Plus, Search, MoreHorizontal, BarChart2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { CampaignStatus } from '@/types'

export default function CampaignsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['campaigns', search, statusFilter],
    queryFn: () => campaignsApi.list({ search: search || undefined, status: statusFilter || undefined }),
  })

  const campaigns = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Kelola dan monitor semua campaign di organisasi.</p>
        </div>
        {isAdmin && (
          <Link href="/campaigns/new" className="btn-primary">
            <Plus size={15} />
            New Campaign
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard label="Total Campaigns" value={campaigns.length} sparklineColor="var(--cyan)" />
            <MetricCard label="Active" value={campaigns.filter(c => c.status === 'ACTIVE').length} sparklineColor="var(--status-available)" />
            <MetricCard label="Completed" value={campaigns.filter(c => c.status === 'COMPLETED').length} sparklineColor="var(--status-completed)" />
            <MetricCard label="Draft" value={campaigns.filter(c => c.status === 'DRAFT').length} sparklineColor="var(--text-muted)" />
          </>
        )}
      </div>

      {isError && (
        <div className="blast-info-banner" style={{ marginBottom: '1.25rem', borderColor: 'rgba(239,68,68,0.35)' }}>
          <AlertCircle size={18} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
          <span>{getErrorMessage(error, 'Gagal memuat campaign.')}</span>
          <button type="button" className="btn-ghost" onClick={() => refetch()} style={{ marginLeft: 'auto', padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select className="input-field" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as CampaignStatus[]).map(s => (
            <option key={s} value={s}>{getCampaignStatusConfig(s).label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Status</th>
              <th>Period</th>
              <th>Platforms</th>
              <th>Members</th>
              <th>Completion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ marginBottom: '0.75rem', color: 'var(--status-rejected)' }} />
                  <div>Campaign gagal dimuat.</div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <BarChart2 size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <div>Tidak ada campaign ditemukan.</div>
                </td>
              </tr>
            ) : (
              campaigns.map(campaign => (
                <tr key={campaign.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--cyan), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {campaign.name.charAt(0)}
                      </div>
                      <div>
                        <Link href={`/campaigns/${campaign.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                          {campaign.name}
                        </Link>
                        {campaign.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {campaign.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={campaign.status} type="campaign" size="sm" /></td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>{formatDate(campaign.startDate)}</div>
                      {campaign.endDate && <div style={{ color: 'var(--text-muted)' }}>– {formatDate(campaign.endDate)}</div>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {campaign.platforms.length ? campaign.platforms.slice(0, 3).map(p => <PlatformBadge key={p} platform={p} size="sm" />) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backend belum menyediakan platform</span>}
                      {campaign.platforms.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{campaign.platforms.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {campaign.memberCount ?? 0} members
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 80, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${campaign.completionRate ?? 0}%`, background: 'linear-gradient(90deg, var(--cyan), var(--violet))', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{campaign.completionRate ?? 0}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/campaigns/${campaign.id}`} className="btn-ghost" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
                        View
                      </Link>
                      {isAdmin && (
                        <button className="btn-ghost" style={{ padding: '0.25rem', fontSize: '0.75rem' }}>
                          <MoreHorizontal size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
