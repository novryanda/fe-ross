'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blastApi } from '@/lib/api/blast'
import { useAuthStore } from '@/stores/auth-store'
import { ApiClientError } from '@/lib/api/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function useKeepAttempt() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (attemptId: string) => blastApi.keepAttempt(attemptId, user!.id),
    onSuccess: (attempt) => {
      toast.success('Berhasil keep blast! Segera submit report.')
      queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      queryClient.invalidateQueries({ queryKey: ['my-blasts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'buzzer'] })
      router.push(`/my-blasts/${attempt.id}/submit`)
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === 'ATTEMPT_ALREADY_KEPT') {
        toast.error('Blast ini sudah diambil oleh buzzer lain.')
        queryClient.invalidateQueries({ queryKey: ['blast-queue'] })
      } else {
        toast.error(err instanceof Error ? err.message : 'Gagal keep blast.')
      }
    },
  })
}
