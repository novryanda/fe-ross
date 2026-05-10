'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { BlastAttemptCard } from '@/components/features/blast/blast-attempt-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuth } from '@/hooks/use-auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { Zap, Clock, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function MyBlastsPage() {
  const [tab, setTab] = useState('kept')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: attempts, isLoading, isError, error } = useQuery({
    queryKey: ['my-blasts', user?.id],
    queryFn: () => blastApi.getMyAttempts(user!.id),
    enabled: !!user,
  })

  const releaseMutation = useMutation({
    mutationFn: (attemptId: string) => blastApi.releaseAttempt(attemptId),
    onSuccess: () => {
      toast.success('Blast attempt dilepas.')
      queryClient.invalidateQueries({ queryKey: ['my-blasts'] })
      queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
    },
    onError: (err) => toast.error(mapApiErrorToToastMessage(err)),
  })

  const keptAttempts = attempts?.filter(a => a.status === 'KEPT') ?? []
  const finishedAttempts = attempts?.filter(a => a.status === 'COMPLETED') ?? []
  const expiredAttempts = attempts?.filter(a => a.status === 'EXPIRED') ?? []
  const releasedAttempts = attempts?.filter(a => a.status === 'RELEASED') ?? []

  const tabs = [
    { id: 'kept', label: 'Sedang Dikerjakan', icon: <Clock size={13} />, count: keptAttempts.length },
    { id: 'completed', label: 'Selesai', icon: <CheckCircle2 size={13} />, count: finishedAttempts.length },
    { id: 'expired', label: 'Expired', icon: <Clock size={13} />, count: expiredAttempts.length },
    { id: 'released', label: 'Released', icon: <RotateCcw size={13} />, count: releasedAttempts.length },
  ]

  return (
    <RoleGuard roles={['BUZZER']}>
    <div className="page-container">
      <PageHeader title="My Blasts" subtitle="Kelola blast yang sedang dan sudah Anda kerjakan" />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
          <Skeleton height={220} />
          <Skeleton height={220} />
          <Skeleton height={220} />
        </div>
      ) : isError ? (
        <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat My Blasts" description={mapApiErrorToToastMessage(error)} />
      ) : (
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab}>
        {tab === 'kept' && (
          !keptAttempts.length ? (
            <EmptyState icon={<Clock size={48} />} title="Tidak ada blast aktif" description="Ambil blast baru dari Blast Queue." action={<Link href="/blast-queue" className="btn-primary" style={{ textDecoration: 'none' }}><Zap size={14} /> Ke Blast Queue</Link>} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {keptAttempts.map(a => (
                <div key={a.id} style={{ display: 'grid', gap: '0.6rem' }}>
                  <BlastAttemptCard attempt={a} showAction={false} />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" loading={releaseMutation.isPending && releaseMutation.variables === a.id} onClick={() => releaseMutation.mutate(a.id)}>
                      Release
                    </Button>
                    <Link href={`/my-blasts/${a.id}/submit`} className="btn-primary" style={{ textDecoration: 'none' }}>
                      Submit Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'completed' && (
          !finishedAttempts.length ? (
            <EmptyState icon={<CheckCircle2 size={48} />} title="Belum ada blast selesai" description="Blast yang Anda selesaikan akan muncul di sini." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {finishedAttempts.map(a => <BlastAttemptCard key={a.id} attempt={a} showAction={false} />)}
            </div>
          )
        )}

        {tab === 'expired' && (
          !expiredAttempts.length ? (
            <EmptyState icon={<Clock size={48} />} title="Tidak ada keep expired" description="Attempt expired milik Anda akan muncul di sini." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {expiredAttempts.map(a => <BlastAttemptCard key={a.id} attempt={a} showAction={false} />)}
            </div>
          )
        )}

        {tab === 'released' && (
          !releasedAttempts.length ? (
            <EmptyState icon={<RotateCcw size={48} />} title="Tidak ada blast released" description="Attempt yang dilepas akan muncul di sini jika backend menyediakan history tersebut." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {releasedAttempts.map(a => <BlastAttemptCard key={a.id} attempt={a} showAction={false} />)}
            </div>
          )
        )}
      </Tabs>
      )}
    </div>
    </RoleGuard>
  )
}
