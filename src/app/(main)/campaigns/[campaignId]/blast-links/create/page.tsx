'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, Info } from 'lucide-react'
import { CampaignShell } from '@/components/features/campaign/campaign-shell'
import { BlastLinkCreateForm } from '@/components/features/blast/blast-link-create-form'
import { BlastLinkHelperPanel } from '@/components/features/blast/blast-link-helper-panel'
import { CompletionChecklistCard, type ChecklistItem } from '@/components/features/campaign/enterprise-campaign-form'
import { RoleGuard } from '@/components/layout/role-guard'
import { EmptyState } from '@/components/ui/empty-state'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { blastApi } from '@/lib/api/blast'
import { campaignsApi } from '@/lib/api/campaigns'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { socialAccountsApi } from '@/lib/api/social-accounts'
import type { BlastTargetStatus, Platform } from '@/types'
import { toast } from 'sonner'

export default function CreateBlastLinkPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const campaignQuery = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  })

  const campaignPlatforms = campaignQuery.data?.platforms ?? []
  const defaultPlatform = campaignPlatforms[0] ?? 'INSTAGRAM'

  const [platform, setPlatform] = useState<Platform>(defaultPlatform)
  const [socialAccountId, setSocialAccountId] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [instruction, setInstruction] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [status, setStatus] = useState<Extract<BlastTargetStatus, 'ACTIVE' | 'PAUSED'>>('ACTIVE')

  useEffect(() => {
    if (campaignPlatforms.length && !campaignPlatforms.includes(platform)) {
      setPlatform(campaignPlatforms[0])
      setSocialAccountId('')
    }
  }, [campaignPlatforms, platform])

  const accountsQuery = useQuery({
    queryKey: ['social-accounts', { platform, status: 'ACTIVE' }],
    queryFn: () => socialAccountsApi.list({ platform, status: 'ACTIVE', limit: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: () => blastApi.addTarget(campaignId, {
      socialAccountId,
      platform,
      postUrl,
      instruction: instruction || undefined,
      internalNotes: internalNotes || undefined,
      createInitialAttempt: true,
      status,
      sourceType: 'ADMIN_SUBMITTED',
      reviewStatus: 'APPROVED',
    }),
    onSuccess: (target) => {
      queryClient.invalidateQueries({ queryKey: ['blast-targets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-dashboard', campaignId] })
      toast.success('Blast link berhasil dibuat.')
      router.push(`/campaigns/${campaignId}/blast-links/${target.id}`)
    },
    onError: (error) => toast.error(mapApiErrorToToastMessage(error)),
  })

  const checklist = useMemo<ChecklistItem[]>(() => [
    { label: 'Platform', ready: Boolean(platform), emptyLabel: 'Belum dipilih' },
    { label: 'Source account', ready: Boolean(socialAccountId), emptyLabel: 'Belum dipilih' },
    { label: 'Post URL', ready: postUrl.trim().startsWith('http'), emptyLabel: 'Belum valid' },
    { label: 'Status', ready: Boolean(status), emptyLabel: 'Belum dipilih' },
  ], [platform, postUrl, socialAccountId, status])

  const canCreate = checklist.every(item => item.ready)
  const accounts = accountsQuery.data?.data ?? []
  const selectedAccount = accounts.find(account => account.id === socialAccountId)

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('Lengkapi field wajib sebelum membuat blast link.')
      return
    }
    createMutation.mutate()
  }

  return (
    <RoleGuard roles={['ADMIN']}>
      <CampaignShell campaign={campaignQuery.data} campaignId={campaignId}>
        <Link href={`/campaigns/${campaignId}/blast-links`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
          <ArrowLeft size={15} /> Back to Blast Links
        </Link>

        <div className="section-heading-row" style={{ marginTop: 0 }}>
          <div>
            <div className="section-kicker">Blast Management</div>
            <h1 className="section-title" style={{ fontSize: '2rem' }}>Add Blast Link</h1>
            <p className="section-subtitle">
              Admin dapat langsung mendaftarkan target post ke campaign. Blast akan terbuka untuk semua Buzzer member.
            </p>
            <div className="blast-info-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <span>Perlu blast dari submission PIC? Gunakan flow <Link href={`/campaigns/${campaignId}/blast-links/new`} style={{ color: 'var(--cyan)', fontWeight: 800 }}>Create From PIC Submission</Link>.</span>
            </div>
          </div>
        </div>

        {campaignQuery.isError ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="Gagal memuat campaign" description={mapApiErrorToToastMessage(campaignQuery.error)} />
        ) : (
          <div className="campaign-create-grid">
            <div className="enterprise-form-card" style={{ padding: '1rem' }}>
              <BlastLinkCreateForm
                campaignId={campaignId}
                platformOptions={campaignPlatforms}
                platform={platform}
                onPlatformChange={(value) => { setPlatform(value); setSocialAccountId('') }}
                socialAccountId={socialAccountId}
                onSocialAccountChange={setSocialAccountId}
                accounts={accounts}
                accountsLoading={accountsQuery.isLoading}
                postUrl={postUrl}
                onPostUrlChange={setPostUrl}
                instruction={instruction}
                onInstructionChange={setInstruction}
                internalNotes={internalNotes}
                onInternalNotesChange={setInternalNotes}
                status={status}
                onStatusChange={setStatus}
                canSubmit={canCreate}
                submitting={createMutation.isPending}
                onSubmit={handleCreate}
              />
            </div>

            <aside className="campaign-create-sidebar">
              <BlastLinkHelperPanel
                campaign={campaignQuery.data}
                selectedPlatform={platform}
                selectedAccount={selectedAccount}
                postUrl={postUrl}
              />
              <div className="campaign-summary-panel">
                <strong>Blast Summary</strong>
                <SummaryLine label="Campaign" value={campaignQuery.data?.name ?? '-'} />
                <SummaryLine label="Platform" value={<PlatformBadge platform={platform} size="sm" />} />
                <SummaryLine label="Source" value={selectedAccount ? `@${selectedAccount.username}` : '-'} />
                <SummaryLine label="Post URL" value={postUrl || 'Belum diisi'} />
                <SummaryLine label="Status" value={<StatusBadge status={status} type="campaign" size="sm" />} />
              </div>
              <CompletionChecklistCard items={checklist} />
            </aside>
          </div>
        )}
      </CampaignShell>
    </RoleGuard>
  )
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return <div className="summary-line"><div className="summary-label">{label}</div><div className="summary-value">{value}</div></div>
}
