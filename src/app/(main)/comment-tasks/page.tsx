'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, MessageCircle, RadioTower, RotateCcw, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs } from '@/components/ui/tabs'
import { PlatformBadge, StanceBadge, StatusBadge } from '@/components/ui/badges'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuth } from '@/hooks/use-auth'
import { commentTasksApi } from '@/lib/api/comment-commands'
import { isApiError, mapApiErrorToToastMessage } from '@/lib/api/errors'
import { formatDate } from '@/lib/utils'
import type { CommentTask } from '@/types'
import { toast } from 'sonner'

export default function CommentTasksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('available')

  const queueQuery = useQuery({ queryKey: ['buzzer-comment-queue'], queryFn: () => commentTasksApi.getCommentQueue() })
  const myTasksQuery = useQuery({ queryKey: ['buzzer-comment-tasks'], queryFn: () => commentTasksApi.getMyCommentTasks({}, user?.id), enabled: Boolean(user?.id) })

  const keepMutation = useMutation({
    mutationFn: (taskId: string) => commentTasksApi.keep(taskId, {}, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'buzzer'] })
      toast.success('Comment slot berhasil di-keep.')
      setTab('mine')
    },
    onError: (error) => {
      if (isApiError(error) && ['COMMENT_TASK_ALREADY_KEPT', 'COMMENT_TASK_NOT_AVAILABLE', 'CONFLICT'].includes(error.code)) {
        toast.error('Comment slot sudah tidak tersedia. Queue diperbarui.')
        queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
        return
      }
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const releaseMutation = useMutation({
    mutationFn: (taskId: string) => commentTasksApi.release(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-queue'] })
      queryClient.invalidateQueries({ queryKey: ['buzzer-comment-tasks'] })
      toast.success('Comment task dilepas kembali ke queue.')
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const available = queueQuery.data ?? []
  const myTasks = myTasksQuery.data ?? []
  const completed = myTasks.filter(task => task.status === 'COMPLETED')
  const tabs = [
    { id: 'available', label: 'Available Queue', count: available.length },
    { id: 'mine', label: 'My Kept Tasks', count: myTasks.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ]
  const display = tab === 'available' ? available : tab === 'mine' ? myTasks : completed
  const isLoading = queueQuery.isLoading || myTasksQuery.isLoading
  const error = queueQuery.error ?? myTasksQuery.error

  return (
    <RoleGuard roles={['BUZZER']}>
      <div className="page-container">
        <PageHeader title="Comment Tasks" subtitle="Available queue dan comment slot yang sudah Anda Keep." />

        {isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        ) : error ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat comment tasks" description={mapApiErrorToToastMessage(error)} />
        ) : (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <Kpi label="Available Comment Queue" value={available.length} icon={<RadioTower size={20} />} color="var(--status-available)" />
              <Kpi label="My Kept Comment Tasks" value={myTasks.length} icon={<ShieldCheck size={20} />} color="var(--status-kept)" />
              <Kpi label="Completed" value={completed.length} icon={<CheckCircle2 size={20} />} color="var(--status-completed)" />
            </div>

            <Tabs tabs={tabs} activeTab={tab} onChange={setTab}>
              {!display.length ? (
                <EmptyState icon={<MessageCircle size={48} />} title={tab === 'available' ? 'Tidak ada slot tersedia' : tab === 'mine' ? 'Belum ada task yang di-keep' : 'Belum ada task completed'} description={tab === 'available' ? 'Slot baru muncul saat Admin mengaktifkan comment command.' : 'Ambil slot dari Available Queue untuk mulai komentar.'} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '0.85rem' }}>
                  {display.map(task => (
                    <BuzzerCommentTaskCard
                      key={task.id}
                      task={task}
                      currentTab={tab}
                      onKeep={() => keepMutation.mutate(task.id)}
                      onRelease={() => releaseMutation.mutate(task.id)}
                      keepLoading={keepMutation.isPending && keepMutation.variables === task.id}
                      releaseLoading={releaseMutation.isPending && releaseMutation.variables === task.id}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
            </Tabs>
          </>
        )}
      </div>
    </RoleGuard>
  )
}

function BuzzerCommentTaskCard({
  task,
  currentTab,
  onKeep,
  onRelease,
  keepLoading,
  releaseLoading,
  currentUserId,
}: {
  task: CommentTask
  currentTab: string
  onKeep: () => void
  onRelease: () => void
  keepLoading: boolean
  releaseLoading: boolean
  currentUserId?: string
}) {
  const command = task.command
  const canSubmit = task.keptBy === currentUserId && ['KEPT', 'IN_PROGRESS'].includes(task.status)
  const canRelease = task.keptBy === currentUserId && ['KEPT', 'IN_PROGRESS'].includes(task.status)
  return (
    <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {command && <StanceBadge stance={command.stance} size="sm" />}
          {command && <PlatformBadge platform={command.platform} size="sm" />}
          <StatusBadge status={task.status} type="task" size="sm" />
        </div>
        <span className="muted-meta">Slot #{task.taskNo}</span>
      </div>
      <div>
        <div className="summary-label">Campaign</div>
        <div style={{ fontWeight: 850 }}>{command?.campaign?.name ?? '-'}</div>
      </div>
      <div>
        <div className="summary-label">Target Post URL</div>
        {command?.targetPostUrl ? <a href={command.targetPostUrl} target="_blank" rel="noopener noreferrer" className="ext-link" style={{ maxWidth: '100%' }}>{command.targetPostUrl} <ExternalLink size={10} /></a> : '-'}
      </div>
      <div style={{ padding: '0.9rem', background: 'var(--bg-elevated)', borderRadius: 10, borderLeft: '3px solid var(--cyan)' }}>
        <div style={{ fontWeight: 850, marginBottom: '0.35rem' }}>Narrative</div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{command?.narrative}</p>
      </div>
      {command?.instruction && <p className="muted-meta" style={{ margin: 0 }}><strong>Instruction:</strong> {command.instruction}</p>}
      <div className="muted-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={12} /> Deadline: {command?.deadline ? formatDate(command.deadline) : '-'}
      </div>
      <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {currentTab === 'available' ? (
          <button className="btn-primary" disabled={keepLoading} onClick={onKeep}><ShieldCheck size={14} /> {keepLoading ? 'Keeping...' : 'Keep'}</button>
        ) : (
          <>
            <Link href={`/comment-tasks/${task.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>Detail</Link>
            {canRelease && <button className="btn-secondary" disabled={releaseLoading} onClick={onRelease}><RotateCcw size={14} /> {releaseLoading ? 'Releasing...' : 'Release'}</button>}
            {canSubmit && <Link href={`/comment-tasks/${task.id}/submit`} className="btn-primary" style={{ textDecoration: 'none' }}>Submit Proof</Link>}
            {task.status === 'COMPLETED' && <Link href={`/comment-tasks/${task.id}/submit`} className="btn-secondary" style={{ textDecoration: 'none' }}>View Submission</Link>}
          </>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
  return (
    <div className="kpi-v2" style={{ borderLeftColor: color }}>
      <div className="kpi-v2-icon" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>{icon}</div>
      <div><div className="kpi-v2-label">{label}</div><div className="kpi-v2-value">{value}</div></div>
    </div>
  )
}
