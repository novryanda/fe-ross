'use client'
import { useAuthStore } from '@/stores/auth-store'
import { AdminDashboard } from './admin-dashboard'
import { BuzzerDashboard } from './buzzer-dashboard'
import { ViewerDashboard } from './viewer-dashboard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isInitialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login')
    }
  }, [isInitialized, user, router])

  if (!isInitialized || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    )
  }

  if (user.role === 'ADMIN') return <AdminDashboard />
  if (user.role === 'BUZZER') return <BuzzerDashboard />
  return <ViewerDashboard />
}
