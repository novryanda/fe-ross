'use client'
import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { authApi } from '@/lib/api/auth'
import { isApiError } from '@/lib/api/errors'
import { getApiMode, isAuthOnlyPath, isProtectedPath } from '@/lib/auth/session'

/**
 * Hydrates `useAuthStore` on app boot.
 *
 * Mock mode : reads the pretend user from sessionStorage (via authApi.getMe).
 * Real mode : calls `GET /api/v1/auth/me` and trusts the backend session
 *             cookie. On 401 the store is cleared; the UI effect below
 *             redirects to /login when the user is on a protected route.
 *
 * The proxy (`src/proxy.ts`) already handles the server-side redirect for
 * real mode. The client-side redirect is only a defensive fallback when the
 * session cookie exists but is already invalid on the backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setInitialized, isInitialized, user } = useAuthStore()

  useEffect(() => {
    let cancelled = false

    authApi
      .getMe()
      .then((resolved) => {
        if (cancelled) return
        setUser(resolved)
      })
      .catch((error) => {
        if (cancelled) return
        if (isApiError(error) && (error.code === 'UNAUTHORIZED' || error.status === 401)) {
          setUser(null)
        } else {
          // Keep existing (null) state; surface errors via console for now.
          console.error('[auth-provider] getMe failed:', error)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setInitialized(true)
      })

    return () => {
      cancelled = true
    }
  }, [setUser, setInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (getApiMode() !== 'real') return

    // Unauthenticated visitor on a protected route → defensive redirect.
    if (!user && isProtectedPath(pathname)) {
      const loginUrl = pathname === '/' ? '/login' : `/login?redirect=${encodeURIComponent(pathname)}`
      router.replace(loginUrl)
      return
    }

    // Authenticated visitor opening /login → bounce to dashboard.
    if (user && isAuthOnlyPath(pathname)) {
      router.replace('/dashboard')
    }
  }, [isInitialized, user, pathname, router])

  return <>{children}</>
}
