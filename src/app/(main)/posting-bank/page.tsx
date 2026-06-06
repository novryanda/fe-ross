'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FolderKanban, Layers3 } from 'lucide-react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { campaignsApi } from '@/lib/api/campaigns'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'

export default function PostingBankOverviewPage() {
  const [search, setSearch] = useState('')

  const campaignsQuery = useQuery({
    queryKey: ['posting-bank-campaigns', search],
    queryFn: () => campaignsApi.list({ search: search || undefined, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
  })

  const campaigns = campaignsQuery.data?.data ?? []

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Posting Bank"
          subtitle="Pilih campaign untuk membuat posting order, meninjau submission PIC, dan menyiapkan sumber blast."
        />

        <div className="info-banner info-banner-cyan">
          Admin membuat posting order per campaign, PIC mengerjakan queue berdasarkan unit, lalu hasil submission yang sudah di-approve bisa dijadikan blast target.
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search campaign..."
        />

        {campaignsQuery.isLoading ? (
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton" style={{ height: 190, borderRadius: 16 }} />
            ))}
          </div>
        ) : campaignsQuery.isError ? (
          <ErrorState
            title="Gagal memuat campaign"
            message={mapApiErrorToToastMessage(campaignsQuery.error)}
            retry={() => campaignsQuery.refetch()}
          />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={48} />}
            title="Belum ada campaign"
            description="Posting Bank mengikuti konteks campaign. Buat campaign dulu atau ubah kata pencarian."
          />
        ) : (
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{campaign.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Mulai {formatDate(campaign.startDate)}
                    </p>
                  </div>
                  <StatusBadge type="campaign" status={campaign.status} size="sm" />
                </div>

                {campaign.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.6 }}>
                    {campaign.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {campaign.platforms.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} size="sm" />
                  ))}
                </div>

                <div className="preview-card" style={{ display: 'grid', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers3 size={15} style={{ color: 'var(--status-expired)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      Posting order, review submission, dan konversi ke blast source dikelola di halaman campaign ini.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={15} style={{ color: 'var(--cyan)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      Gunakan jadwal posting untuk mengarahkan PIC sesuai target platform dan unit.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link href={`/campaigns/${campaign.id}/posting-bank`} className="btn-primary" style={{ textDecoration: 'none' }}>
                    Open Posting Bank
                  </Link>
                  <Link href={`/campaigns/${campaign.id}/blast-links/new`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                    Create Blast From PIC
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
