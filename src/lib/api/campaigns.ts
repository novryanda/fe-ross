/**
 * Campaigns API - Mock + Real adapter.
 *
 * Real-mode responses are normalized through campaign mappers so UI components
 * never depend on raw NestJS/Prisma relation shapes.
 */
import type { Campaign, CreateCampaignForm, PaginationMeta } from "@/types";
import { mockCampaigns } from "@/lib/mock-data";
import { apiClient, isMockMode } from "./client";
import { campaignMembersApi } from "./campaign-members";
import {
  toCampaign,
  toCreateCampaignDto,
  toUpdateCampaignDto,
  type CampaignWriteForm,
} from "./mappers/campaign.mapper";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ListCampaignsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function fallbackMeta(
  params: ListCampaignsParams | undefined,
  total: number,
): PaginationMeta {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const campaignsApi = {
  async list(
    params?: ListCampaignsParams,
  ): Promise<{ data: Campaign[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(300);
      let data = [...mockCampaigns];
      if (params?.status) data = data.filter((c) => c.status === params.status);
      if (params?.search) {
        const search = params.search.toLowerCase();
        data = data.filter((c) => c.name.toLowerCase().includes(search));
      }
      return { data, meta: fallbackMeta(params, data.length) };
    }

    const res = await apiClient.get<unknown[]>("/campaigns", { ...params });
    return {
      data: res.data.map(toCampaign),
      meta: res.meta ?? fallbackMeta(params, res.data.length),
    };
  },

  async get(id: string): Promise<Campaign> {
    if (isMockMode()) {
      await delay(200);
      const campaign = mockCampaigns.find((c) => c.id === id);
      if (!campaign) throw new Error("Campaign not found");
      return campaign;
    }

    const res = await apiClient.get<unknown>(`/campaigns/${id}`);
    return toCampaign(res.data);
  },

  async create(form: CreateCampaignForm | CampaignWriteForm): Promise<Campaign> {
    if (isMockMode()) {
      await delay(500);
      const now = new Date().toISOString();
      const campaign: Campaign = {
        ...form,
        platforms: form.platforms ?? [],
        status: form.status ?? "DRAFT",
        id: `camp-${Date.now()}`,
        ownerId: "user-admin-1",
        createdAt: now,
        updatedAt: now,
        memberCount: 0,
        completionRate: 0,
      };
      mockCampaigns.push(campaign);
      return campaign;
    }

    const res = await apiClient.post<unknown>(
      "/campaigns",
      toCreateCampaignDto(form),
    );
    return toCampaign(res.data);
  },

  async update(
    id: string,
    form: Partial<CreateCampaignForm> | CampaignWriteForm,
  ): Promise<Campaign> {
    if (isMockMode()) {
      await delay(400);
      const idx = mockCampaigns.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Campaign not found");
      mockCampaigns[idx] = {
        ...mockCampaigns[idx],
        ...form,
        platforms: form.platforms ?? mockCampaigns[idx].platforms,
        updatedAt: new Date().toISOString(),
      };
      return mockCampaigns[idx];
    }

    const res = await apiClient.patch<unknown>(
      `/campaigns/${id}`,
      toUpdateCampaignDto(form as CampaignWriteForm),
    );
    return toCampaign(res.data);
  },

  async archive(id: string): Promise<Campaign> {
    if (isMockMode()) {
      await delay(300);
      const idx = mockCampaigns.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Campaign not found");
      mockCampaigns[idx] = {
        ...mockCampaigns[idx],
        status: "ARCHIVED",
        updatedAt: new Date().toISOString(),
      };
      return mockCampaigns[idx];
    }

    const res = await apiClient.patch<unknown>(`/campaigns/${id}/archive`);
    return toCampaign(res.data);
  },

  async listMembers(campaignId: string) {
    const result = await campaignMembersApi.list(campaignId);
    return result.data;
  },
};
