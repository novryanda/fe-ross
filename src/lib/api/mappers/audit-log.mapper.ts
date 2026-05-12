/**
 * Audit log mappers — translate backend `AuditLog` payloads into the UI
 * `AuditLog` shape.
 *
 * Backend shape (see `api/src/audit-logs/audit-log.service.ts#toAuditLogResponse`):
 *   {
 *     id,
 *     campaignId,
 *     actorId,
 *     actor: { id, name, email, role } | null,
 *     action: AuditAction (enum),
 *     entityType: string (PascalCase, e.g. "Campaign"|"BlastReport"|...),
 *     entityId,
 *     oldValues, newValues,
 *     metadata,
 *     ipAddress, userAgent,
 *     createdAt
 *   }
 *
 * The list endpoints return `data: { items, pagination }` (note: service
 * uses `pagination`, not `meta`). `unwrapAuditList` handles both shapes
 * defensively so future backend alignment doesn't break the UI.
 */
import type { ApiResponse, PaginationMeta } from "@/lib/api/types";
import type { AuditLog, UserRole } from "@/types";

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

const ROLE_VALUES = new Set<UserRole>(["ADMIN", "BUZZER", "VIEWER"]);

function asRole(value: unknown): UserRole | undefined {
  return typeof value === "string" && ROLE_VALUES.has(value as UserRole)
    ? (value as UserRole)
    : undefined;
}

/**
 * Normalise backend `entityType` (PascalCase) into the UI enum. Unknown
 * values fall back to `"other"` so the table never crashes on a new backend
 * entity type.
 */
const ENTITY_MAP: Record<string, AuditLog["targetType"]> = {
  Campaign: "campaign",
  CampaignMember: "campaign_member",
  BlastTarget: "blast_target",
  BlastAttempt: "blast_attempt",
  BlastReport: "blast_report",
  CommentCommand: "comment_command",
  CommentTask: "comment_task",
  SocialAccount: "social_account",
  User: "user",
  ExportReport: "export",
  Export: "export",
};

function normalizeEntityType(raw: string): AuditLog["targetType"] {
  if (!raw) return "other";
  if (ENTITY_MAP[raw]) return ENTITY_MAP[raw];
  // lowercase variants coming from legacy mock data
  const lower = raw.toLowerCase();
  const match = Object.entries(ENTITY_MAP).find(
    ([key]) => key.toLowerCase() === lower,
  );
  if (match) return match[1];
  // snake_case passthrough (already UI shape)
  const known: AuditLog["targetType"][] = [
    "campaign",
    "campaign_member",
    "blast_target",
    "blast_attempt",
    "blast_report",
    "comment_command",
    "comment_task",
    "social_account",
    "user",
    "export",
  ];
  if ((known as string[]).includes(lower))
    return lower as AuditLog["targetType"];
  return "other";
}

/**
 * Derive a one-line human-readable "details" string from the action + entity
 * when the backend does not provide one explicitly. Intentionally simple —
 * full diff rendering can be added later via a dedicated drawer.
 */
function deriveDetails(
  action: string,
  entityType: string,
  oldValues: unknown,
  newValues: unknown,
): string | undefined {
  if (typeof action !== "string" || !action) return undefined;
  const label = action.replace(/_/g, " ").toLowerCase();
  const suffix = entityType ? ` ${entityType}` : "";
  if (oldValues && !newValues) return `${label}${suffix}`;
  if (!oldValues && newValues) return `${label}${suffix}`;
  if (oldValues && newValues) return `${label}${suffix}`;
  return `${label}${suffix}`.trim() || undefined;
}

export function toAuditLog(value: unknown): AuditLog {
  const raw = asRecord(value);
  const actor = asRecord(raw.actor);
  const campaign = asRecord(raw.campaign);
  const entityTypeRaw = asString(raw.entityType);

  const actorId =
    asOptionalString(actor.id) ??
    asOptionalString(raw.actorId) ??
    asOptionalString(raw.actor) ??
    "";
  const actorName =
    asOptionalString(actor.name) ?? asOptionalString(raw.actorName);

  return {
    id: asString(raw.id),
    action: asString(raw.action, "UNKNOWN"),
    actor: actorId,
    actorName,
    actorEmail: asOptionalString(actor.email),
    actorRole: asRole(actor.role),
    target:
      asOptionalString(raw.entityId) ?? asOptionalString(raw.target) ?? "",
    targetType: normalizeEntityType(entityTypeRaw || asString(raw.targetType)),
    entityTypeRaw: asOptionalString(entityTypeRaw),
    campaignId: asOptionalString(raw.campaignId) ?? asOptionalString(campaign.id),
    campaignName: asOptionalString(campaign.name),
    details:
      asOptionalString(raw.details) ??
      deriveDetails(
        asString(raw.action),
        entityTypeRaw,
        raw.oldValues ?? raw.oldValue,
        raw.newValues ?? raw.newValue,
      ),
    oldValues: raw.oldValues ?? raw.oldValue,
    newValues: raw.newValues ?? raw.newValue,
    metadata: raw.metadata,
    ipAddress: asOptionalString(raw.ipAddress),
    userAgent: asOptionalString(raw.userAgent),
    timestamp:
      asOptionalString(raw.createdAt) ?? asOptionalString(raw.timestamp) ?? "",
  };
}

/**
 * Audit list endpoints use a nested envelope:
 *   { success: true, data: { items, pagination } }
 * This helper accepts both `pagination` and `meta` keys so we survive any
 * future backend alignment. Pure array payloads (mock mode) also work.
 */
export function unwrapAuditList(response: ApiResponse<unknown>): {
  items: unknown[];
  meta: PaginationMeta | undefined;
} {
  const data = response.data;
  if (Array.isArray(data)) {
    return { items: data, meta: response.meta };
  }
  const record = asRecord(data);
  const items = Array.isArray(record.items) ? record.items : [];
  const metaCandidate =
    (record.meta as PaginationMeta | undefined) ??
    (record.pagination as PaginationMeta | undefined);
  return { items, meta: metaCandidate ?? response.meta };
}
