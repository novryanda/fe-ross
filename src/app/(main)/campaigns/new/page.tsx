'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Info } from 'lucide-react'
import { EnterpriseCampaignForm, type EnterpriseCampaignPayload, type MockMember } from '@/components/features/campaign/enterprise-campaign-form'
import { campaignsApi } from '@/lib/api/campaigns'
import { campaignMembersApi } from '@/lib/api/campaign-members'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { usersApi } from '@/lib/api/users'
import { toast } from 'sonner'

function toSelectableMembers(users: Awaited<ReturnType<typeof usersApi.list>> | undefined): MockMember[] {
  return (users?.items ?? [])
    .filter((user) => user.role !== 'PIC')
    .map(user => ({
      id: user.id,
      name: user.name,
      role: user.role as MockMember['role'],
    }))
}

export default function NewCampaignPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ['campaign-form-users'],
    queryFn: () => usersApi.list({ limit: 100, status: 'ACTIVE' }),
  })

  const createMutation = useMutation({
    mutationFn: async (data: EnterpriseCampaignPayload) => {
      const campaign = await campaignsApi.create(data)
      const selectedCount = data.members.adminIds.length + data.members.buzzerIds.length + data.members.viewerIds.length

      if (selectedCount > 0) {
        try {
          await campaignMembersApi.add(campaign.id, data.members)
        } catch (error) {
          console.error('Campaign member add failed after campaign create', {
            campaignId: campaign.id,
            members: data.members,
            error,
          })
          return { campaign, memberError: error }
        }
      }

      return { campaign, memberError: null }
    },
    onSuccess: ({ campaign, memberError }) => {
      if (memberError) {
        toast.warning('Campaign berhasil dibuat, tetapi beberapa member gagal ditambahkan.')
      } else {
        toast.success(`Campaign dibuat: ${campaign.name}`)
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-members', campaign.id] })
      router.push(`/campaigns/${campaign.id}`)
    },
    onError: (error) => {
      toast.error(mapApiErrorToToastMessage(error))
    },
  })

  const handleCreate = (data: EnterpriseCampaignPayload) => {
    createMutation.mutate(data)
  }

  return (
    <div>
      <Link href="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.9rem' }}>
        <ArrowLeft size={15} /> Back to Campaigns
      </Link>

      <div className="section-heading-row" style={{ marginTop: 0 }}>
        <div>
          <div className="section-kicker">Campaign Setup</div>
          <h1 className="section-title" style={{ fontSize: '2rem' }}>Create Campaign</h1>
          <p className="section-subtitle">Buat campaign baru dan tetapkan platform, periode, serta anggota tim.</p>
          <div className="blast-info-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <Info size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <span>Objective dan internal notes masih UI-only untuk saat ini; backend campaign menerima nama, deskripsi, platform, periode, dan status.</span>
          </div>
        </div>
      </div>

      <EnterpriseCampaignForm
        availableMembers={toSelectableMembers(usersQuery.data)}
        membersLoading={usersQuery.isLoading}
        loading={createMutation.isPending}
        onCreate={handleCreate}
        onSaveDraft={(data) => {
          handleCreate({ ...(data as EnterpriseCampaignPayload), status: 'DRAFT' })
        }}
      />
    </div>
  )
}
