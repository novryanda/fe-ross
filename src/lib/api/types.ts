/**
 * Shared API envelope and domain record types used by every module under
 * `src/lib/api/*`. UI-level types stay in `@/types` and are adapted to these
 * shapes inside each module.
 */
import type {
  AuditLog as UiAuditLog,
  BlastAttempt as UiBlastAttempt,
  BlastReport as UiBlastReport,
  BlastTarget as UiBlastTarget,
  Campaign as UiCampaign,
  CampaignMember as UiCampaignMember,
  CommentCommand as UiCommentCommand,
  CommentTask as UiCommentTask,
  ExportRecord as UiExportRecord,
  SocialAccount as UiSocialAccount,
  User as UiUser,
  UserRole,
  UserStatus,
} from "@/types";

// ---------- Envelope ----------

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message?: string;
      [key: string]: unknown;
    }>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Shape used by a handful of endpoints (e.g. audit-logs) that embed pagination
 * under `data: { items, meta }` instead of returning a flat array in `data`.
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ---------- Domain records (re-export UI types for convenience) ----------

export type User = UiUser;
export type Campaign = UiCampaign;
export type CampaignMember = UiCampaignMember;
export type SocialAccount = UiSocialAccount;
export type BlastTarget = UiBlastTarget;
export type BlastAttempt = UiBlastAttempt;
export type BlastReport = UiBlastReport;
export type CommentCommand = UiCommentCommand;
export type CommentTask = UiCommentTask;
export type AuditLog = UiAuditLog;
export type ExportRecord = UiExportRecord;

// ---------- Users module (backend contract v1.3.1) ----------

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  campaignCount?: number;
}

export interface UserActivitySummary {
  userId: string;
  role: UserRole;
  completedBlastAttempts: number;
  completedCommentTasks: number;
  submittedReports: number;
  assignedCampaigns: number;
  lastActivityAt: string | null;
}

export interface UserSession {
  id: string;
  tokenFingerprint: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  impersonated: boolean;
}
