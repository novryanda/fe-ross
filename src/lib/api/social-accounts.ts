/**
 * Social Accounts API — admin-only. Backend exposes:
 *   GET    /api/v1/social-accounts
 *   POST   /api/v1/social-accounts
 *   GET    /api/v1/social-accounts/:id
 *   PATCH  /api/v1/social-accounts/:id
 *   PATCH  /api/v1/social-accounts/:id/status
 *
 * There is no DELETE endpoint — archive via status update instead.
 */
import type {
  PaginationMeta as UiPaginationMeta,
  Platform,
  SocialAccount,
  SocialAccountCategory,
  SocialAccountStatus,
} from "@/types";
import { apiClient, isMockMode } from "./client";
import { mockSocialAccounts } from "@/lib/mock-data";

const MOCK_LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CreateSocialAccountForm {
  platform: Platform;
  username: string;
  displayName: string;
  profileUrl: string;
  category: SocialAccountCategory;
}

export interface ListSocialAccountsParams {
  page?: number;
  limit?: number;
  platform?: string;
  status?: string;
  category?: string;
  search?: string;
}

export const socialAccountsApi = {
  async list(
    params: ListSocialAccountsParams = {},
  ): Promise<{ data: SocialAccount[]; meta: UiPaginationMeta }> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      let data = [...mockSocialAccounts];
      if (params.platform)
        data = data.filter((a) => a.platform === params.platform);
      if (params.status) data = data.filter((a) => a.status === params.status);
      if (params.category)
        data = data.filter((a) => a.category === params.category);
      if (params.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (a) =>
            a.username.toLowerCase().includes(q) ||
            (a.displayName?.toLowerCase().includes(q) ?? false),
        );
      }
      return {
        data,
        meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
      };
    }
    const response = await apiClient.get<SocialAccount[]>("/social-accounts", {
      page: params.page,
      limit: params.limit,
      platform: params.platform,
      status: params.status,
      category: params.category,
      search: params.search,
    });
    return {
      data: response.data,
      meta: response.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        total: response.data.length,
        totalPages: 1,
      },
    };
  },

  async get(id: string): Promise<SocialAccount> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const account = mockSocialAccounts.find((a) => a.id === id);
      if (!account) throw new Error("Social account not found");
      return account;
    }
    const response = await apiClient.get<SocialAccount>(
      `/social-accounts/${id}`,
    );
    return response.data;
  },

  async create(form: CreateSocialAccountForm): Promise<SocialAccount> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const now = new Date().toISOString();
      const created: SocialAccount = {
        ...form,
        id: `sa-mock-${Date.now()}`,
        status: "ACTIVE",
        createdBy: "user-admin-1",
        createdAt: now,
        updatedAt: now,
        blastTargetCount: 0,
      };
      mockSocialAccounts.push(created);
      return created;
    }
    const response = await apiClient.post<SocialAccount>(
      "/social-accounts",
      form,
    );
    return response.data;
  },

  async update(
    id: string,
    form: Partial<CreateSocialAccountForm>,
  ): Promise<SocialAccount> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockSocialAccounts.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error("Social account not found");
      mockSocialAccounts[idx] = {
        ...mockSocialAccounts[idx],
        ...form,
        updatedAt: new Date().toISOString(),
      };
      return mockSocialAccounts[idx];
    }
    const response = await apiClient.patch<SocialAccount>(
      `/social-accounts/${id}`,
      form,
    );
    return response.data;
  },

  async updateStatus(
    id: string,
    status: SocialAccountStatus,
  ): Promise<SocialAccount> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockSocialAccounts.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error("Social account not found");
      mockSocialAccounts[idx] = {
        ...mockSocialAccounts[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      return mockSocialAccounts[idx];
    }
    const response = await apiClient.patch<SocialAccount>(
      `/social-accounts/${id}/status`,
      {
        status,
      },
    );
    return response.data;
  },

  /** Archive (soft) — backend has no DELETE endpoint. */
  async archive(id: string): Promise<SocialAccount> {
    return socialAccountsApi.updateStatus(id, "ARCHIVED");
  },

  /**
   * @deprecated Backend has no DELETE. Kept as an alias of `archive` so
   * existing UI that calls `.delete(id)` still works in mock mode. In real
   * mode this performs the same archive transition.
   */
  async delete(id: string): Promise<void> {
    await socialAccountsApi.archive(id);
  },
};
