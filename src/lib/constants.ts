import type {
  Platform,
  SocialAccountCategory,
  CampaignStatus,
  BlastAttemptStatus,
  UserRole,
} from "@/types";

export const PLATFORMS: { value: Platform; label: string; icon: string; emoji: string }[] = [
  { value: "INSTAGRAM", label: "Instagram", icon: "/instagram.svg", emoji: "📸" },
  { value: "TIKTOK", label: "TikTok", icon: "/tiktok.svg", emoji: "🎵" },
  { value: "X_TWITTER", label: "X (Twitter)", icon: "/x.svg", emoji: "𝕏" },
  { value: "FACEBOOK", label: "Facebook", icon: "/facebook.svg", emoji: "f" },
];

export const SOCIAL_ACCOUNT_CATEGORIES: {
  value: SocialAccountCategory;
  label: string;
}[] = [
  { value: "MEDIA", label: "Media" },
  { value: "KOL", label: "KOL / Influencer" },
  { value: "BRAND", label: "Brand" },
  { value: "COMMUNITY", label: "Community" },
  { value: "OTHER", label: "Other" },
];

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
];
export const ATTEMPT_STATUSES: BlastAttemptStatus[] = [
  "AVAILABLE",
  "KEPT",
  "COMPLETED",
  "RELEASED",
  "EXPIRED",
  "CANCELLED",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  BUZZER: "Buzzer",
  PIC: "PIC",
  VIEWER: "Viewer",
};
export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "var(--violet)",
  BUZZER: "var(--cyan)",
  PIC: "var(--status-expired)",
  VIEWER: "var(--status-kept)",
};

export const KEEP_DURATION_DEFAULT = 120; // minutes
export const KEEP_EXPIRY_WARNING_MINUTES = 15;

export const ADMIN_ONLY_ROUTES = ["/network", "/audit", "/campaigns/new"];
export const BUZZER_ONLY_ROUTES = [
  "/blast-queue",
  "/my-blasts",
  "/comment-tasks",
  "/my-reports",
];
export const PUBLIC_ROUTES = ["/login", "/unauthorized"];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // User / profile
  USER_CREATED: "User Created",
  USER_UPDATED: "User Updated",
  USER_STATUS_CHANGED: "User Status Changed",
  USER_PASSWORD_RESET_REQUESTED: "Password Reset Requested",
  USER_PIC_UNIT_ASSIGNED: "PIC Unit Assigned",
  PROFILE_UPDATED: "Profile Updated",
  PASSWORD_CHANGED: "Password Changed",
  // Campaign
  CAMPAIGN_CREATED: "Campaign Created",
  CAMPAIGN_UPDATED: "Campaign Updated",
  CAMPAIGN_ARCHIVED: "Campaign Archived",
  CAMPAIGN_MEMBER_ADDED: "Member Added",
  CAMPAIGN_MEMBER_REMOVED: "Member Removed",
  // Social account
  SOCIAL_ACCOUNT_CREATED: "Social Account Created",
  SOCIAL_ACCOUNT_UPDATED: "Social Account Updated",
  SOCIAL_ACCOUNT_STATUS_UPDATED: "Social Account Status Updated",
  // Blast
  BLAST_TARGET_CREATED: "Blast Target Created",
  BLAST_TARGET_UPDATED: "Blast Target Updated",
  BLAST_TARGET_STATUS_UPDATED: "Blast Target Status Updated",
  BLAST_ATTEMPT_CREATED: "Blast Attempt Created",
  REBLAST_ATTEMPT_CREATED: "Reblast Attempt Created",
  BLAST_ATTEMPT_KEPT: "Blast Attempt Kept",
  BLAST_ATTEMPT_RELEASED: "Blast Attempt Released",
  BLAST_ATTEMPT_EXPIRED: "Blast Attempt Expired",
  BLAST_ATTEMPT_CANCELLED: "Blast Attempt Cancelled",
  BLAST_REPORT_SUBMITTED: "Blast Report Submitted",
  BLAST_TARGET_CREATED_FROM_PIC_SUBMISSION:
    "Blast Target Created From PIC Submission",
  // Comment
  COMMENT_COMMAND_CREATED: "Comment Command Created",
  COMMENT_COMMAND_UPDATED: "Comment Command Updated",
  COMMENT_COMMAND_ASSIGNED: "Comment Command Assigned",
  COMMENT_COMMAND_PAUSED: "Comment Command Paused",
  COMMENT_COMMAND_ARCHIVED: "Comment Command Archived",
  COMMENT_TASK_KEPT: "Comment Task Kept",
  COMMENT_TASK_RELEASED: "Comment Task Released",
  COMMENT_TASK_STARTED: "Comment Task Started",
  COMMENT_TASK_COMPLETED: "Comment Task Completed",
  COMMENT_TASK_REJECTED: "Comment Task Rejected",
  COMMENT_TASK_BLOCKED: "Comment Task Blocked",
  COMMENT_TASK_EXPIRED: "Comment Task Expired",
  ORG_UNIT_CREATED: "Org Unit Created",
  ORG_UNIT_UPDATED: "Org Unit Updated",
  POSTING_ORDER_CREATED: "Posting Order Created",
  POSTING_ORDER_UPDATED: "Posting Order Updated",
  POSTING_ORDER_CLAIMED: "Posting Order Claimed",
  POSTING_ORDER_RELEASED: "Posting Order Released",
  POSTING_ORDER_SUBMITTED: "Posting Order Submitted",
  POSTING_SUBMISSION_STATUS_UPDATED: "Posting Submission Status Updated",
  // Export
  EXPORT_REQUESTED: "Export Requested",
  EXPORT_GENERATED: "Export Generated",
  EXPORT_COMPLETED: "Export Completed",
  EXPORT_FAILED: "Export Failed",
};
