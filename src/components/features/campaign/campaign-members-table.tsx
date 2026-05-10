import { formatDate } from '@/lib/utils'
import type { CampaignMember } from '@/types'

export function CampaignMembersTable({ members, onRemove, removingUserId }: { members: CampaignMember[]; onRemove?: (member: CampaignMember) => void; removingUserId?: string }) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Campaign Role</th>
            <th>Joined</th>
            {onRemove && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.user?.name ?? member.userId}</td>
              <td>{member.user?.email ?? '-'}</td>
              <td>{member.user?.role ?? '-'}</td>
              <td>{member.roleInCampaign ?? '-'}</td>
              <td>{formatDate(member.createdAt)}</td>
              {onRemove && (
                <td>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={removingUserId === member.userId}
                    onClick={() => onRemove(member)}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', opacity: removingUserId === member.userId ? 0.7 : undefined }}
                  >
                    {removingUserId === member.userId ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
