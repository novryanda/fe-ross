import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  getApiMode,
  isAuthOnlyPath,
  isProtectedPath,
} from "@/lib/auth/session";

/**
 * Next.js 16 proxy (successor to the old `middleware.ts`).
 *
 * Role:
 *   1. Mock mode → never blocks; UI layer decides auth via sessionStorage.
 *   2. Real mode →
 *        - protected route + no `ross.session_token` cookie → redirect `/login`.
 *        - auth-only route (`/login`) + cookie present → redirect `/dashboard`.
 *
 * Authorization by role is enforced by the backend (403) and the UI
 * `<RoleGuard>`; the proxy only checks "authenticated vs anonymous".
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (getApiMode() === "mock") {
    return NextResponse.next();
  }

  const hasSession = Boolean(
    request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value,
  );

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnlyPath(pathname) && hasSession) {
    const redirectTarget =
      request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals, static files, image routes, and any image files.
  // The frontend does not expose same-origin /api/** routes that need guarding.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
