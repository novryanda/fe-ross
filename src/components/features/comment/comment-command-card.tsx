import type { CommentCommand } from '@/types'
import { getStanceConfig, formatDate, formatRelativeTime } from '@/lib/utils'
import { getPlatformLabel } from '@/lib/utils'
import { MessageCircle, Users, ExternalLink, Clock } from 'lucide-react'
import { StanceBadge } from './stance-badge'

export function CommentCommandCard({ command, onClick }: { command: CommentCommand; onClick?: () => void }) {
  const progress = command.totalTasks ? ((command.completedTasks ?? 0) / command.totalTasks) * 100 : 0

  return (
    <div className="card" style={{ padding: '1rem', cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StanceBadge stance={command.stance} />
          <span className={`platform-badge platform-${command.platform.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
            {getPlatformLabel(command.platform)}
          </span>
        </div>
        {command.deadline && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Clock size={11} /> {formatDate(command.deadline)}
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.625rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {command.narrative}
      </p>

      <a href={command.targetPostUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--cyan)', textDecoration: 'none', marginBottom: '0.625rem' }}>
        <ExternalLink size={10} /> Target Post
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, height: 3, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: command.stance === 'PRO' ? 'var(--stance-pro)' : 'var(--stance-kontra)', borderRadius: 99 }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <Users size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {command.completedTasks ?? 0}/{command.totalTasks ?? 0}
        </span>
      </div>
    </div>
  )
}
