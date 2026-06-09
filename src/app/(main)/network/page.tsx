'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, Eye, RadioTower, UserCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { ErrorState } from '@/components/ui/error-state'
import { RoleGuard } from '@/components/layout/role-guard'
import { RoleBadge } from '@/components/layout/role-badge'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import { usersApi } from '@/lib/api/users'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const tabs = [
  { label: 'Social Accounts', href: '/network/social-accounts' },
  { label: 'Members', href: '/network/members' },
]

export default function NetworkPage() {
  const { role, isInitialized } = useAuth()
  const canLoadNetwork = isInitialized && role === 'ADMIN'

  const socialAccountsTotalsQuery = useQuery({
    queryKey: ['social-accounts', 'counts'],
    queryFn: () => socialAccountsApi.list({ limit: 100 }),
    enabled: canLoadNetwork,
  })

  const socialAccountsRecentQuery = useQuery({
    queryKey: ['social-accounts', 'recent'],
    queryFn: () => socialAccountsApi.list({ limit: 4 }),
    enabled: canLoadNetwork,
  })

  const membersTotalsQuery = useQuery({
    queryKey: ['users', 'counts'],
    queryFn: () => usersApi.list({ limit: 100 }),
    enabled: canLoadNetwork,
  })

  const membersRecentQuery = useQuery({
    queryKey: ['users', 'recent'],
    queryFn: () => usersApi.list({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: canLoadNetwork,
  })

  const socialAccounts = socialAccountsTotalsQuery.data?.data ?? []
  const activeSocialAccounts = socialAccounts.filter((account) => account.status === 'ACTIVE').length

  const members = membersTotalsQuery.data?.items ?? []
  const activeBuzzers = members.filter((user) => user.role === 'BUZZER' && user.status === 'ACTIVE').length
  const activePics = members.filter((user) => user.role === 'PIC' && user.status === 'ACTIVE').length
  const viewers = members.filter((user) => user.role === 'VIEWER').length

  const loading =
    socialAccountsTotalsQuery.isLoading ||
    membersTotalsQuery.isLoading ||
    socialAccountsRecentQuery.isLoading ||
    membersRecentQuery.isLoading

  const combinedError =
    socialAccountsTotalsQuery.error ??
    membersTotalsQuery.error ??
    socialAccountsRecentQuery.error ??
    membersRecentQuery.error

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Network"
          subtitle="Kelola akun sumber postingan dan user internal."
          actions={
            <>
              <Link href="/network/social-accounts" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Open Social Accounts
              </Link>
              <Link href="/network/members/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                Add Member
              </Link>
            </>
          }
        />

        <div className="tabs-bar">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className="tab-btn" style={{ textDecoration: 'none' }}>
              {tab.label}
            </Link>
          ))}
        </div>

        {combinedError ? (
          <ErrorState
            title="Gagal memuat data network"
            message={mapApiErrorToToastMessage(combinedError)}
            retry={() => {
              socialAccountsTotalsQuery.refetch()
              membersTotalsQuery.refetch()
              socialAccountsRecentQuery.refetch()
              membersRecentQuery.refetch()
            }}
          />
        ) : (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
                <div className="kpi-v2-icon" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}><RadioTower size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Total Social Accounts</div>
                  <div className="kpi-v2-value">{loading ? '—' : socialAccountsTotalsQuery.data?.meta.total ?? socialAccounts.length}</div>
                </div>
              </div>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-active)' }}>
                <div className="kpi-v2-icon" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)' }}><Activity size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Active Social Accounts</div>
                  <div className="kpi-v2-value">{loading ? '—' : activeSocialAccounts}</div>
                </div>
              </div>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--violet)' }}>
                <div className="kpi-v2-icon" style={{ background: 'var(--violet-dim)', color: 'var(--violet)' }}><Users size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Total Members</div>
                  <div className="kpi-v2-value">{loading ? '—' : membersTotalsQuery.data?.meta.total ?? members.length}</div>
                </div>
              </div>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
                <div className="kpi-v2-icon" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}><UserCheck size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Active Buzzers</div>
                  <div className="kpi-v2-value">{loading ? '—' : activeBuzzers}</div>
                </div>
              </div>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-expired)' }}>
                <div className="kpi-v2-icon" style={{ background: 'color-mix(in srgb, var(--status-expired) 12%, transparent)', color: 'var(--status-expired)' }}><UserCheck size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Active PICs</div>
                  <div className="kpi-v2-value">{loading ? '—' : activePics}</div>
                </div>
              </div>
              <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-kept)' }}>
                <div className="kpi-v2-icon" style={{ background: 'var(--status-kept-bg)', color: 'var(--status-kept)' }}><Eye size={20} /></div>
                <div>
                  <div className="kpi-v2-label">Viewers</div>
                  <div className="kpi-v2-value">{loading ? '—' : viewers}</div>
                </div>
              </div>
            </div>

            <div className="info-banner info-banner-cyan">
              <RadioTower size={18} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Domain guard:</strong> Social Account admin tetap akun sumber postingan untuk blast/comment lama. PIC punya daftar akun sosmed sendiri untuk submit hasil posting bank konten. Members adalah akun login sistem dengan role ADMIN, BUZZER, PIC, atau VIEWER.
              </div>
            </div>

            <div className="two-col" style={{ alignItems: 'start' }}>
              <section className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Social Accounts</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Akun sumber postingan untuk blast dan comment.</p>
                  </div>
                  <Link href="/network/social-accounts" className="btn-ghost" style={{ textDecoration: 'none' }}>Open</Link>
                </div>
                {socialAccountsRecentQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: '0.5rem' }} />
                  ))
                ) : socialAccountsRecentQuery.isError ? (
                  <div className="preview-card" style={{ display: 'flex', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--status-expired)' }} />
                    <span>{mapApiErrorToToastMessage(socialAccountsRecentQuery.error)}</span>
                  </div>
                ) : !socialAccountsRecentQuery.data?.data.length ? (
                  <div className="preview-card" style={{ color: 'var(--text-muted)' }}>Belum ada social account.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {socialAccountsRecentQuery.data.data.slice(0, 4).map((account) => (
                      <div
                        key={account.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(7, 11, 20, 0.28)', border: '1px solid var(--border-subtle)', borderRadius: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <PlatformBadge platform={account.platform} size="sm" />
                            <SocialAccountUsernameLink account={account} style={{ fontWeight: 700 }} />
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {account.displayName ?? '—'} · {account.category}
                          </div>
                        </div>
                        <StatusBadge type="social" status={account.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Members</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>User internal yang dapat mengakses ROSS.</p>
                  </div>
                  <Link href="/network/members" className="btn-ghost" style={{ textDecoration: 'none' }}>Open</Link>
                </div>
                {membersRecentQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: '0.5rem' }} />
                  ))
                ) : membersRecentQuery.isError ? (
                  <div className="preview-card" style={{ display: 'flex', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--status-expired)' }} />
                    <span>{mapApiErrorToToastMessage(membersRecentQuery.error)}</span>
                  </div>
                ) : !membersRecentQuery.data?.items.length ? (
                  <div className="preview-card" style={{ color: 'var(--text-muted)' }}>Belum ada member internal.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {membersRecentQuery.data.items.slice(0, 4).map((user) => (
                      <div
                        key={user.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(7, 11, 20, 0.28)', border: '1px solid var(--border-subtle)', borderRadius: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {user.email} · Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <RoleBadge role={user.role} />
                          <StatusBadge type="user" status={user.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}
