import type { SocialAccount } from '@/types'
import { getPlatformLabel } from '@/lib/utils'
import { Target } from 'lucide-react'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'

export function SocialAccountCard({ account, onEdit, onDelete }: { account: SocialAccount; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className={`platform-badge platform-${account.platform.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
              {getPlatformLabel(account.platform)}
            </span>
            <span style={{ padding: '0.1rem 0.35rem', borderRadius: 99, fontSize: '0.6rem', fontWeight: 600, background: account.status === 'ACTIVE' ? 'var(--status-available-bg)' : 'var(--status-cancelled-bg)', color: account.status === 'ACTIVE' ? 'var(--status-available)' : 'var(--text-muted)' }}>
              {account.status}
            </span>
          </div>
          <SocialAccountUsernameLink account={account} style={{ fontSize: '0.9375rem', fontWeight: 600 }} />
          {account.displayName && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{account.displayName}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {onEdit && <button onClick={onEdit} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Edit</button>}
          {onDelete && <button onClick={onDelete} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'var(--status-expired)' }}>Delete</button>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Target size={11} /> {account.blastTargetCount ?? 0} targets</span>
        <span style={{ padding: '0.1rem 0.375rem', background: 'var(--bg-primary)', borderRadius: 4, fontSize: '0.65rem' }}>{account.category}</span>
      </div>
    </div>
  )
}
