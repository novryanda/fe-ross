import type { CommentTask } from '@/types'
import { getCommentTaskStatusConfig, formatRelativeTime } from '@/lib/utils'
import { StanceBadge } from './stance-badge'
import { ExternalLink, User, CheckCircle2, Eye } from 'lucide-react'
import Link from 'next/link'

export function CommentTaskCard({ task, showActions = false }: { task: CommentTask; showActions?: boolean }) {
  const sc = getCommentTaskStatusConfig(task.status)
  const cmd = task.command

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {cmd && <StanceBadge stance={cmd.stance} />}
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(task.createdAt)}</span>
      </div>

      {cmd && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {cmd.narrative}
        </p>
      )}

      {task.keptByUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          <User size={12} /> {task.keptByUser.name}
        </div>
      )}

      {task.proofLink && (
        <a href={task.proofLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--cyan)', textDecoration: 'none', marginBottom: '0.5rem' }}>
          <ExternalLink size={10} /> Lihat Proof
        </a>
      )}

      {showActions && task.status !== 'COMPLETED' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
          <Link href={`/comment-tasks/${task.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', textDecoration: 'none' }}>
            <Eye size={12} /> Detail
          </Link>
          <Link href={`/comment-tasks/${task.id}/submit`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', textDecoration: 'none' }}>
            <CheckCircle2 size={12} /> Submit Proof
          </Link>
        </div>
      )}
    </div>
  )
}
