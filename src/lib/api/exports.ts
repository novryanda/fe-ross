/**
 * Exports API adapter — mock + real backend contract v1.3.
 *
 * Real-mode endpoints (module 14):
 *   POST /api/v1/campaigns/:campaignId/exports   (ADMIN)    body: { format }
 *   GET  /api/v1/exports                         (ADMIN,VIEWER)
 *   GET  /api/v1/exports/:exportId               (ADMIN,VIEWER)
 *
 * Mock mode keeps a local in-memory copy of `mockExports` so UI flows stay
 * functional without the backend. Pages should call this adapter directly
 * and never import `mockExports` themselves.
 */
import type {
  ExportFormat,
  ExportRecord,
  ExportScope,
  PaginationMeta,
} from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError } from "./errors";
import {
  toCreateExportDto,
  toExportRecord,
  type CreateExportForm,
} from "./mappers/export.mapper";
import { mockExports as seedMockExports } from "@/lib/mock-data";

const MOCK_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Local mutable copy so POST/mock completion doesn't mutate the shared seed
// data in ways that surprise other pages between navigations.
const mockExports: ExportRecord[] = [...seedMockExports];

function fallbackMeta(
  params: ListExportsParams | undefined,
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

export interface ListExportsParams {
  page?: number;
  limit?: number;
  campaignId?: string;
  format?: ExportFormat | "";
  status?: string;
  requestedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function applyMockFilters(
  data: ExportRecord[],
  params: ListExportsParams | undefined,
): ExportRecord[] {
  if (!params) return data;
  let items = [...data];
  if (params.campaignId)
    items = items.filter((e) => e.campaignId === params.campaignId);
  if (params.format) items = items.filter((e) => e.format === params.format);
  if (params.status) items = items.filter((e) => e.status === params.status);
  if (params.requestedBy)
    items = items.filter((e) => e.requestedBy === params.requestedBy);
  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime();
    items = items.filter((e) => new Date(e.createdAt).getTime() >= from);
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo).getTime();
    items = items.filter((e) => new Date(e.createdAt).getTime() <= to);
  }
  return items;
}

export const exportsApi = {
  /**
   * List all exports the current user is allowed to see. Viewer access is
   * enforced server-side (completed + member campaign only).
   */
  async list(
    params?: ListExportsParams,
  ): Promise<{ data: ExportRecord[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const data = applyMockFilters(mockExports, params);
      return { data, meta: fallbackMeta(params, data.length) };
    }
    const res = await apiClient.get<unknown[]>("/exports", {
      page: params?.page,
      limit: params?.limit,
      campaignId: params?.campaignId,
      format: params?.format || undefined,
      status: params?.status || undefined,
      requestedBy: params?.requestedBy,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
    return {
      data: res.data.map(toExportRecord),
      meta: res.meta ?? fallbackMeta(params, res.data.length),
    };
  },

  /** Convenience wrapper — same endpoint, forced campaignId filter. */
  async listByCampaign(
    campaignId: string,
    params: Omit<ListExportsParams, "campaignId"> = {},
  ): Promise<{ data: ExportRecord[]; meta: PaginationMeta }> {
    return exportsApi.list({ ...params, campaignId });
  },

  async get(exportId: string): Promise<ExportRecord> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockExports.find((e) => e.id === exportId);
      if (!found) throw new ApiError("NOT_FOUND", "Export tidak ditemukan.");
      return found;
    }
    const res = await apiClient.get<unknown>(`/exports/${exportId}`);
    return toExportRecord(res.data);
  },

  /**
   * Request a new export for a campaign. Backend MVP accepts `{ format }`
   * only and always generates a full snapshot; FE `scope` is recorded in
   * the mock record so the UI stays consistent but is ignored by real mode
   * until backend support lands.
   */
  async create(
    campaignId: string,
    form: CreateExportForm,
  ): Promise<ExportRecord> {
    if (isMockMode()) {
      await delay(400);
      const now = new Date().toISOString();
      const created: ExportRecord = {
        id: `exp-${Date.now()}`,
        campaignId,
        campaignName: mockExports.find((e) => e.campaignId === campaignId)
          ?.campaignName,
        format: form.format,
        scope: form.scope ?? "FULL",
        status: "PROCESSING",
        requestedBy: "user-admin-1",
        requestedByName: "Reza Admin",
        createdAt: now,
      };
      mockExports.unshift(created);
      // Simulate completion after a short delay.
      setTimeout(() => {
        const idx = mockExports.findIndex((e) => e.id === created.id);
        if (idx === -1) return;
        mockExports[idx] = {
          ...mockExports[idx],
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          downloadUrl: `/api/v1/exports/${created.id}/download.${form.format === "PDF" ? "pdf" : "xlsx"}`,
          fileSize: 150000,
        };
      }, 2000);
      return created;
    }
    const res = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/exports`,
      toCreateExportDto(form),
    );
    return toExportRecord(res.data);
  },

  /**
   * Backward-compatible helper kept for the `/campaigns/[id]/exports` page
   * buttons which only pass a format. Prefer `exportsApi.create` for new
   * call sites.
   */
  async requestExport(
    campaignId: string,
    format: ExportFormat,
    scope: ExportScope = "FULL",
  ): Promise<ExportRecord> {
    return exportsApi.create(campaignId, { format, scope });
  },

  /**
   * Resolve the absolute URL for downloading a completed export. Returns
   * `null` when the backend has not produced a downloadable asset yet.
   */
  downloadUrl(record: ExportRecord): string | null {
    if (!record.downloadUrl) return null;
    return record.downloadUrl;
  },
};
