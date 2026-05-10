'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function ReblastPage() {
  const { campaignId, targetId } = useParams<{ campaignId: string; targetId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [keepDuration, setKeepDuration] = useState(120)

  const mutation = useMutation({
    mutationFn: () => blastApi.createReblast(campaignId, targetId),
    onSuccess: () => { toast.success('Reblast attempt berhasil dibuat!'); qc.invalidateQueries({ queryKey: ['blast-target', campaignId, targetId] }); router.push(`/campaigns/${campaignId}/blast-links/${targetId}`) },
    onError: () => toast.error('Gagal membuat reblast.'),
  })

  return (
    <div className="page-container">
      <PageHeader title="Create Reblast" subtitle="Buat attempt baru untuk blast target yang sudah completed" backHref={`/campaigns/${campaignId}/blast-links/${targetId}`} />
      <div className="card" style={{ padding: '1.5rem', maxWidth: 480 }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Reblast akan membuat blast attempt baru untuk target yang sudah completed. Attempt lama tetap tersimpan beserta report-nya.
        </p>
        <Input label="Keep Duration (menit)" type="number" value={keepDuration} onChange={e => setKeepDuration(Number(e.target.value))} hint="Durasi waktu yang diberikan ke buzzer untuk menyelesaikan blast." />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} icon={<RefreshCw size={14} />}>Create Reblast</Button>
        </div>
      </div>
    </div>
  )
}
