import Link from 'next/link'
import { ExternalLink, MessageCircle } from 'lucide-react'
import { PlatformBadge, StatusBadge, StanceBadge } from '@/components/ui/badges'
import { formatDate } from '@/lib/utils'
import type { CommentTask } from '@/types'

export function CommentTaskDetail({ task, showSubmit = true }: { task: CommentTask; showSubmit?: boolean }) {
  const command = task.command
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {command && <PlatformBadge platform={command.platform} />}
          {command && <StanceBadge stance={command.stance} />}
          <StatusBadge status={task.status} type="task" />
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="kpi-v2-label">Target Post URL</div>
          <a href={command?.targetPostUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: '100%' }}>
            {command?.targetPostUrl} <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 10, borderLeft: '3px solid var(--cyan)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <MessageCircle size={14} style={{ color: 'var(--cyan)' }} />
            <strong>Narrative</strong>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{command?.narrative}</p>
        </div>
        {command?.instruction && (
          <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div className="kpi-v2-label">Instruction</div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{command.instruction}</p>
          </div>
        )}
      </div>
      <aside className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <div className="kpi-v2-label">Deadline</div>
            <div>{command?.deadline ? formatDate(command.deadline) : '-'}</div>
          </div>
          <div>
            <div className="kpi-v2-label">Kept By</div>
            <div>{task.keptByUser?.name ?? '-'}</div>
          </div>
          <div>
            <div className="kpi-v2-label">Proof Link</div>
            {task.proofLink ? <a href={task.proofLink} className="ext-link">Open Proof</a> : <div>-</div>}
          </div>
          {showSubmit && task.status !== 'COMPLETED' && (
            <Link href={`/comment-tasks/${task.id}/submit`} className="btn-primary" style={{ justifyContent: 'center' }}>
              Submit Proof
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}
