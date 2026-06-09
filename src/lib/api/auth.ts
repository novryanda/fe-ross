/**
 * Auth API — mock + real adapter.
 *
 * - Mock mode: looks up users in `mockSessions` and persists the chosen user
 *   in sessionStorage (no network, no backend required).
 * - Real mode:
 *     - login  → `POST /api/auth/sign-in/email`  (native Better Auth)
 *     - me     → `GET /api/v1/auth/me`            (NestJS, ROSS envelope)
 *     - logout → `POST /api/v1/auth/logout`       (NestJS, ROSS envelope)
 */
import type { User } from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError, getErrorMessage, isApiError } from "./errors";
import { mockSessions } from "@/lib/mock-data";

const MOCK_SESSION_STORAGE_KEY = "mock_user";
const MOCK_DEFAULT_PASSWORD = "password123";
const MOCK_LATENCY_MS = 400;

let mockCurrentUser: User | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readMockUser(): User | null {
  if (mockCurrentUser) return mockCurrentUser;
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    mockCurrentUser = JSON.parse(stored) as User;
    return mockCurrentUser;
  } catch {
    window.sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
    return null;
  }
}

function writeMockUser(user: User | null) {
  mockCurrentUser = user;
  if (typeof window === "undefined") return;
  if (user)
    window.sessionStorage.setItem(
      MOCK_SESSION_STORAGE_KEY,
      JSON.stringify(user),
    );
  else window.sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
}

// ---------- Real-mode DTOs ----------

interface MeEnvelopeData {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  picUnitId: string | null;
  lastLoginAt: string | null;
}

function toUiUser(data: MeEnvelopeData): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status,
    picUnitId: data.picUnitId,
    lastLoginAt: data.lastLoginAt ?? undefined,
    // `createdAt` / `updatedAt` are not returned by /auth/me; backfill now so
    // the UI doesn't explode on `formatDate(user.createdAt)`.
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface PasswordResetRequestResult {
  status: boolean;
  message: string;
}

interface PasswordResetResult {
  status: boolean;
}

// ---------- Public API ----------

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const user = mockSessions[email];
      if (!user || password !== MOCK_DEFAULT_PASSWORD) {
        throw new ApiError("UNAUTHORIZED", "Email atau password salah.");
      }
      writeMockUser(user);
      return user;
    }

    // Better Auth native endpoint lives OUTSIDE /api/v1.
    try {
      await apiClient.fetchFromOrigin("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      // Normalise Better Auth error shape (non-envelope) into ApiError.
      if (isApiError(error)) throw error;
      throw new ApiError(
        "UNAUTHORIZED",
        getErrorMessage(error, "Login gagal."),
      );
    }

    const me = await authApi.getMe();
    if (!me)
      throw new ApiError(
        "UNAUTHORIZED",
        "Login berhasil tetapi sesi tidak terdeteksi.",
      );
    return me;
  },

  async logout(): Promise<void> {
    if (isMockMode()) {
      writeMockUser(null);
      return;
    }

    try {
      // `/api/v1/auth/logout` is idempotent on the backend.
      await apiClient.post("/auth/logout");
    } catch (error) {
      // 401 on logout still means the session is effectively gone.
      if (isApiError(error) && error.code === "UNAUTHORIZED") return;
      throw error;
    }
  },

  async getMe(): Promise<User | null> {
    if (isMockMode()) return readMockUser();

    try {
      const response = await apiClient.get<MeEnvelopeData>("/auth/me");
      return toUiUser(response.data);
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === "UNAUTHORIZED" || error.status === 401)
      ) {
        return null;
      }
      throw error;
    }
  },

  async requestPasswordReset(
    email: string,
    redirectTo?: string,
  ): Promise<PasswordResetRequestResult> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return {
        status: true,
        message:
          "Jika email terdaftar, link reset password akan dikirim.",
      };
    }

    return apiClient.fetchFromOrigin<PasswordResetRequestResult>(
      "/api/auth/request-password-reset",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          ...(redirectTo ? { redirectTo } : {}),
        }),
      },
    );
  },

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<PasswordResetResult> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return { status: true };
    }

    return apiClient.fetchFromOrigin<PasswordResetResult>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      },
    );
  },
};
