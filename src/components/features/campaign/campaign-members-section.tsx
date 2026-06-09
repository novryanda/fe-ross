'use client'

import { Eye, Plus, Shield, Trash2, UserCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MockMember } from './enterprise-campaign-form'

function memberInitials(name: string) {
  return name.split(' ').map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase()
}

type MemberRole = 'ADMIN' | 'BUZZER' | 'PIC' | 'VIEWER'

interface CampaignMembersSectionProps {
  stepNumber?: number
  admins: MockMember[]
  buzzers: MockMember[]
  pics: MockMember[]
  viewers: MockMember[]
  membersLoading?: boolean
  onAddMember: () => void
  onRemoveAdmin: (id: string) => void
  onRemoveBuzzer: (id: string) => void
  onRemovePic: (id: string) => void
  onRemoveViewer: (id: string) => void
  lockedAdminIds?: string[]
}

const ROLE_CONFIG: Record<MemberRole, {
  statLabel: string
  groupTitle: string
  groupSubtitle: string
  accessLabel: string
  badgeLabel: string
  icon: typeof Shield
}> = {
  ADMIN: {
    statLabel: 'Admin',
    groupTitle: 'Required role',
    groupSubtitle: 'Must have at least 1 admin',
    accessLabel: 'Full campaign access',
    badgeLabel: 'ADMIN',
    icon: Shield,
  },
  BUZZER: {
    statLabel: 'Buzzers',
    groupTitle: 'Buzzers',
    groupSubtitle: 'Blast link opens automatically for this role',
    accessLabel: 'Receives blast link',
    badgeLabel: 'BUZZER',
    icon: Users,
  },
  PIC: {
    statLabel: 'PICs',
    groupTitle: 'PICs',
    groupSubtitle: 'Posting orders in this campaign open for their PIC unit',
    accessLabel: 'Posting bank & queue access',
    badgeLabel: 'PIC',
    icon: UserCheck,
  },
  VIEWER: {
    statLabel: 'Viewers',
    groupTitle: 'Viewers',
    groupSubtitle: 'Can view campaign details only',
    accessLabel: 'Read-only access',
    badgeLabel: 'VIEWER',
    icon: Eye,
  },
}

function MemberRow({
  user,
  role,
  onRemove,
  locked,
}: {
  user: MockMember
  role: MemberRole
  onRemove: (id: string) => void
  locked?: boolean
}) {
  const config = ROLE_CONFIG[role]

  return (
    <div className={`campaign-member-row campaign-member-row--${role.toLowerCase()}`}>
      <div className={`campaign-member-avatar campaign-member-avatar--${role.toLowerCase()}`}>
        {memberInitials(user.name)}
      </div>
      <div className="campaign-member-info">
        <div className="campaign-member-name">{user.name}</div>
        <div className="campaign-member-access">{config.accessLabel}</div>
      </div>
      <span className={`campaign-member-badge campaign-member-badge--${role.toLowerCase()}`}>
        {config.badgeLabel}
      </span>
      {!locked && (
        <button
          type="button"
          className="campaign-member-remove"
          onClick={() => onRemove(user.id)}
          title="Remove member"
          aria-label={`Remove ${user.name}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

function RoleGroup({
  role,
  users,
  onRemove,
  lockedMemberIds,
}: {
  role: MemberRole
  users: MockMember[]
  onRemove: (id: string) => void
  lockedMemberIds?: string[]
}) {
  const config = ROLE_CONFIG[role]
  const Icon = config.icon

  return (
    <div className={`campaign-member-group campaign-member-group--${role.toLowerCase()}`}>
      <div className="campaign-member-group-header">
        <div className={`campaign-member-group-icon campaign-member-group-icon--${role.toLowerCase()}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="campaign-member-group-title">{config.groupTitle}</div>
          <div className="campaign-member-group-subtitle">{config.groupSubtitle}</div>
        </div>
      </div>
      <div className="campaign-member-group-list">
        {users.length === 0 ? (
          <div className="campaign-member-empty">Belum ada member</div>
        ) : (
          users.map(user => (
            <MemberRow
              key={user.id}
              user={user}
              role={role}
              onRemove={onRemove}
              locked={lockedMemberIds?.includes(user.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function CampaignMembersSection({
  stepNumber = 5,
  admins,
  buzzers,
  pics,
  viewers,
  membersLoading,
  onAddMember,
  onRemoveAdmin,
  onRemoveBuzzer,
  onRemovePic,
  onRemoveViewer,
  lockedAdminIds,
}: CampaignMembersSectionProps) {
  const totalMembers = admins.length + buzzers.length + pics.length + viewers.length
  const stats: { role: MemberRole; count: number }[] = [
    { role: 'ADMIN', count: admins.length },
    { role: 'BUZZER', count: buzzers.length },
    { role: 'PIC', count: pics.length },
    { role: 'VIEWER', count: viewers.length },
  ]

  return (
    <div className="campaign-members-section">
      <div className="campaign-members-header">
        <div>
          <span className="campaign-members-step">Step {stepNumber}</span>
          <h3 className="campaign-members-title">Campaign Members</h3>
          <p className="campaign-members-subtitle">
            {totalMembers} assigned member{totalMembers === 1 ? '' : 's'}. Buzzers receive blast links; PICs receive posting orders for their unit in this campaign.
          </p>
        </div>
        <Button type="button" size="sm" onClick={onAddMember} icon={<Plus size={14} />}>
          Add Member
        </Button>
      </div>

      {membersLoading && <p className="muted-meta" style={{ marginBottom: '0.85rem' }}>Memuat user aktif...</p>}

      <div className="campaign-members-stats">
        {stats.map(({ role, count }) => {
          const config = ROLE_CONFIG[role]
          const Icon = config.icon
          return (
            <div key={role} className={`campaign-members-stat campaign-members-stat--${role.toLowerCase()}`}>
              <Icon size={15} />
              <span className="campaign-members-stat-label">{config.statLabel}</span>
              <span className="campaign-members-stat-count">{count}</span>
            </div>
          )
        })}
      </div>

      {totalMembers === 0 && !membersLoading ? (
        <div className="campaign-members-empty-state">
          <Users size={32} />
          <p>Belum ada member dipilih. Klik Add Member untuk menambahkan user.</p>
          <Button type="button" onClick={onAddMember} icon={<Plus size={16} />}>Add Member</Button>
        </div>
      ) : (
        <div className="campaign-member-groups">
          <RoleGroup role="ADMIN" users={admins} onRemove={onRemoveAdmin} lockedMemberIds={lockedAdminIds} />
          <RoleGroup role="BUZZER" users={buzzers} onRemove={onRemoveBuzzer} />
          <RoleGroup role="PIC" users={pics} onRemove={onRemovePic} />
          <RoleGroup role="VIEWER" users={viewers} onRemove={onRemoveViewer} />
        </div>
      )}
    </div>
  )
}
