/**
 * Profile API module — self-service endpoints under `/api/v1/profile/*`.
 *
 * Mock mode reads/writes the active mock user in sessionStorage via
 * `authApi`, so all existing profile/settings UI keeps working offline.
 * Real mode hits Better Auth-backed NestJS endpoints.
 */
import type { User } from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError, isApiError } from "./errors";
import type { UserSession } from "./types";
import { authApi } from "./auth";

export interface UpdateProfileDto {
  name?: string;
  image?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

interface ProfileEnvelopeData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: User["role"];
  status: User["status"];
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  campaignMemberships?: Array<{
    id: string;
    memberRole: string;
    createdAt: string;
    campaign: { id: string; name: string; status: string };
  }>;
  campaignCount?: number;
}

function toUiUser(data: ProfileEnvelopeData): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    image: data.image ?? undefined,
    role: data.role,
    status: data.status,
    lastLoginAt: data.lastLoginAt ?? undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export interface ProfileMembershipView {
  id: string;
  memberRole: string;
  createdAt: string;
  campaign: { id: string; name: string; status: string };
}

export interface ProfileDetail {
  user: User;
  memberships: ProfileMembershipView[];
  campaignCount: number;
}

export const profileApi = {
  async getProfile(): Promise<User> {
    if (isMockMode()) {
      const user = await authApi.getMe();
      if (!user) throw new ApiError("UNAUTHORIZED", "Sesi mock belum login.");
      return user;
    }

    const response = await apiClient.get<ProfileEnvelopeData>("/profile");
    return toUiUser(response.data);
  },

  async getProfileDetail(): Promise<ProfileDetail> {
    if (isMockMode()) {
      const user = await authApi.getMe();
      if (!user) throw new ApiError("UNAUTHORIZED", "Sesi mock belum login.");
      // Mock mode has no backend memberships; surface an empty list so the
      // UI stays consistent with real-mode shape.
      return { user, memberships: [], campaignCount: 0 };
    }

    const response = await apiClient.get<ProfileEnvelopeData>("/profile");
    const memberships = response.data.campaignMemberships ?? [];
    return {
      user: toUiUser(response.data),
      memberships,
      campaignCount: response.data.campaignCount ?? memberships.length,
    };
  },

  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    if (isMockMode()) {
      const current = await authApi.getMe();
      if (!current)
        throw new ApiError("UNAUTHORIZED", "Sesi mock belum login.");
      const updated: User = {
        ...current,
        name: dto.name ?? current.name,
        image: dto.image ?? current.image,
        updatedAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("mock_user", JSON.stringify(updated));
      }
      return updated;
    }

    const response = await apiClient.patch<ProfileEnvelopeData>(
      "/profile",
      dto,
    );
    return toUiUser(response.data);
  },

  async changePassword(dto: ChangePasswordDto): Promise<{ success: boolean }> {
    if (dto.newPassword === dto.currentPassword) {
      throw new ApiError(
        "PASSWORD_UNCHANGED",
        "Password baru harus berbeda dari password saat ini.",
        [
          {
            field: "newPassword",
            message: "Must differ from currentPassword.",
          },
        ],
      );
    }

    if (isMockMode()) {
      // Mock mode has no real credential storage — treat as success.
      return { success: true };
    }

    try {
      await apiClient.patch("/profile/password", {
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        revokeOtherSessions: dto.revokeOtherSessions ?? true,
      });
      return { success: true };
    } catch (error) {
      if (isApiError(error)) throw error;
      throw new ApiError("REQUEST_ERROR", "Gagal mengubah password.");
    }
  },

  async listSessions(): Promise<UserSession[]> {
    if (isMockMode()) {
      const user = await authApi.getMe();
      const now = new Date();
      return user
        ? [
            {
              id: "mock-session-1",
              tokenFingerprint: "mockmock",
              ipAddress: "127.0.0.1",
              userAgent:
                typeof navigator !== "undefined"
                  ? navigator.userAgent
                  : "mock-agent",
              expiresAt: new Date(
                now.getTime() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              impersonated: false,
            },
          ]
        : [];
    }

    const response = await apiClient.get<UserSession[]>("/profile/sessions");
    return response.data;
  },
};
