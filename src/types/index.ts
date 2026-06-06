// ============================================
// Types — BuzzTrack / ROSS
// ============================================

// --- Enums ---
export type UserRole = "ADMIN" | "BUZZER" | "PIC" | "VIEWER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type Platform = "INSTAGRAM" | "TIKTOK" | "X_TWITTER" | "FACEBOOK";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type SocialAccountStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type SocialAccountCategory =
  | "MEDIA"
  | "KOL"
  | "BRAND"
  | "COMMUNITY"
  | "OTHER";
export type BlastTargetStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type BlastAttemptStatus =
  | "AVAILABLE"
  | "KEPT"
  | "COMPLETED"
  | "RELEASED"
  | "EXPIRED"
  | "CANCELLED";
export type Stance = "PRO" | "KONTRA";
export type CommentCommandStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type CommentTaskStatus =
  | "AVAILABLE"
  | "KEPT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "RELEASED"
  | "EXPIRED"
  | "CANCELLED";
export type ExportFormat = "PDF" | "EXCEL";
export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ExportScope =
  | "SUMMARY"
  | "BLAST_REPORTS"
  | "COMMENT_TASKS"
  | "FULL";
export type OrgUnitStatus = "ACTIVE" | "INACTIVE";
export type PostingOrderStatus =
  | "PUBLISHED_TO_QUEUE"
  | "CLAIMED"
  | "COMPLETED"
  | "CANCELLED";
export type PostingSubmissionStatus =
  | "SUBMITTED"
  | "APPROVED_FOR_BLAST"
  | "REJECTED";

// --- User ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  picUnitId?: string | null;
  image?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface OrgUnit {
  id: string;
  name: string;
  code?: string;
  status: OrgUnitStatus;
  parentId?: string | null;
  parent?: Pick<OrgUnit, "id" | "name" | "code" | "status">;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  childCount?: number;
  postingOrderCount?: number;
}

// --- Campaign ---
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  platforms: Platform[];
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
  // computed
  memberCount?: number;
  blastTargetCount?: number;
  commentCommandCount?: number;
  completedAttemptCount?: number;
  completionRate?: number;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  user?: User;
  roleInCampaign?: string;
  createdAt: string;
}

// --- Social Account ---
export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName?: string;
  profileUrl: string;
  category: SocialAccountCategory;
  status: SocialAccountStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
  blastTargetCount?: number;
}

// --- Blast Target ---
export interface BlastTarget {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  socialAccountId: string;
  socialAccount?: SocialAccount;
  platform: Platform;
  postUrl: string;
  instruction?: string;
  internalNotes?: string;
  status: BlastTargetStatus;
  submittedBy: string;
  sourceType?: "ADMIN_SUBMITTED" | "BUZZER_SUGGESTED" | "PIC_SUBMISSION";
  reviewStatus?: "APPROVED" | "PENDING" | "REJECTED";
  sourcePostingSubmissionId?: string;
  createdAt: string;
  updatedAt: string;
  // computed
  attempts?: BlastAttempt[];
  latestAttempt?: BlastAttempt;
  totalAttempts?: number;
  completedAttempts?: number;
}

// --- Blast Attempt ---
export interface BlastAttempt {
  id: string;
  blastTargetId: string;
  blastTarget?: BlastTarget;
  attemptNo: number;
  status: BlastAttemptStatus;
  keptBy?: string;
  keptByUser?: User;
  keptAt?: string;
  keepExpiresAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  report?: BlastReport;
}

// --- Blast Report ---
export interface BlastReport {
  id: string;
  blastAttemptId: string;
  blastTargetId?: string;
  campaignId?: string;
  postUrl?: string;
  platform?: Platform;
  socialAccount?: SocialAccount;
  attempt?: BlastAttempt;
  submittedBy: string;
  submittedByUser?: User;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  totalEngagement?: number;
  proofLink: string;
  notes?: string;
  submittedAt: string;
  attemptNo?: number;
  attemptStatus?: BlastAttemptStatus;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

// --- Comment Command ---
export interface CommentCommand {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  socialAccountId?: string;
  socialAccount?: SocialAccount;
  targetPostUrl: string;
  platform: Platform;
  stance: Stance;
  narrative: string;
  instruction?: string;
  requiredSlots: number;
  availableSlots: number;
  keptSlots: number;
  completedSlots: number;
  keepExpiryMinutes: number;
  deadline?: string;
  status: CommentCommandStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
  tasks?: CommentTask[];
  totalTasks?: number;
  completedTasks?: number;
}

// --- Comment Task ---
export interface CommentTask {
  id: string;
  commandId: string;
  command?: CommentCommand;
  taskNo: number;
  status: CommentTaskStatus;
  keptBy?: string;
  keptByUser?: User;
  keptAt?: string;
  keepExpiresAt?: string;
  proofLink?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: UserRole;
  target: string;
  targetType:
    | "campaign"
    | "campaign_member"
    | "blast_target"
    | "blast_attempt"
    | "blast_report"
    | "comment_command"
    | "comment_task"
    | "social_account"
    | "user"
    | "export"
    | "other";
  entityTypeRaw?: string;
  campaignId?: string;
  campaignName?: string;
  details?: string;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ExportRecord {
  id: string;
  campaignId: string;
  campaignName?: string;
  format: ExportFormat;
  scope?: ExportScope;
  status: ExportStatus;
  dateFrom?: string;
  dateTo?: string;
  fileName?: string;
  fileUrl?: string;
  downloadUrl?: string;
  requestedBy: string;
  requestedByName?: string;
  mimeType?: string;
  errorMessage?: string;
  retriedFromId?: string;
  requestedAt?: string;
  startedAt?: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  fileSize?: number;
}

export interface PostingOrder {
  id: string;
  campaignId: string;
  campaign?: Pick<Campaign, "id" | "name" | "status">;
  targetUnitId: string;
  targetUnit?: OrgUnit;
  platform: Platform;
  contentDriveUrl: string;
  scheduledAt: string;
  caption?: string;
  description?: string;
  status: PostingOrderStatus;
  createdById: string;
  createdByUser?: User;
  claimedById?: string | null;
  claimedByUser?: User;
  claimedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  submission?: PostingSubmission;
}

export interface PostingSubmission {
  id: string;
  postingOrderId: string;
  postingOrder?: PostingOrder;
  submittedById: string;
  submittedByUser?: User;
  socialAccountId: string;
  socialAccount?: SocialAccount;
  postedUrl: string;
  proofDriveUrl: string;
  notes?: string;
  status: PostingSubmissionStatus;
  reviewNotes?: string;
  reviewedById?: string | null;
  reviewedByUser?: User;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  blastTargetId?: string;
}

// --- Dashboard ---
export interface GlobalDashboardData {
  activeCampaigns: number;
  activeCampaignsDelta?: string | null;
  activeCampaignsDeltaPositive?: boolean;

  totalViews: number;
  totalViewsDelta?: string | null;
  totalViewsDeltaPositive?: boolean;

  totalEngagement: number;
  totalEngagementDelta?: string | null;
  totalEngagementDeltaPositive?: boolean;

  completionRate: number;
  completionRateDelta?: string | null;
  completionRateDeltaPositive?: boolean;

  overdueTasks: number;
  overdueTasksDelta?: string | null;
  overdueTasksDeltaPositive?: boolean;

  expiredKeeps: number;
  activeBuzzers: number;
  engagementTrend: TrendDataPoint[];
  topBuzzers: BuzzerPerformance[];
  recentActivity: ActivityItem[];
  campaignPerformance: CampaignPerformance[];
}

export interface CampaignDashboardData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReposts: number;
  totalEngagement: number;
  completionRate: number;
  completedAttempts: number;
  totalAttempts: number;
  availableAttempts: number;
  keptAttempts: number;
  expiredAttempts: number;
  completedCommentTasks: number;
  totalCommentTasks: number;
  engagementTrend: TrendDataPoint[];
  platformBreakdown: PlatformBreakdown[];
  topBuzzers: BuzzerPerformance[];
  recentReports: BlastReport[];
  overdueItems: OverdueItem[];
}

export interface BuzzerDashboardData {
  availableBlastLinks: number;
  myKept: number;
  completedToday: number;
  pendingComments: number;
  totalViewsSubmitted: number;
  totalEngagementSubmitted: number;
  myKeptAttempts: BlastAttempt[];
  pendingCommentTasks: CommentTask[];
  expiringSoon: BlastAttempt[];
}

export interface TrendDataPoint {
  date: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  engagement?: number;
}

export interface PlatformBreakdown {
  platform: Platform;
  views: number;
  engagement: number;
  percentage: number;
}

export interface BuzzerPerformance {
  userId: string;
  name: string;
  image?: string;
  completedAttempts: number;
  totalViews: number;
  totalEngagement: number;
  completionRate: number;
  score: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  actor?: string;
}

export interface OverdueItem {
  id: string;
  type: "blast" | "comment";
  title: string;
  actor?: string;
  dueAt: string;
  status: string;
  campaignId: string;
  campaignName: string;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: CampaignStatus;
  views: number;
  completion: number;
  risk: "Low" | "Medium" | "High";
}

// --- API Response ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

// --- Forms ---
export interface CreateCampaignForm {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  platforms: Platform[];
  status: CampaignStatus;
}

export interface CreateBlastTargetForm {
  socialAccountId: string;
  platform: Platform;
  postUrl: string;
  instruction?: string;
  internalNotes?: string;
  createInitialAttempt: boolean;
  keepDurationMinutes?: number;
  status?: BlastTargetStatus;
}

export interface SubmitBlastReportForm {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  proofLink: string;
  notes?: string;
}
