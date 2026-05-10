'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { useAuthStore } from '@/stores/auth-store'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { EmptyState } from '@/components/ui/empty-state'
import { RoleGuard } from '@/components/layout/role-guard'
import { formatDate } from '@/lib/utils'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Activity, Globe, ExternalLink, Zap, AlertCircle } from 'lucide-react'
import type { BlastAttempt } from '@/types'
import { ApiClientError } from '@/lib/api/client'

export default function BlastQueuePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: queue, isLoading, isError, error } = useQuery({
    queryKey: ['blast-queue'],
    queryFn: () => blastApi.getQueue(),
    refetchInterval: 30_000, // Poll every 30s
  })

  const keepMutation = useMutation({
    mutationFn: (attemptId: string) => blastApi.keepAttempt(attemptId, user!.id),
    onSuccess: (attempt) => {
      toast.success(`Berhasil keep blast! Segera submit sebelum expire.`)
      queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      queryClient.invalidateQueries({ queryKey: ['my-blasts'] })
      router.push(`/my-blasts/${attempt.id}/submit`)
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === 'ATTEMPT_ALREADY_KEPT') {
        toast.error('Blast ini sudah diambil oleh buzzer lain. Refresh halaman untuk update terbaru.')
        queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      } else if (err instanceof ApiClientError && (err.code === 'ATTEMPT_NOT_AVAILABLE' || err.code === 'ATTEMPT_NOT_ELIGIBLE')) {
        toast.error('Blast ini sudah tidak tersedia. Queue akan diperbarui.')
        queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      } else {
        toast.error(mapApiErrorToToastMessage(err))
      }
    },
  })

  return (
    <RoleGuard roles={['BUZZER']}>
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Blast Queue</h1>
          <p className="page-subtitle">Daftar blast link yang tersedia untuk dikerjakan. Klik Keep untuk mengunci blast.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <div className="dot-pulse" />
          Live · refresh otomatis setiap 30 detik
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'var(--cyan-dim)', border: '1px solid var(--border-accent)',
        borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontSize: '0.8125rem', color: 'var(--text-primary)',
      }}>
        <AlertCircle size={16} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
        <span>Satu blast hanya bisa dikerjakan oleh 1 buzzer. Setelah keep, kamu punya waktu <strong>2 jam</strong> untuk submit report. Jika tidak, blast akan dirilis kembali.</span>
      </div>

      {/* Queue */}
      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
              <div className="skeleton" style={{ height: 16, width: '30%' }} />
              <div className="skeleton" style={{ height: 16, width: '40%' }} />
              <div className="skeleton" style={{ height: 16, width: '20%' }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={<AlertCircle size={48} />} title="Gagal memuat Blast Queue" description={mapApiErrorToToastMessage(error)} />
      ) : !queue?.length ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Activity size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Blast Queue Kosong</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada blast link yang tersedia saat ini. Cek kembali nanti.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th>Source Account</th>
                <th>Post URL</th>
                <th>Attempt #</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((attempt: BlastAttempt) => (
                <tr key={attempt.id}>
                  <td>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {attempt.blastTarget?.campaign?.name ?? `Campaign ${attempt.blastTarget?.campaignId?.slice(0, 6)}`}
                    </div>
                  </td>
                  <td>
                    {attempt.blastTarget && <PlatformBadge platform={attempt.blastTarget.platform} size="sm" />}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      @{attempt.blastTarget?.socialAccount?.username ?? '—'}
                    </div>
                  </td>
                  <td>
                    <a
                      href={attempt.blastTarget?.postUrl}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--cyan)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <Globe size={12} />
                      {attempt.blastTarget?.postUrl.replace('https://', '')}
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{attempt.attemptNo}</span>
                  </td>
                  <td>
                    <StatusBadge status={attempt.status} type="attempt" size="sm" />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(attempt.createdAt)}
                    </span>
                  </td>
                  <td>
                    {attempt.status === 'AVAILABLE' ? (
                      <button
                        id={`keep-btn-${attempt.id}`}
                        onClick={() => keepMutation.mutate(attempt.id)}
                        disabled={keepMutation.isPending}
                        className="btn-primary"
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}
                      >
                        <Zap size={13} />
                        {keepMutation.isPending && keepMutation.variables === attempt.id ? 'Keeping...' : 'Keep'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak tersedia</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </RoleGuard>
  )
}
