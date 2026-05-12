'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, Eye, Plus, Shield, UserCheck, UserMinus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { DataFilters } from '@/components/ui/data-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { RoleGuard } from '@/components/layout/role-guard'
import { RoleBadge } from '@/components/layout/role-badge'
import { StatusBadge } from '@/components/ui/badges'
import { usersApi } from '@/lib/api/users'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { useAuth } from '@/hooks/use-auth'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types'

export default function NetworkMembersPage() {
  const { user: currentUser, role, isInitialized } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const canLoadMembers = isInitialized && role === 'ADMIN'

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  const membersQuery = useQuery({
    queryKey: ['users', { search, roleFilter, statusFilter, page, limit }],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: (roleFilter || undefined) as UserRole | undefined,
        status: (statusFilter || undefined) as UserStatus | undefined,
        page,
        limit,
      }),
    enabled: canLoadMembers,
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      usersApi.updateStatus(userId, { status }),
    onSuccess: (_user, variables) => {
      toast.success(variables.status === 'ACTIVE' ? 'Member diaktifkan.' : 'Member di-nonaktifkan.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const users = membersQuery.data?.items ?? []
  const meta = membersQuery.data?.meta
  const total = meta?.total ?? users.length

  const kpis = [
    { label: 'Total Members', value: total, accent: 'var(--cyan)', icon: <Users size={20} /> },
    { label: 'Admins', value: users.filter((u) => u.role === 'ADMIN').length, accent: 'var(--violet)', icon: <Shield size={20} /> },
    { label: 'Buzzers', value: users.filter((u) => u.role === 'BUZZER').length, accent: 'var(--cyan)', icon: <UserCheck size={20} /> },
    { label: 'Viewers', value: users.filter((u) => u.role === 'VIEWER').length, accent: 'var(--status-kept)', icon: <Eye size={20} /> },
    { label: 'Inactive Users', value: users.filter((u) => u.status === 'INACTIVE').length, accent: 'var(--status-expired)', icon: <UserMinus size={20} /> },
  ]

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="page-container">
        <PageHeader
          title="Members"
          subtitle="Kelola user internal yang dapat mengakses ROSS."
          actions={
            <Link href="/network/members/new" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={14} /> Add Member
            </Link>
          }
        />

        <div className="tabs-bar">
          <Link href="/network/social-accounts" className="tab-btn" style={{ textDecoration: 'none' }}>Social Accounts</Link>
          <Link href="/network/members" className="tab-btn active" style={{ textDecoration: 'none' }}>Members</Link>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-v2" style={{ borderLeftColor: kpi.accent }}>
              <div className="kpi-v2-icon" style={{ background: 'var(--bg-elevated)', color: kpi.accent }}>{kpi.icon}</div>
              <div>
                <div className="kpi-v2-label">{kpi.label}</div>
                <div className="kpi-v2-value">{membersQuery.isLoading ? '—' : kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        <DataFilters
          search={search}
          onSearchChange={setSearch}
          placeholder="Search name/email..."
          filters={[
            {
              label: 'Role',
              value: roleFilter,
              options: [
                { value: 'ADMIN', label: 'Admin' },
                { value: 'BUZZER', label: 'Buzzer' },
                { value: 'VIEWER', label: 'Viewer' },
              ],
              onChange: setRoleFilter,
            },
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />

        {membersQuery.isLoading ? (
          <div className="data-table-container" aria-busy="true">
            <div style={{ padding: '1.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 28, marginBottom: '0.75rem' }} />
              ))}
            </div>
          </div>
        ) : membersQuery.isError ? (
          <ErrorState
            title="Gagal memuat members"
            message={mapApiErrorToToastMessage(membersQuery.error)}
            retry={() => membersQuery.refetch()}
          />
        ) : !users.length ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No members found"
            description="Adjust filters or add a new internal user."
            action={
              <Link href="/network/members/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                <Plus size={14} /> Add Member
              </Link>
            }
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Campaigns</th>
                  <th>Last Login</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = currentUser?.id === user.id
                  const isStatusLoading = statusMutation.isPending && statusMutation.variables?.userId === user.id
                  const statusDisabled = isSelf || isStatusLoading
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 180 }}>
                          <div className="mini-avatar">{user.name.charAt(0)}</div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{user.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td><StatusBadge type="user" status={user.status} size="sm" /></td>
                      <td>{user.campaignCount ?? 0}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-row" style={{ justifyContent: 'flex-start' }}>
                          <Link href={`/network/members/${user.id}`} className="icon-action" style={{ textDecoration: 'none' }}>
                            <Eye size={13} /> View Detail
                          </Link>
                          <Link href={`/network/members/${user.id}`} className="icon-action" style={{ textDecoration: 'none' }}>
                            <Edit2 size={13} /> Edit
                          </Link>
                          {user.status === 'INACTIVE' ? (
                            <button
                              type="button"
                              className="icon-action"
                              disabled={statusDisabled}
                              title={isSelf ? 'Admin tidak dapat mengubah status dirinya sendiri.' : undefined}
                              onClick={() => statusMutation.mutate({ userId: user.id, status: 'ACTIVE' })}
                            >
                              {isStatusLoading ? <span className="spinner" /> : <UserCheck size={13} />} Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="icon-action danger"
                              disabled={statusDisabled}
                              title={isSelf ? 'Admin tidak dapat menonaktifkan dirinya sendiri.' : undefined}
                              onClick={() => statusMutation.mutate({ userId: user.id, status: 'INACTIVE' })}
                            >
                              {isStatusLoading ? <span className="spinner" /> : <UserMinus size={13} />} Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="pagination-footer">
              <span>Showing {users.length} of {total} members</span>
              <span>Users are system login accounts. Social Accounts are separate posting sources.</span>
            </div>
            <PaginationControls
              meta={meta}
              pageSize={limit}
              itemLabel="members"
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
