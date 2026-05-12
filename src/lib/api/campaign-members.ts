/**
 * Campaign Members API - admin-only endpoints scoped under a campaign.
 */
import type { CampaignMember, PaginationMeta } from "@/types";
import { mockCampaignMembers } from "@/lib/mock-data";
import { apiClient, isMockMode } from "./client";
import {
  toAddMembersDto,
  toCampaignMember,
  type AddCampaignMembersDto,
  type CampaignFormMembers,
  type CampaignMemberRole,
} from "./mappers/campaign.mapper";

type RawMemberList =
  | unknown[]
  | {
      items?: unknown[];
      data?: unknown[];
      meta?: PaginationMeta;
    };

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ListCampaignMembersParams {
  page?: number;
  limit?: number;
  memberRole?: CampaignMemberRole;
  status?: "ACTIVE" | "INACTIVE";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function fallbackMeta(
  params: ListCampaignMembersParams | undefined,
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

function unwrapMemberList(
  value: RawMemberList,
  params?: ListCampaignMembersParams,
): { rows: unknown[]; meta: PaginationMeta } {
  if (Array.isArray(value)) {
    return { rows: value, meta: fallbackMeta(params, value.length) };
  }

  const rows = Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.data)
      ? value.data
      : [];

  return {
    rows,
    meta: value.meta ?? fallbackMeta(params, rows.length),
  };
}

export const campaignMembersApi = {
  async list(
    campaignId: string,
    params?: ListCampaignMembersParams,
  ): Promise<{ data: CampaignMember[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(200);
      let data = mockCampaignMembers.filter((m) => m.campaignId === campaignId);
      if (params?.memberRole) {
        data = data.filter((m) => m.roleInCampaign?.toUpperCase() === params.memberRole);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        data = data.filter(
          (m) =>
            m.user?.name.toLowerCase().includes(search) ||
            m.user?.email.toLowerCase().includes(search),
        );
      }
      return { data, meta: fallbackMeta(params, data.length) };
    }

    const res = await apiClient.get<RawMemberList>(
      `/campaigns/${campaignId}/members`,
      { ...params },
    );
    const list = unwrapMemberList(res.data, params);
    return {
      data: list.rows.map(toCampaignMember),
      meta: res.meta ?? list.meta,
    };
  },

  async add(
    campaignId: string,
    members: CampaignFormMembers | AddCampaignMembersDto,
  ): Promise<{ data: CampaignMember[]; meta: PaginationMeta }> {
    const dto = "members" in members ? members : toAddMembersDto(members);

    if (isMockMode()) {
      await delay(250);
      const now = new Date().toISOString();
      for (const member of dto.members) {
        const exists = mockCampaignMembers.some(
          (item) =>
            item.campaignId === campaignId && item.userId === member.userId,
        );
        if (!exists) {
          mockCampaignMembers.push({
            id: `cm-${Date.now()}-${member.userId}`,
            campaignId,
            userId: member.userId,
            roleInCampaign: member.memberRole,
            createdAt: now,
          });
        }
      }
      return this.list(campaignId);
    }

    const res = await apiClient.post<RawMemberList>(
      `/campaigns/${campaignId}/members`,
      dto,
    );
    const list = unwrapMemberList(res.data);
    return {
      data: list.rows.map(toCampaignMember),
      meta: res.meta ?? list.meta,
    };
  },

  async remove(campaignId: string, userId: string): Promise<CampaignMember> {
    if (isMockMode()) {
      await delay(200);
      const index = mockCampaignMembers.findIndex(
        (m) => m.campaignId === campaignId && m.userId === userId,
      );
      if (index === -1) throw new Error("Campaign member not found");
      const [removed] = mockCampaignMembers.splice(index, 1);
      return removed;
    }

    const res = await apiClient.delete<unknown>(
      `/campaigns/${campaignId}/members/${userId}`,
    );
    return toCampaignMember(res.data);
  },
};
