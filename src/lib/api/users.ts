/**
 * Users API module — admin-only endpoints under `/api/v1/users/*`.
 *
 * Mock mode operates on `mockUsers` so the existing UI keeps rendering
 * without a backend. Real mode hits the NestJS endpoints documented in
 * `Backend_API_Contract_Inventory_v1.3.md` (module 2).
 */
import type { OrgUnit, User, UserRole, UserStatus } from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError } from "./errors";
import type {
  PaginatedResponse,
  PaginationMeta,
  UserActivitySummary,
  UserSummary,
} from "./types";
import { mockCampaignMembers, mockUsers } from "@/lib/mock-data";

const MOCK_LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toUserSummary(user: User, campaignCount: number): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    campaignCount,
  };
}

// ---------- Query types ----------

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  picUnitId?: string;
  campaignIds?: string[];
  sendInviteEmail?: boolean;
  temporaryPassword?: string;
  requirePasswordChange?: boolean;
  notes?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  picUnitId?: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface AdminResetPasswordDto {
  newPassword?: string;
  sendResetEmail?: boolean;
  revokeSessions?: boolean;
  requirePasswordChange?: boolean;
}

export interface AdminResetPasswordResponse {
  success: boolean;
  mode?: "manual_password" | "email_link";
  emailSent?: boolean;
  revokeSessions: boolean;
  requirePasswordChange: boolean | "NEEDS_AUTH_PROVIDER_SUPPORT";
}

export interface UserMembershipView {
  id: string;
  memberRole: "ADMIN" | "BUZZER" | "VIEWER";
  createdAt: string;
  campaign: { id: string; name: string; status: string };
}

export interface UserDetail extends UserSummary {
  picUnit?: Pick<OrgUnit, "id" | "name" | "code" | "status" | "parentId">;
  campaignMemberships: UserMembershipView[];
}

export interface CreateUserResult extends UserSummary {
  inviteRequested?: boolean;
  inviteEmailSent?: boolean;
  requirePasswordChange?: boolean | "NEEDS_AUTH_PROVIDER_SUPPORT";
}

// ---------- Public API ----------

export const usersApi = {
  async list(
    params: ListUsersParams = {},
  ): Promise<PaginatedResponse<UserSummary>> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const search = params.search?.toLowerCase().trim();
      let rows = [...mockUsers];
      if (params.role) rows = rows.filter((u) => u.role === params.role);
      if (params.status) rows = rows.filter((u) => u.status === params.status);
      if (search) {
        rows = rows.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search),
        );
      }
      const total = rows.length;
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const start = (page - 1) * limit;
      const paged = rows.slice(start, start + limit);
      const items = paged.map((u) =>
        toUserSummary(
          u,
          mockCampaignMembers.filter((m) => m.userId === u.id).length,
        ),
      );
      const meta: PaginationMeta = {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
      return { items, meta };
    }

    const response = await apiClient.get<UserSummary[]>("/users", {
      page: params.page,
      limit: params.limit,
      search: params.search,
      role: params.role,
      status: params.status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return {
      items: response.data,
      meta: response.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        total: response.data.length,
        totalPages: 1,
      },
    };
  },

  async get(userId: string): Promise<UserDetail> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const user = mockUsers.find((u) => u.id === userId);
      if (!user) throw new ApiError("NOT_FOUND", "User tidak ditemukan.");
      const memberships = mockCampaignMembers
        .filter((m) => m.userId === userId)
        .map<UserMembershipView>((m) => {
          const normalized = (m.roleInCampaign ?? user.role).toUpperCase();
          const memberRole: UserMembershipView["memberRole"] =
            normalized === "ADMIN" ||
            normalized === "BUZZER" ||
            normalized === "VIEWER"
              ? (normalized as UserMembershipView["memberRole"])
              : "BUZZER";
          return {
            id: m.id,
            memberRole,
            createdAt: m.createdAt,
            campaign: {
              id: m.campaignId,
              name: m.campaignId,
              status: "ACTIVE",
            },
          };
        });
      return {
        ...toUserSummary(user, memberships.length),
        picUnit: undefined,
        campaignMemberships: memberships,
      };
    }

    const response = await apiClient.get<
      UserSummary & {
        picUnit?: Pick<OrgUnit, "id" | "name" | "code" | "status" | "parentId">;
        campaignMemberships?: Array<{
          id: string;
          memberRole: UserMembershipView["memberRole"];
          createdAt: string;
          campaign: { id: string; name: string; status: string };
        }>;
      }
    >(`/users/${userId}`);
    const memberships = response.data.campaignMemberships ?? [];
    return {
      ...response.data,
      picUnit: response.data.picUnit,
      campaignMemberships: memberships,
    };
  },

  async create(dto: CreateUserDto): Promise<CreateUserResult> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const existing = mockUsers.find(
        (u) => u.email.toLowerCase() === dto.email.toLowerCase(),
      );
      if (existing)
        throw new ApiError("EMAIL_ALREADY_IN_USE", "Email sudah digunakan.");
      const now = new Date().toISOString();
      const newUser: User = {
        id: `u-mock-${Date.now()}`,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        status: dto.status ?? "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };
      mockUsers.push(newUser);
      return toUserSummary(newUser, dto.campaignIds?.length ?? 0);
    }

    const response = await apiClient.post<CreateUserResult>("/users", dto);
    return response.data;
  },

  async update(userId: string, dto: UpdateUserDto): Promise<UserSummary> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockUsers.findIndex((u) => u.id === userId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "User tidak ditemukan.");
      mockUsers[idx] = {
        ...mockUsers[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      return toUserSummary(
        mockUsers[idx],
        mockCampaignMembers.filter((m) => m.userId === userId).length,
      );
    }

    const response = await apiClient.patch<UserSummary>(
      `/users/${userId}`,
      dto,
    );
    return response.data;
  },

  async updateStatus(
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserSummary> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockUsers.findIndex((u) => u.id === userId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "User tidak ditemukan.");
      mockUsers[idx] = {
        ...mockUsers[idx],
        status: dto.status,
        updatedAt: new Date().toISOString(),
      };
      return toUserSummary(
        mockUsers[idx],
        mockCampaignMembers.filter((m) => m.userId === userId).length,
      );
    }

    const response = await apiClient.patch<UserSummary>(
      `/users/${userId}/status`,
      dto,
    );
    return response.data;
  },

  async resetPassword(
    userId: string,
    dto: AdminResetPasswordDto,
  ): Promise<AdminResetPasswordResponse> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return {
        success: true,
        revokeSessions: dto.revokeSessions ?? true,
        requirePasswordChange: dto.requirePasswordChange
          ? "NEEDS_AUTH_PROVIDER_SUPPORT"
          : false,
      };
    }

    const response = await apiClient.post<AdminResetPasswordResponse>(
      `/users/${userId}/reset-password`,
      dto,
    );
    return response.data;
  },

  async getActivitySummary(userId: string): Promise<UserActivitySummary> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const user = mockUsers.find((u) => u.id === userId);
      if (!user) throw new ApiError("NOT_FOUND", "User tidak ditemukan.");
      return {
        userId,
        role: user.role,
        completedBlastAttempts: 0,
        completedCommentTasks: 0,
        submittedReports: 0,
        assignedCampaigns: mockCampaignMembers.filter(
          (m) => m.userId === userId,
        ).length,
        lastActivityAt: user.lastLoginAt ?? null,
      };
    }

    const response = await apiClient.get<UserActivitySummary>(
      `/users/${userId}/activity-summary`,
    );
    return response.data;
  },
};
