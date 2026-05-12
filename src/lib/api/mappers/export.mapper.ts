/**
 * Export mappers — translate backend `ExportReport` payloads into the UI
 * `ExportRecord` shape used by Reports / Exports pages.
 *
 * Backend shape (see `api/src/exports/exports.service.ts#toExportResponse`):
 *   {
 *     id, campaignId,
 *     campaign: { id, name, status, startDate, endDate },
 *     format: "PDF"|"EXCEL",
 *     status: "PENDING"|"PROCESSING"|"COMPLETED"|"FAILED",
 *     fileName, fileUrl, fileSize, mimeType,
 *     requestedBy: { id, name, email, role },
 *     dateFrom, dateTo, startedAt, completedAt, failedAt, createdAt
 *   }
 *
 * Mock / UI shape keeps a flatter `ExportRecord` with `completedAt` instead of
 * `generatedAt` and `requestedBy` as a plain string id.
 */
import type {
  ExportFormat,
  ExportRecord,
  ExportScope,
  ExportStatus,
} from "@/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

const FORMAT_VALUES = new Set<ExportFormat>(["PDF", "EXCEL"]);
const STATUS_VALUES = new Set<ExportStatus>([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
const SCOPE_VALUES = new Set<ExportScope>([
  "SUMMARY",
  "BLAST_REPORTS",
  "COMMENT_TASKS",
  "FULL",
]);

function asFormat(value: unknown): ExportFormat {
  if (typeof value === "string" && FORMAT_VALUES.has(value as ExportFormat)) {
    return value as ExportFormat;
  }
  return "PDF";
}

function asStatus(value: unknown): ExportStatus {
  if (typeof value === "string" && STATUS_VALUES.has(value as ExportStatus)) {
    return value as ExportStatus;
  }
  return "PROCESSING";
}

function asScope(value: unknown): ExportScope | undefined {
  if (typeof value === "string" && SCOPE_VALUES.has(value as ExportScope)) {
    return value as ExportScope;
  }
  return undefined;
}

export function toExportRecord(value: unknown): ExportRecord {
  const raw = asRecord(value);
  const campaign = asRecord(raw.campaign);
  const requester = asRecord(raw.requestedBy);

  const requestedById =
    asOptionalString(requester.id) ?? asOptionalString(raw.requestedBy) ?? "";
  const requestedByName =
    asOptionalString(requester.name) ?? asOptionalString(raw.requestedByName);

  return {
    id: asString(raw.id),
    campaignId: asString(raw.campaignId) || asString(campaign.id),
    campaignName:
      asOptionalString(campaign.name) ?? asOptionalString(raw.campaignName),
    format: asFormat(raw.format),
    scope: asScope(raw.scope),
    status: asStatus(raw.status),
    dateFrom: asOptionalString(raw.dateFrom),
    dateTo: asOptionalString(raw.dateTo),
    fileName: asOptionalString(raw.fileName),
    fileUrl: asOptionalString(raw.fileUrl),
    downloadUrl:
      asOptionalString(raw.downloadUrl) ?? asOptionalString(raw.fileUrl),
    requestedBy: requestedById,
    requestedByName,
    mimeType: asOptionalString(raw.mimeType),
    errorMessage: asOptionalString(raw.errorMessage),
    retriedFromId: asOptionalString(raw.retriedFromId),
    requestedAt: asOptionalString(raw.requestedAt) ?? asOptionalString(raw.createdAt),
    startedAt: asOptionalString(raw.startedAt),
    createdAt: asString(raw.createdAt),
    completedAt:
      asOptionalString(raw.completedAt) ?? asOptionalString(raw.generatedAt),
    failedAt: asOptionalString(raw.failedAt),
    fileSize: asNumber(raw.fileSize),
  };
}

export interface CreateExportForm {
  format: ExportFormat;
  scope?: ExportScope;
  dateFrom?: string;
  dateTo?: string;
}

export function toCreateExportDto(form: CreateExportForm): {
  format: ExportFormat;
  scope?: ExportScope;
  dateFrom?: string;
  dateTo?: string;
} {
  return {
    format: form.format,
    scope: form.scope,
    dateFrom: form.dateFrom || undefined,
    dateTo: form.dateTo || undefined,
  };
}
