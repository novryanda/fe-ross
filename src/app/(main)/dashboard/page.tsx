'use client'
import { useAuthStore } from '@/stores/auth-store'
import { AdminDashboard } from './admin-dashboard'
import { BuzzerDashboard } from './buzzer-dashboard'
import { ViewerDashboard } from './viewer-dashboard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

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
  if (user.role === 'PIC') {
    return (
      <div className="page-container">
        <PageHeader
          title="PIC Dashboard"
          subtitle="Masuk ke queue postingan, submission hasil posting, dan daftar akun sosmed PIC."
          actions={
            <>
              <Link href="/pic/posting-queue" className="btn-primary" style={{ textDecoration: 'none' }}>
                Posting Queue
              </Link>
              <Link href="/pic/social-accounts" className="btn-secondary" style={{ textDecoration: 'none' }}>
                My Social Accounts
              </Link>
            </>
          }
        />

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="kpi-v2" style={{ borderLeftColor: 'var(--status-expired)' }}>
            <div>
              <div className="kpi-v2-label">Workflow PIC</div>
              <div className="kpi-v2-value">{'Claim -> Post -> Submit'}</div>
            </div>
          </div>
          <div className="kpi-v2" style={{ borderLeftColor: 'var(--cyan)' }}>
            <div>
              <div className="kpi-v2-label">Akun Sosmed</div>
              <div className="kpi-v2-value">Kelola sendiri</div>
            </div>
          </div>
        </div>

        <div className="info-banner info-banner-cyan">
          PIC memakai daftar akun sosmed miliknya sendiri saat submit hasil posting. Admin cukup membuat posting order dan meninjau submission untuk dijadikan blast source.
        </div>
      </div>
    )
  }
  return <ViewerDashboard />
}
