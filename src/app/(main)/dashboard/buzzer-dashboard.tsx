'use client'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { StatusBadge, PlatformBadge } from '@/components/ui/badges'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Activity, Clock, CheckCircle, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function BuzzerDashboard() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'buzzer'],
    queryFn: () => dashboardApi.getBuzzerDashboard(),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Selamat datang, {user?.name}. Berikut status aktivitas blast kamu hari ini.</p>
        </div>
        <Link href="/blast-queue" className="btn-primary">
          <Activity size={15} />
          Lihat Blast Queue
        </Link>
      </div>

      {/* KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : data ? (
          <>
            <MetricCard label="Available Blast Links" value={data.availableBlastLinks} icon={<Activity size={18} />} sparklineColor="var(--cyan)" />
            <MetricCard label="My Kept (In Progress)" value={data.myKept} icon={<Clock size={18} />} sparklineColor="var(--status-kept)" />
            <MetricCard label="Completed Today" value={data.completedToday} icon={<CheckCircle size={18} />} sparklineColor="var(--status-available)" />
            <MetricCard label="Pending Comment Tasks" value={data.pendingComments} icon={<MessageSquare size={18} />} sparklineColor="var(--violet)" />
          </>
        ) : null}
      </div>

      {/* My Kept Blasts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--status-kept)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>My Kept Blast</span>
            </div>
            <Link href="/my-blasts/kept" style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none' }}>View all</Link>
          </div>

          {!data?.myKeptAttempts?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <div>Tidak ada blast yang sedang di-keep.</div>
              <Link href="/blast-queue" style={{ color: 'var(--cyan)', fontSize: '0.8125rem', marginTop: '0.5rem', display: 'inline-block' }}>
                Cari blast tersedia →
              </Link>
            </div>
          ) : (
            data.myKeptAttempts.map(attempt => (
              <div key={attempt.id} className="card-elevated" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      {attempt.blastTarget && <PlatformBadge platform={attempt.blastTarget.platform} size="sm" />}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attempt #{attempt.attemptNo}</span>
                    </div>
                    <a href={attempt.blastTarget?.postUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {attempt.blastTarget?.postUrl.slice(0, 50)}...
                    </a>
                  </div>
                  <StatusBadge status="KEPT" type="attempt" size="sm" />
                </div>
                {attempt.keepExpiresAt && <CountdownTimer expiresAt={attempt.keepExpiresAt} />}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <Link href={`/blast-attempts/${attempt.id}/submit`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                    Submit Report
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pending Comment Tasks */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} style={{ color: 'var(--violet)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Comment Tasks</span>
            </div>
            <Link href="/comment-tasks" style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none' }}>View all</Link>
          </div>

          {!data?.pendingCommentTasks?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <div>Tidak ada comment task aktif.</div>
            </div>
          ) : (
            data.pendingCommentTasks.map(task => (
              <div key={task.id} className="card-elevated" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <StatusBadge status={task.status} type="task" size="sm" />
                  {task.command?.deadline && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Deadline: {new Date(task.command.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                  {task.command?.narrative.slice(0, 100)}...
                </p>
                <Link href={`/comment-tasks/${task.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none' }}>
                  Lihat detail <ArrowRight size={12} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
