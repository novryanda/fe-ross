'use client'
import { useQuery } from '@tanstack/react-query'
import { campaignsApi } from '@/lib/api/campaigns'

export function useCampaign(id: string) {
  return useQuery({ queryKey: ['campaign', id], queryFn: () => campaignsApi.get(id), enabled: !!id })
}

export function useCampaigns(params?: { search?: string; status?: string }) {
  return useQuery({ queryKey: ['campaigns', params], queryFn: () => campaignsApi.list(params) })
}
