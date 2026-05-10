/**
 * Audit Logs API adapter — mock + real backend contract v1.3.
 *
 * Real-mode endpoints (module 13):
 *   GET /api/v1/audit-logs                         (ADMIN)
 *   GET /api/v1/campaigns/:campaignId/audit-logs   (ADMIN)
 *
 * Both endpoints return a nested envelope:
 *   { success: true, data: { items, pagination } }
 * `unwrapAuditList` normalises this so the mapper output stays consistent
 * with mock mode (which uses a flat array).
 */
import type { AuditLog, PaginationMeta } from "@/types";
import { apiClient, isMockMode } from "./client";
import { toAuditLog, unwrapAuditList } from "./mappers/audit-log.mapper";
import { mockAuditLogs } from "@/lib/mock-data";

const MOCK_LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  campaignId?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function fallbackMeta(
  params: ListAuditLogsParams | undefined,
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

function applyMockFilters(
  data: AuditLog[],
  params: ListAuditLogsParams | undefined,
): AuditLog[] {
  if (!params) return data;
  let items = [...data];
  if (params.campaignId) {
    items = items.filter((log) => log.campaignId === params.campaignId);
  }
  if (params.actorId)
    items = items.filter((log) => log.actor === params.actorId);
  if (params.action)
    items = items.filter((log) => log.action === params.action);
  if (params.entityType) {
    const target = params.entityType.toLowerCase();
    items = items.filter(
      (log) =>
        log.targetType.toLowerCase() === target ||
        log.entityTypeRaw?.toLowerCase() === target,
    );
  }
  if (params.entityId)
    items = items.filter((log) => log.target === params.entityId);
  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime();
    items = items.filter((log) => new Date(log.timestamp).getTime() >= from);
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo).getTime();
    items = items.filter((log) => new Date(log.timestamp).getTime() <= to);
  }
  if (params.search) {
    const needle = params.search.toLowerCase();
    items = items.filter(
      (log) =>
        log.details?.toLowerCase().includes(needle) ||
        log.actorName?.toLowerCase().includes(needle) ||
        log.action.toLowerCase().includes(needle) ||
        log.target.toLowerCase().includes(needle),
    );
  }
  return items;
}

export const auditLogsApi = {
  async list(
    params?: ListAuditLogsParams,
  ): Promise<{ data: AuditLog[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const data = applyMockFilters(mockAuditLogs, params);
      return { data, meta: fallbackMeta(params, data.length) };
    }

    const path = params?.campaignId
      ? `/campaigns/${params.campaignId}/audit-logs`
      : "/audit-logs";

    const { campaignId: _campaignId, search: _search, ...query } = params ?? {};
    void _campaignId;
    // `search` is not a backend query param today; keep it client-side for
    // mock mode and drop it here so we don't send garbage to the API.
    void _search;

    const res = await apiClient.get<unknown>(path, {
      page: query.page,
      limit: query.limit,
      actorId: query.actorId,
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const { items, meta } = unwrapAuditList(res);
    return {
      data: items.map(toAuditLog),
      meta: meta ?? fallbackMeta(params, items.length),
    };
  },

  async listByCampaign(
    campaignId: string,
    params: Omit<ListAuditLogsParams, "campaignId"> = {},
  ): Promise<{ data: AuditLog[]; meta: PaginationMeta }> {
    return auditLogsApi.list({ ...params, campaignId });
  },
};
