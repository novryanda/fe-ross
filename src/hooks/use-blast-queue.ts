'use client'
import { useQuery } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'

export function useBlastQueue() {
  return useQuery({ queryKey: ['blast-queue'], queryFn: () => blastApi.getQueue(), refetchInterval: 30_000 })
}
