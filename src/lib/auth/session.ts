/**
 * Single source of truth for auth session cookie and route groups.
 * Keep in sync with backend (`api/src/auth/auth.ts` → `advanced.cookiePrefix`).
 *
 * Better Auth adds `__Secure-` prefix in production (useSecureCookies: true).
 * The proxy must check BOTH variants.
 */

export const AUTH_SESSION_COOKIE_NAME = "ross.session_token";
export const AUTH_SESSION_COOKIE_NAME_SECURE = "__Secure-ross.session_token";

export type ApiMode = "mock" | "real";

export function getApiMode(): ApiMode {
  const raw = process.env.NEXT_PUBLIC_API_MODE;
  return raw === "mock" ? "mock" : "real";
}

/**
 * Route prefixes that require an authenticated user. Proxy redirects
 * unauthenticated visitors to `/login` when `NEXT_PUBLIC_API_MODE=real`.
 */
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [
  "/dashboard",
  "/campaigns",
  "/network",
  "/reports",
  "/exports",
  "/audit",
  "/profile",
  "/settings",
  "/blast-queue",
  "/blast-attempts",
  "/my-blasts",
  "/comment-tasks",
  "/my-reports",
];

/**
 * Auth-only routes. If the user already has a session cookie, proxy redirects
 * them away from these routes to `/dashboard`.
 */
export const AUTH_ONLY_ROUTES: readonly string[] = ["/login"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.includes(pathname);
}
