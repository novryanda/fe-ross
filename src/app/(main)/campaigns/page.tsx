'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignsApi } from '@/lib/api/campaigns'
import { useEffect, useState } from 'react'
import { StatusBadge, PlatformBadge } from '@/components/ui/badges'
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card'
import { getErrorMessage, mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate, getCampaignStatusConfig } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Plus, Search, MoreHorizontal, BarChart2, AlertCircle, Archive, Edit3, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { CampaignStatus } from '@/types'
import { toast } from 'sonner'

export default function CampaignsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [search])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['campaigns', { search: debouncedSearch, status: statusFilter, page, limit }],
    queryFn: () => campaignsApi.list({
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    }),
  })

  const campaigns = data?.data ?? []
  const meta = data?.meta
  const showingStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0
  const showingEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : campaigns.length

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      campaignsApi.update(id, { status }),
    onSuccess: (_campaign, variables) => {
      toast.success(variables.status === 'ARCHIVED' ? 'Campaign diarchive.' : 'Campaign direstore.')
      setOpenActionId(null)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

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
            <MetricCard label="Total Campaigns" value={meta?.total ?? campaigns.length} sparklineColor="var(--cyan)" />
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
        <select className="input-field" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
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
                      {campaign.platforms.length ? campaign.platforms.slice(0, 3).map(p => <PlatformBadge key={p} platform={p} size="sm" />) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>}
                      {campaign.platforms.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{campaign.platforms.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {campaign.memberCount ?? 0} members
                    </span>
                  </td>
                  <td>
                    {campaign.completionRate === undefined ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 80, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${campaign.completionRate}%`, background: 'linear-gradient(90deg, var(--cyan), var(--violet))', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{campaign.completionRate}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', alignItems: 'center' }}>
                      <Link href={`/campaigns/${campaign.id}`} className="btn-ghost" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
                        View
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={openActionId === campaign.id}
                          className="btn-ghost"
                          onClick={() => setOpenActionId(current => current === campaign.id ? null : campaign.id)}
                          style={{ padding: '0.25rem', fontSize: '0.75rem', position: 'relative', zIndex: 3 }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      )}
                      {isAdmin && openActionId === campaign.id && (
                        <div
                          role="menu"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '1.9rem',
                            minWidth: 150,
                            zIndex: 50,
                            padding: '0.35rem',
                            border: '1px solid var(--border-default)',
                            borderRadius: 8,
                            background: 'var(--bg-elevated)',
                            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                          }}
                        >
                          <Link role="menuitem" href={`/campaigns/${campaign.id}`} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.55rem', fontSize: '0.78rem', textDecoration: 'none' }}>View</Link>
                          <Link role="menuitem" href={`/campaigns/${campaign.id}/edit`} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.55rem', fontSize: '0.78rem', textDecoration: 'none' }}><Edit3 size={13} /> Edit</Link>
                          {campaign.status === 'ARCHIVED' ? (
                            <button role="menuitem" type="button" className="btn-ghost" onClick={() => statusMutation.mutate({ id: campaign.id, status: 'ACTIVE' })} style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.55rem', fontSize: '0.78rem' }}>
                              <RotateCcw size={13} /> Restore
                            </button>
                          ) : (
                            <button role="menuitem" type="button" className="btn-ghost" onClick={() => statusMutation.mutate({ id: campaign.id, status: 'ARCHIVED' })} style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.55rem', fontSize: '0.78rem' }}>
                              <Archive size={13} /> Archive
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta && (
          <div className="pagination-footer">
            <span>Showing {showingStart}–{showingEnd} of {meta.total} campaigns</span>
            <div className="pager">
              <button type="button" aria-label="Previous page" disabled={meta.page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>
                <ChevronLeft size={15} />
              </button>
              <span>{meta.page} / {Math.max(meta.totalPages, 1)}</span>
              <button type="button" aria-label="Next page" disabled={meta.page >= meta.totalPages} onClick={() => setPage(current => current + 1)}>
                <ChevronRight size={15} />
              </button>
              <select className="input-field" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1) }} style={{ width: 112, padding: '0.45rem 0.6rem' }}>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
