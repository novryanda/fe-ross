'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Info } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badges'
import { EnterpriseCampaignEditForm, type EnterpriseCampaignEditPayload } from '@/components/features/campaign/enterprise-campaign-edit-form'
import type { MockMember } from '@/components/features/campaign/enterprise-campaign-form'
import { campaignsApi } from '@/lib/api/campaigns'
import { campaignMembersApi } from '@/lib/api/campaign-members'
import { getErrorMessage, mapApiErrorToToastMessage } from '@/lib/api/errors'
import { usersApi } from '@/lib/api/users'
import type { Campaign, CampaignMember } from '@/types'
import { toast } from 'sonner'

function toSelectableMembers(
  users: Awaited<ReturnType<typeof usersApi.list>> | undefined,
  members: CampaignMember[] = [],
): MockMember[] {
  const rows = new Map<string, MockMember>()

  for (const user of users?.items ?? []) {
    rows.set(user.id, { id: user.id, name: user.name, role: user.role })
  }

  for (const member of members) {
    const role = member.roleInCampaign === 'ADMIN' || member.roleInCampaign === 'BUZZER' || member.roleInCampaign === 'VIEWER'
      ? member.roleInCampaign
      : member.user?.role
    if (member.userId && role) {
      rows.set(member.userId, {
        id: member.userId,
        name: member.user?.name ?? member.userId,
        role,
      })
    }
  }

  return [...rows.values()]
}

function buildInitialCampaign(
  campaign: Campaign,
  members: CampaignMember[] = [],
): EnterpriseCampaignEditPayload {
  return {
    name: campaign.name,
    description: campaign.description,
    objective: campaign.description ?? '',
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate?.slice(0, 10) ?? '',
    platforms: campaign.platforms,
    status: campaign.status,
    members: {
      adminIds: members.filter(member => member.roleInCampaign === 'ADMIN').map(member => member.userId),
      buzzerIds: members.filter(member => member.roleInCampaign === 'BUZZER').map(member => member.userId),
      viewerIds: members.filter(member => member.roleInCampaign === 'VIEWER').map(member => member.userId),
    },
    internalNotes: '',
  }
}

function flattenMemberIds(data: EnterpriseCampaignEditPayload['members']) {
  return new Set([...data.adminIds, ...data.buzzerIds, ...data.viewerIds])
}

export default function EditCampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const campaignQuery = useQuery({ queryKey: ['campaign', campaignId], queryFn: () => campaignsApi.get(campaignId) })
  const membersQuery = useQuery({ queryKey: ['campaign-members', campaignId], queryFn: () => campaignMembersApi.list(campaignId), enabled: !!campaignId })
  const usersQuery = useQuery({ queryKey: ['campaign-form-users'], queryFn: () => usersApi.list({ limit: 100, status: 'ACTIVE' }) })

  const updateMutation = useMutation({
    mutationFn: async (data: EnterpriseCampaignEditPayload) => {
      const updated = await campaignsApi.update(campaignId, data)
      const currentMembers = membersQuery.data?.data ?? []
      const currentIds = new Set(currentMembers.map(member => member.userId))
      const nextIds = flattenMemberIds(data.members)
      const membersToRemove = currentMembers.filter(member => !nextIds.has(member.userId))
      const hasAdditions = [...nextIds].some(userId => !currentIds.has(userId))

      const memberErrors: unknown[] = []

      if (hasAdditions) {
        try {
          await campaignMembersApi.add(campaignId, data.members)
        } catch (error) {
          memberErrors.push(error)
        }
      }

      for (const member of membersToRemove) {
        try {
          await campaignMembersApi.remove(campaignId, member.userId)
        } catch (error) {
          memberErrors.push(error)
        }
      }

      return { updated, memberErrors }
    },
    onSuccess: ({ updated, memberErrors }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-members', campaignId] })
      if (memberErrors.length > 0) {
        toast.warning(`Campaign disimpan, tetapi sebagian perubahan member gagal: ${mapApiErrorToToastMessage(memberErrors[0])}`)
      } else {
        toast.success(`Campaign disimpan: ${updated.name}`)
      }
      router.push(`/campaigns/${campaignId}`)
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => campaignsApi.archive(campaignId),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      toast.success(`Campaign diarsipkan: ${campaign.name}`)
      router.push(`/campaigns/${campaignId}`)
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const campaign = campaignQuery.data
  const members = membersQuery.data?.data ?? []
  const initial = campaign ? buildInitialCampaign(campaign, members) : null

  if (campaignQuery.isLoading || membersQuery.isLoading) {
    return (
      <div className="campaign-summary-panel">
        <strong>Memuat campaign...</strong>
        <p className="muted-meta" style={{ marginTop: '0.5rem' }}>Menyiapkan form edit campaign.</p>
      </div>
    )
  }

  if (campaignQuery.isError || !campaign || !initial) {
    return (
      <div>
        <Link href="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
          <ArrowLeft size={15} /> Back to Campaigns
        </Link>
        <div className="campaign-summary-panel">
          <AlertCircle size={24} style={{ color: 'var(--status-rejected)', marginBottom: '0.75rem' }} />
          <strong>Campaign not found.</strong>
          <p className="muted-meta" style={{ marginTop: '0.5rem' }}>{getErrorMessage(campaignQuery.error, 'Campaign tidak tersedia.')}</p>
        </div>
      </div>
    )
  }

  const handleArchive = () => {
    if (window.confirm(`Archive campaign "${campaign.name}"?`)) {
      archiveMutation.mutate()
    }
  }

  return (
    <div>
      <Link href={`/campaigns/${campaignId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
        <ArrowLeft size={15} /> Back to Campaign
      </Link>

      <div className="section-heading-row" style={{ marginTop: 0 }}>
        <div>
          <div className="section-kicker">Campaign Setup</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <h1 className="section-title" style={{ fontSize: '2rem' }}>Edit Campaign</h1>
            <StatusBadge status={campaign.status} type="campaign" size="sm" />
          </div>
          <p className="section-subtitle">Update campaign information, period, status, and campaign members.</p>
          <div className="blast-info-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <span>Objective, platforms, dan internal notes tetap UI-only dan tidak dikirim ke backend campaign endpoint.</span>
          </div>
        </div>
      </div>

      <EnterpriseCampaignEditForm
        initial={initial}
        availableMembers={toSelectableMembers(usersQuery.data, members)}
        membersLoading={usersQuery.isLoading}
        loading={updateMutation.isPending}
        archiveLoading={archiveMutation.isPending}
        onCancel={() => router.push(`/campaigns/${campaignId}`)}
        onSave={(data) => updateMutation.mutate(data)}
        onArchive={handleArchive}
      />
    </div>
  )
}
