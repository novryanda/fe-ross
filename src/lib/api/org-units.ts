import type {
  OrgUnit,
  OrgUnitDetail,
  OrgUnitMemberSummary,
  PaginationMeta,
  UserRole,
  UserStatus,
} from "@/types";
import { API_BASE_URL, apiClient, isMockMode } from "./client";

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
    level: asNumber(raw.level),
    memberCount: asNumber(raw.memberCount) ?? asNumber(count.members),
    childCount: asNumber(raw.childCount) ?? asNumber(count.children),
    postingOrderCount:
      asNumber(raw.postingOrderCount) ?? asNumber(count.postingOrders),
  };
}

function toOrgUnitDetail(value: unknown): OrgUnitDetail {
  const raw = asRecord(value);
  const ancestors = Array.isArray(raw.ancestors)
    ? raw.ancestors.map((item) => {
        const ancestor = asRecord(item);
        return {
          id: asString(ancestor.id),
          name: asString(ancestor.name),
          code: typeof ancestor.code === "string" ? ancestor.code : undefined,
        };
      })
    : undefined;
  const members: OrgUnitMemberSummary[] | undefined = Array.isArray(raw.members)
    ? raw.members.map((item) => {
        const member = asRecord(item);
        return {
          id: asString(member.id),
          name: asString(member.name),
          email: asString(member.email),
          status: asString(member.status, "ACTIVE") as UserStatus,
          role: asString(member.role, "PIC") as UserRole,
        };
      })
    : undefined;

  return {
    ...toOrgUnit(raw),
    ancestors,
    members,
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
  level?: number | "";
  picAssigned?: "ASSIGNED" | "UNASSIGNED" | "";
  view?: "flat" | "tree";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OrgUnitWriteDto {
  name: string;
  code?: string;
  parentId?: string;
  status?: OrgUnit["status"];
}

export interface OrgUnitMoveDto {
  parentId?: string | null;
}

function buildQueryString(params?: OrgUnitListParams): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
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
      level: params.level || undefined,
      picAssigned: params.picAssigned || undefined,
      view: params.view,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return {
      data: response.data.map(toOrgUnit),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async getById(id: string): Promise<OrgUnitDetail> {
    const response = await apiClient.get<unknown>(`/org-units/${id}`);
    return toOrgUnitDetail(response.data);
  },

  async create(dto: OrgUnitWriteDto): Promise<OrgUnit> {
    const response = await apiClient.post<unknown>("/org-units", dto);
    return toOrgUnit(response.data);
  },

  async update(id: string, dto: Partial<OrgUnitWriteDto>): Promise<OrgUnit> {
    const response = await apiClient.patch<unknown>(`/org-units/${id}`, dto);
    return toOrgUnit(response.data);
  },

  async move(id: string, dto: OrgUnitMoveDto): Promise<OrgUnit> {
    const response = await apiClient.patch<unknown>(`/org-units/${id}/move`, dto);
    return toOrgUnit(response.data);
  },

  async delete(id: string): Promise<void> {
    if (isMockMode()) {
      await delay(150);
      return;
    }

    await apiClient.delete<unknown>(`/org-units/${id}`);
  },

  async exportCsv(params: OrgUnitListParams = {}): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/org-units/export${buildQueryString(params)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "text/csv",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Gagal mengekspor data PIC structure.");
    }

    return response.blob();
  },
};
