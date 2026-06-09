'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { blastApi } from '@/lib/api/blast'
import { useAuthStore } from '@/stores/auth-store'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { SocialAccountUsernameLink } from '@/components/features/social-account/social-account-username-link'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleGuard } from '@/components/layout/role-guard'
import { isGoogleDriveUrl, isValidUrl, formatNumber } from '@/lib/utils'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { toast } from 'sonner'
import { Eye, Heart, MessageCircle, Share2, Repeat2, Link2, AlertTriangle, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { SubmitBlastReportForm } from '@/types'
import { ApiClientError } from '@/lib/api/client'

const DEFAULT_FORM: SubmitBlastReportForm = {
  views: 0, likes: 0, comments: 0, shares: 0, reposts: 0, proofLink: '', notes: '',
}

const METRIC_FIELDS = [
  { key: 'views', label: 'Views', icon: Eye, color: 'var(--cyan)' },
  { key: 'likes', label: 'Likes', icon: Heart, color: '#e040fb' },
  { key: 'comments', label: 'Comments', icon: MessageCircle, color: 'var(--violet)' },
  { key: 'shares', label: 'Shares', icon: Share2, color: 'var(--status-kept)' },
  { key: 'reposts', label: 'Reposts', icon: Repeat2, color: 'var(--status-available)' },
] as const

export default function SubmitBlastReportPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [form, setForm] = useState<SubmitBlastReportForm>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitBlastReportForm, string>>>({})
  const [showExpiredState, setShowExpiredState] = useState(false)

  // Load attempt details
  const { data: attempts, isLoading, isError, error } = useQuery({
    queryKey: ['my-blasts', 'kept'],
    queryFn: () => blastApi.getMyKept(user!.id),
    enabled: !!user,
  })
  const attempt = attempts?.find(a => a.id === attemptId)

  const submitMutation = useMutation({
    mutationFn: () => blastApi.submitReport(attemptId, form, user!.id),
    onSuccess: () => {
      toast.success('Report berhasil disubmit! Blast selesai. 🎉')
      queryClient.invalidateQueries({ queryKey: ['my-blasts'] })
      queryClient.invalidateQueries({ queryKey: ['my-reports'] })
      queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'buzzer'] })
      router.push('/my-reports')
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'ATTEMPT_KEEP_EXPIRED') {
          setShowExpiredState(true)
          toast.error('Waktu keep sudah habis. Ambil blast baru dari queue.')
        } else if (err.code === 'VALIDATION_ERROR') {
          toast.error(err.details[0]?.message ?? 'Input report tidak valid.')
        } else {
          toast.error(mapApiErrorToToastMessage(err))
        }
      } else {
        toast.error('Gagal submit report. Coba lagi.')
      }
    },
  })

  const validate = (): boolean => {
    const errs: typeof errors = {}
    for (const field of METRIC_FIELDS) {
      const val = form[field.key]
      if (!Number.isInteger(val) || val < 0) {
        errs[field.key] = `${field.label} harus berupa bilangan bulat >= 0`
      }
    }
    if (!form.proofLink) {
      errs.proofLink = 'Proof link wajib diisi.'
    } else if (!isValidUrl(form.proofLink)) {
      errs.proofLink = 'URL tidak valid.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Mohon periksa kembali form kamu.')
      return
    }
    submitMutation.mutate()
  }

  const handleMetricChange = (key: keyof SubmitBlastReportForm, value: string) => {
    const num = parseInt(value, 10)
    setForm(prev => ({ ...prev, [key]: isNaN(num) ? 0 : Math.max(0, num) }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const isNotOwned = attempt && attempt.keptBy !== user?.id
  const isNotKept = attempt && attempt.status !== 'KEPT'

  if (isLoading) {
    return (
      <RoleGuard roles={['BUZZER']}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Skeleton height={96} />
          <Skeleton height={150} style={{ marginTop: '1rem' }} />
          <Skeleton height={280} style={{ marginTop: '1rem' }} />
        </div>
      </RoleGuard>
    )
  }

  if (isError) {
    return (
      <RoleGuard roles={['BUZZER']}>
        <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat attempt" description={mapApiErrorToToastMessage(error)} />
      </RoleGuard>
    )
  }

  if (!attempt) {
    return (
      <RoleGuard roles={['BUZZER']}>
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Attempt tidak tersedia"
          description="Attempt ini tidak ada di daftar blast yang sedang kamu keep, atau sudah selesai/dirilis."
          action={<Link href="/my-blasts" className="btn-primary" style={{ textDecoration: 'none' }}>Kembali ke My Blasts</Link>}
        />
      </RoleGuard>
    )
  }

  if (showExpiredState || (attempt && attempt.status === 'EXPIRED')) {
    return (
      <div className="card" style={{ padding: '4rem', textAlign: 'center', maxWidth: 560, margin: '4rem auto' }}>
        <AlertTriangle size={48} style={{ color: 'var(--status-expired)', marginBottom: '1rem' }} />
        <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Keep Expired</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Waktu keep kamu telah habis. Blast ini sudah dirilis kembali ke queue dan dapat diambil oleh buzzer lain.
        </p>
        <Link href="/blast-queue" className="btn-primary" style={{ justifyContent: 'center' }}>
          Kembali ke Blast Queue
        </Link>
      </div>
    )
  }

  return (
    <RoleGuard roles={['BUZZER']}>
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/my-blasts" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Kembali ke My Blasts
      </Link>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Submit Blast Report</h1>
          <p className="page-subtitle">Isi metrik blast dan bukti pengerjaan.</p>
        </div>
        {attempt?.keepExpiresAt && (
          <CountdownTimer expiresAt={attempt.keepExpiresAt} onExpired={() => setShowExpiredState(true)} />
        )}
      </div>

      {/* Attempt Info */}
      {attempt && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <PlatformBadge platform={attempt.blastTarget!.platform} />
            <StatusBadge status={attempt.status} type="attempt" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Attempt #{attempt.attemptNo}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Source: <SocialAccountUsernameLink account={attempt.blastTarget?.socialAccount} style={{ fontSize: '0.8125rem', fontWeight: 600 }} />
            </span>
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <a href={attempt.blastTarget?.postUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--cyan)', fontSize: '0.875rem', textDecoration: 'none', wordBreak: 'break-all' }}>
              <ExternalLink size={14} />
              {attempt.blastTarget?.postUrl}
            </a>
          </div>
          {attempt.blastTarget?.instruction && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--violet)' }}>
              📝 <strong>Instruksi:</strong> {attempt.blastTarget.instruction}
            </div>
          )}
          {isNotKept && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--status-kept)' }}>
              Attempt ini tidak dalam status KEPT sehingga report tidak bisa disubmit.
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Metrics */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
            Metrik Engagement
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {METRIC_FIELDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Icon size={13} style={{ color }} />
                  {label}
                </label>
                <input
                  id={`metric-${key}`}
                  type="number"
                  min={0}
                  step={1}
                  className="input-field"
                  value={form[key]}
                  onChange={e => handleMetricChange(key, e.target.value)}
                  style={{ borderColor: errors[key] ? 'var(--status-expired)' : undefined }}
                />
                {errors[key] && <span className="form-error">{errors[key]}</span>}
              </div>
            ))}
          </div>

          {/* Preview total */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview:</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {METRIC_FIELDS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                  <Icon size={13} style={{ color }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatNumber(form[key] as number)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proof Link */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
            Bukti Pengerjaan (Proof)
          </h2>
          <div className="form-group">
            <label className="form-label" htmlFor="proofLink">
              <Link2 size={13} style={{ display: 'inline' }} /> Proof Link (Google Drive / URL screenshot)
            </label>
            <input
              id="proofLink"
              type="url"
              className="input-field"
              placeholder="https://drive.google.com/file/d/..."
              value={form.proofLink}
              onChange={e => {
                setForm(prev => ({ ...prev, proofLink: e.target.value }))
                if (errors.proofLink) setErrors(prev => ({ ...prev, proofLink: undefined }))
              }}
              style={{ borderColor: errors.proofLink ? 'var(--status-expired)' : undefined }}
            />
            {errors.proofLink && <span className="form-error">{errors.proofLink}</span>}

            {/* Drive warning */}
            {form.proofLink && isValidUrl(form.proofLink) && !isGoogleDriveUrl(form.proofLink) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--status-kept)' }}>
                <AlertTriangle size={13} />
                URL bukan Google Drive. Disarankan menggunakan Google Drive untuk proof yang lebih mudah diverifikasi.
              </div>
            )}
            {form.proofLink && isValidUrl(form.proofLink) && isGoogleDriveUrl(form.proofLink) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--status-available-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--status-available)' }}>
                <CheckCircle size={13} />
                Google Drive URL terdeteksi ✓
              </div>
            )}
            <div className="form-hint">Gunakan Google Drive link dengan akses publik Anyone with the link agar dapat diverifikasi.</div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="notes">Catatan (opsional)</label>
            <textarea
              id="notes"
              className="input-field"
              rows={3}
              placeholder="Tambahkan catatan atau konteks jika diperlukan..."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Link href="/my-blasts" className="btn-secondary">Batal</Link>
          <button
            id="submit-report-btn"
            type="submit"
            disabled={submitMutation.isPending || Boolean(isNotOwned) || Boolean(isNotKept)}
            className="btn-primary"
            style={{ padding: '0.625rem 1.5rem', opacity: submitMutation.isPending ? 0.7 : 1 }}
          >
            {submitMutation.isPending ? 'Mengirim...' : 'Submit Report'}
            <CheckCircle size={15} />
          </button>
        </div>
      </form>
    </div>
    </RoleGuard>
  )
}
