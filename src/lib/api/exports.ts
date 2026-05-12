/**
 * Exports API adapter — mock + real backend contract v1.3.
 *
 * Real-mode endpoints (module 14):
 *   POST /api/v1/campaigns/:campaignId/exports   (ADMIN)
 *   GET  /api/v1/exports                         (ADMIN,VIEWER)
 *   GET  /api/v1/exports/:exportId               (ADMIN,VIEWER)
 *   GET  /api/v1/exports/:exportId/download      (ADMIN,VIEWER)
 *   POST /api/v1/exports/:exportId/retry         (ADMIN)
 *
 * Mock mode keeps a local in-memory copy of `mockExports` so UI flows stay
 * functional without the backend. Pages should call this adapter directly
 * and never import `mockExports` themselves.
 */
import type {
  ExportFormat,
  ExportRecord,
  ExportScope,
  ExportStatus,
  PaginationMeta,
} from "@/types";
import { API_BASE_URL, apiClient, isMockMode } from "./client";
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

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

function parseContentDispositionFileName(value: string | null): string | null {
  if (!value) return null;
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  const quoted = value.match(/filename="([^"]+)"/i)?.[1];
  if (quoted) return quoted;
  return value.match(/filename=([^;]+)/i)?.[1]?.trim() ?? null;
}

async function parseDownloadError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as unknown;
    const record = asRecord(payload);
    const error = asRecord(record.error);
    const code =
      typeof error.code === "string" ? error.code : "REQUEST_ERROR";
    const message =
      typeof error.message === "string"
        ? error.message
        : response.statusText || "Gagal mengunduh export.";
    const details = Array.isArray(error.details) ? error.details : [];
    return new ApiError(code, message, details, response.status);
  } catch {
    return new ApiError(
      response.status === 404 ? "EXPORT_FILE_NOT_FOUND" : "REQUEST_ERROR",
      response.statusText || "Gagal mengunduh export.",
      [],
      response.status,
    );
  }
}

export interface ListExportsParams {
  page?: number;
  limit?: number;
  campaignId?: string;
  format?: ExportFormat | "";
  scope?: ExportScope | "";
  status?: ExportStatus | "";
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
  if (params.scope) items = items.filter((e) => e.scope === params.scope);
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
    const res = await apiClient.get<unknown>("/exports", {
      page: params?.page,
      limit: params?.limit,
      campaignId: params?.campaignId,
      format: params?.format || undefined,
      scope: params?.scope || undefined,
      status: params?.status || undefined,
      requestedBy: params?.requestedBy,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
    const payload = asRecord(res.data);
    const items = Array.isArray(res.data)
      ? res.data
      : Array.isArray(payload.items)
        ? payload.items
        : [];
    const meta =
      (payload.pagination as PaginationMeta | undefined) ??
      (payload.meta as PaginationMeta | undefined) ??
      res.meta;
    return {
      data: items.map(toExportRecord),
      meta: meta ?? fallbackMeta(params, items.length),
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
        dateFrom: form.dateFrom || undefined,
        dateTo: form.dateTo || undefined,
        status: "PROCESSING",
        requestedBy: "user-admin-1",
        requestedByName: "Reza Admin",
        requestedAt: now,
        startedAt: now,
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
          fileName: `export_${created.campaignId}_${created.id}.${form.format === "PDF" ? "pdf" : "xlsx"}`,
          fileUrl: `/api/v1/exports/${created.id}/download`,
          downloadUrl: `/api/v1/exports/${created.id}/download`,
          fileSize: 150000,
          mimeType:
            form.format === "PDF"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ExportRecord> {
    return exportsApi.create(campaignId, { format, scope, dateFrom, dateTo });
  },

  async retryExport(exportId: string): Promise<ExportRecord> {
    if (isMockMode()) {
      await delay(400);
      const source = mockExports.find((e) => e.id === exportId);
      if (!source) throw new ApiError("NOT_FOUND", "Export tidak ditemukan.");
      if (source.status !== "FAILED") {
        throw new ApiError(
          "EXPORT_RETRY_NOT_ALLOWED",
          "Hanya export FAILED yang dapat di-retry.",
        );
      }

      const now = new Date().toISOString();
      const created: ExportRecord = {
        ...source,
        id: `exp-retry-${Date.now()}`,
        status: "PROCESSING",
        fileName: undefined,
        fileUrl: undefined,
        downloadUrl: undefined,
        fileSize: undefined,
        mimeType: undefined,
        errorMessage: undefined,
        retriedFromId: source.id,
        requestedAt: now,
        startedAt: now,
        completedAt: undefined,
        failedAt: undefined,
        createdAt: now,
      };
      mockExports.unshift(created);
      setTimeout(() => {
        const idx = mockExports.findIndex((e) => e.id === created.id);
        if (idx === -1) return;
        mockExports[idx] = {
          ...mockExports[idx],
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          fileName: `export_${created.campaignId}_${created.id}.${created.format === "PDF" ? "pdf" : "xlsx"}`,
          fileUrl: `/api/v1/exports/${created.id}/download`,
          downloadUrl: `/api/v1/exports/${created.id}/download`,
          fileSize: 150000,
        };
      }, 2000);
      return created;
    }

    const res = await apiClient.post<unknown>(`/exports/${exportId}/retry`);
    return toExportRecord(res.data);
  },

  getDownloadUrl(exportId: string): string {
    return `${API_BASE_URL}/exports/${exportId}/download`;
  },

  async downloadExport(record: ExportRecord): Promise<void> {
    if (record.status !== "COMPLETED") {
      throw new ApiError("EXPORT_NOT_READY", "Export belum siap diunduh.");
    }

    if (isMockMode()) {
      const fileName =
        record.fileName ??
        `export.${record.format === "PDF" ? "pdf" : "xlsx"}`;
      const blob = new Blob([`Mock export ${record.id}`], {
        type: record.mimeType ?? "application/octet-stream",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return;
    }

    const response = await fetch(exportsApi.getDownloadUrl(record.id), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw await parseDownloadError(response);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const headerFileName = parseContentDispositionFileName(disposition);
    const fileName =
      headerFileName ??
      record.fileName ??
      `export.${record.format === "PDF" ? "pdf" : "xlsx"}`;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
