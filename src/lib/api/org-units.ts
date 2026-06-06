import type { OrgUnit, PaginationMeta } from "@/types";
import { apiClient, isMockMode } from "./client";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toOrgUnit(value: unknown): OrgUnit {
  const raw = asRecord(value);
  const parent = asRecord(raw.parent);
  const count = asRecord(raw._count);

  return {
    id: asString(raw.id),
    name: asString(raw.name),
    code: typeof raw.code === "string" ? raw.code : undefined,
    status: asString(raw.status, "ACTIVE") as OrgUnit["status"],
    parentId:
      typeof raw.parentId === "string"
        ? raw.parentId
        : typeof raw.parent_id === "string"
          ? (raw.parent_id as string)
          : undefined,
    parent: parent.id
      ? {
          id: asString(parent.id),
          name: asString(parent.name),
          code: typeof parent.code === "string" ? parent.code : undefined,
          status: asString(parent.status, "ACTIVE") as OrgUnit["status"],
        }
      : undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    memberCount: asNumber(count.members),
    childCount: asNumber(count.children),
    postingOrderCount: asNumber(count.postingOrders),
  };
}

function fallbackMeta(page?: number, limit?: number, total = 0): PaginationMeta {
  const safePage = page ?? 1;
  const safeLimit = limit ?? 20;
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export interface OrgUnitListParams {
  page?: number;
  limit?: number;
  status?: OrgUnit["status"] | "";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OrgUnitWriteDto {
  name: string;
  code?: string;
  parentId?: string;
  status?: OrgUnit["status"];
}

export const orgUnitsApi = {
  async list(
    params: OrgUnitListParams = {},
  ): Promise<{ data: OrgUnit[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(150);
      return { data: [], meta: fallbackMeta(params.page, params.limit, 0) };
    }

    const response = await apiClient.get<unknown[]>("/org-units", {
      page: params.page,
      limit: params.limit,
      status: params.status || undefined,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return {
      data: response.data.map(toOrgUnit),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async create(dto: OrgUnitWriteDto): Promise<OrgUnit> {
    const response = await apiClient.post<unknown>("/org-units", dto);
    return toOrgUnit(response.data);
  },

  async update(id: string, dto: Partial<OrgUnitWriteDto>): Promise<OrgUnit> {
    const response = await apiClient.patch<unknown>(`/org-units/${id}`, dto);
    return toOrgUnit(response.data);
  },
};
