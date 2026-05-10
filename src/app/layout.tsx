import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'ROSS — BuzzTrack Command Center',
  description: 'Operational Command Center for Social Campaigns — Internal Platform',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
