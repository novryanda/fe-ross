"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/errors";
import type { User, UserRole } from "@/types";

const MOCK_SESSION_STORAGE_KEY = "mock_user";

/**
 * Single entry point for all auth state reads/writes from React components.
 *
 * - `user`, `role`, `isAuthenticated`, `isLoading`, `isInitialized` mirror
 *   the underlying zustand store.
 * - `login` / `logout` / `refreshUser` wrap `authApi` and keep the store in
 *   sync. Components should prefer these helpers over calling `authApi`
 *   directly so cleanup + loading flags stay consistent.
 * - `setUser` / `clearUser` remain exported for call sites that need to
 *   mutate state without going through the HTTP layer (e.g. optimistic UI).
 */
export function useAuth() {
  const { user, isLoading, isInitialized, setUser, setLoading } =
    useAuthStore();
  const router = useRouter();
  const role = user?.role ?? null;

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const signedIn = await authApi.login(email, password);
        // `authApi.login` already returns the fresh user; still call getMe in
        // real mode to defeat any cookie-cache lag between sign-in and /me.
        const current = (await authApi.getMe()) ?? signedIn;
        setUser(current);
        return current;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  /**
   * Sign out the current user.
   *
   * Behaviour contract:
   *   1. fire-and-forget the backend `POST /api/v1/auth/logout` (real mode)
   *      or wipe the mock session (mock mode)
   *   2. ALWAYS clear client auth state — store, mock sessionStorage — even
   *      if the backend request fails (network error, already-expired
   *      session, etc.). Users who click "Sign Out" should never remain
   *      signed in locally.
   *   3. ALWAYS redirect to `/login` with `router.replace` followed by
   *      `router.refresh()` so cached Server Component data for protected
   *      routes is thrown away. A failed network call must not block the
   *      redirect.
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      try {
        await authApi.logout();
      } catch (error) {
        if (!isApiError(error) || error.code !== "UNAUTHORIZED") {
          console.warn("[useAuth] logout request failed", error);
        }
      }
    } finally {
      setUser(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
        } catch {
          // sessionStorage may be blocked (private browsing); ignore.
        }
      }
      router.replace("/login");
      router.refresh();
    }
  }, [router, setLoading, setUser]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const next = await authApi.getMe();
      setUser(next);
      return next;
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === "UNAUTHORIZED" || error.status === 401)
      ) {
        setUser(null);
        return null;
      }
      throw error;
    }
  }, [setUser]);

  const clearUser = useCallback(() => setUser(null), [setUser]);

  return {
    // state
    user,
    role,
    isLoading,
    isInitialized,
    isAuthenticated: Boolean(user),
    isAdmin: role === "ADMIN",
    isBuzzer: role === "BUZZER",
    isViewer: role === "VIEWER",
    hasRole: (target: UserRole) => role === target,
    canWrite: role === "ADMIN" || role === "BUZZER",
    canManage: role === "ADMIN",
    // actions
    login,
    logout,
    refreshUser,
    setUser,
    clearUser,
  };
}
