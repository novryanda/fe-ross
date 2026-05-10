import { TopNav } from '@/components/layout/top-nav'
import { RequireAuth } from '@/components/layout/require-auth'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-container">
      <TopNav />
      <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <RequireAuth>{children}</RequireAuth>
      </main>
    </div>
  )
}
