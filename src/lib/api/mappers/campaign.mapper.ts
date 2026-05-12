import type {
  BlastReport,
  Campaign,
  CampaignDashboardData,
  CampaignMember,
  CampaignStatus,
  Platform,
  User,
} from "@/types";

export type CampaignMemberRole = "ADMIN" | "BUZZER" | "VIEWER";

export interface CampaignFormMembers {
  adminIds?: string[];
  buzzerIds?: string[];
  viewerIds?: string[];
}

export interface CampaignWriteForm {
  name: string;
  description?: string;
  objective?: string;
  startDate: string;
  endDate?: string;
  platforms?: Platform[];
  status?: CampaignStatus;
  members?: CampaignFormMembers;
  internalNotes?: string;
}

export interface CampaignWriteDto {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: CampaignStatus;
  platforms?: Platform[];
}

export interface CampaignUpdateDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  platforms?: Platform[];
}

export interface AddCampaignMembersDto {
  members: Array<{
    userId: string;
    memberRole: CampaignMemberRole;
  }>;
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return typeof value === "object" && value !== null
    ? (value as RawRecord)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asStatus(
  value: unknown,
  fallback: CampaignStatus = "DRAFT",
): CampaignStatus {
  return value === "ACTIVE" ||
    value === "COMPLETED" ||
    value === "ARCHIVED" ||
    value === "DRAFT"
    ? value
    : fallback;
}

function asPlatform(value: unknown): Platform | undefined {
  return value === "INSTAGRAM" ||
    value === "TIKTOK" ||
    value === "X_TWITTER" ||
    value === "FACEBOOK"
    ? value
    : undefined;
}

function asPlatformArray(value: unknown): Platform[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const platform = asPlatform(item);
        return platform ? [platform] : [];
      })
    : [];
}

function asUser(raw: unknown): User | undefined {
  const value = asRecord(raw);
  const id = asString(value.id);
  const name = asString(value.name);
  const email = asString(value.email);

  if (!id && !name && !email) return undefined;

  return {
    id,
    name: name || "Unknown User",
    email,
    role:
      value.role === "ADMIN" ||
      value.role === "BUZZER" ||
      value.role === "VIEWER"
        ? value.role
        : "VIEWER",
    status: value.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    image: asOptionalString(value.image),
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    updatedAt: asString(value.updatedAt, new Date(0).toISOString()),
    lastLoginAt: asOptionalString(value.lastLoginAt),
  };
}

function countFrom(raw: RawRecord, key: string): number {
  const count = asRecord(raw._count);
  return asNumber(count[key], 0);
}

function optionalCountFrom(raw: RawRecord, key: string): number | undefined {
  const count = asRecord(raw._count);
  return asNullableNumber(count[key]);
}

function uniquePlatforms(platforms: Platform[]): Platform[] {
  return [...new Set(platforms)];
}

function platformsFromCampaign(value: RawRecord): Platform[] {
  const direct = asPlatformArray(value.platforms);
  const single = asPlatform(value.platform);
  const targetPlatforms = asPlatformArray(value.targetPlatforms);
  const blastTargets = Array.isArray(value.blastTargets)
    ? value.blastTargets.flatMap((item) => {
        const target = asRecord(item);
        const platform = asPlatform(target.platform);
        return platform ? [platform] : [];
      })
    : [];

  return uniquePlatforms([
    ...direct,
    ...(single ? [single] : []),
    ...targetPlatforms,
    ...blastTargets,
  ]);
}

function completionFromCampaign(value: RawRecord): number | undefined {
  const direct =
    asNullableNumber(value.completionRate) ??
    asNullableNumber(value.completionPercentage) ??
    asNullableNumber(value.progress);

  if (direct !== undefined) return direct;

  const completedAttempts =
    asNullableNumber(value.completedAttempts) ??
    asNullableNumber(value.completedAttemptCount);
  const totalAttempts =
    asNullableNumber(value.totalAttempts) ??
    asNullableNumber(value.attemptCount);

  if (completedAttempts !== undefined && totalAttempts && totalAttempts > 0) {
    return Math.round((completedAttempts / totalAttempts) * 100);
  }

  const blastTargets = Array.isArray(value.blastTargets)
    ? value.blastTargets
    : [];
  const attempts = blastTargets.flatMap((item) => {
    const target = asRecord(item);
    return Array.isArray(target.attempts) ? target.attempts.map(asRecord) : [];
  });

  if (attempts.length > 0) {
    const completed = attempts.filter(
      (attempt) => attempt.status === "COMPLETED",
    ).length;
    return Math.round((completed / attempts.length) * 100);
  }

  return undefined;
}

export function toCampaign(raw: unknown): Campaign {
  const value = asRecord(raw);
  const createdBy = asUser(value.createdBy);
  const createdById =
    asOptionalString(value.createdById) ??
    asOptionalString(value.ownerId) ??
    createdBy?.id ??
    "";

  return {
    id: asString(value.id),
    name: asString(value.name, "Untitled Campaign"),
    description: asOptionalString(value.description),
    status: asStatus(value.status),
    startDate: asString(value.startDate),
    endDate: asOptionalString(value.endDate),
    // TODO API: campaign list should expose platform summary directly instead of deriving from blastTargets.
    platforms: platformsFromCampaign(value),
    ownerId: createdById,
    owner: createdBy,
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    updatedAt: asString(value.updatedAt, new Date(0).toISOString()),
    memberCount:
      asNullableNumber(value.memberCount) ??
      optionalCountFrom(value, "members"),
    blastTargetCount:
      asNullableNumber(value.blastTargetCount) ??
      optionalCountFrom(value, "blastTargets"),
    completedAttemptCount: asNumber(value.completedAttemptCount, 0),
    // TODO API: campaign list should expose completionRate directly for cheap pagination.
    completionRate: completionFromCampaign(value),
    commentCommandCount: asNumber(
      value.commentCommandCount,
      countFrom(value, "commentCommands"),
    ),
  };
}

export function toCreateCampaignDto(form: CampaignWriteForm): CampaignWriteDto {
  return {
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    startDate: form.startDate,
    endDate: form.endDate || undefined,
    status: form.status,
    platforms: form.platforms,
  };
}

export function toUpdateCampaignDto(
  form: Partial<CampaignWriteForm>,
): CampaignUpdateDto {
  return {
    ...(form.name !== undefined ? { name: form.name.trim() } : {}),
    ...(form.description !== undefined
      ? { description: form.description?.trim() || undefined }
      : {}),
    ...(form.startDate !== undefined ? { startDate: form.startDate } : {}),
    ...(form.endDate !== undefined
      ? { endDate: form.endDate || undefined }
      : {}),
    ...(form.status !== undefined ? { status: form.status } : {}),
    ...(form.platforms !== undefined ? { platforms: form.platforms } : {}),
  };
}

export function toCampaignMember(raw: unknown): CampaignMember {
  const value = asRecord(raw);
  const user = asUser(value.user);
  const memberRole = asString(value.memberRole, asString(value.roleInCampaign));

  return {
    id: asString(value.id),
    campaignId: asString(value.campaignId),
    userId: asString(value.userId, user?.id ?? ""),
    user,
    roleInCampaign: memberRole || undefined,
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
  };
}

export function toAddMembersDto(
  formMembers: CampaignFormMembers = {},
): AddCampaignMembersDto {
  const members = [
    ...(formMembers.adminIds ?? []).map((userId) => ({
      userId,
      memberRole: "ADMIN" as const,
    })),
    ...(formMembers.buzzerIds ?? []).map((userId) => ({
      userId,
      memberRole: "BUZZER" as const,
    })),
    ...(formMembers.viewerIds ?? []).map((userId) => ({
      userId,
      memberRole: "VIEWER" as const,
    })),
  ];

  return {
    members: [
      ...new Map(members.map((member) => [member.userId, member])).values(),
    ],
  };
}

function toRecentReport(raw: unknown): BlastReport {
  const value = asRecord(raw);
  const submittedBy = asUser(value.submittedBy);

  return {
    id: asString(value.id),
    blastAttemptId: asString(value.blastAttemptId),
    submittedBy: submittedBy?.id ?? asString(value.submittedBy),
    submittedByUser: submittedBy,
    views: asNumber(value.views),
    likes: asNumber(value.likes),
    comments: asNumber(value.comments),
    shares: asNumber(value.shares),
    reposts: asNumber(value.reposts),
    proofLink: asString(value.proofLink),
    notes: asOptionalString(value.notes),
    submittedAt: asString(value.submittedAt, new Date(0).toISOString()),
  };
}

function toTrendPoint(raw: unknown) {
  const value = asRecord(raw);
  const views = asNumber(value.views);
  const likes = asNumber(value.likes);
  const comments = asNumber(value.comments);
  const shares = asNumber(value.shares);
  const reposts = asNumber(value.reposts);

  return {
    date: asString(value.date, asString(value.submittedAt).slice(0, 10)),
    views,
    likes,
    comments,
    shares,
    reposts,
    engagement: asNumber(value.engagement, likes + comments + shares + reposts),
  };
}

function trendFromReports(
  reports: unknown[],
): ReturnType<typeof toTrendPoint>[] {
  const byDate = new Map<string, ReturnType<typeof toTrendPoint>>();

  for (const report of reports) {
    const point = toTrendPoint(report);
    if (!point.date) continue;
    const current = byDate.get(point.date) ?? {
      date: point.date,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      reposts: 0,
      engagement: 0,
    };

    current.views = (current.views ?? 0) + (point.views ?? 0);
    current.likes = (current.likes ?? 0) + (point.likes ?? 0);
    current.comments = (current.comments ?? 0) + (point.comments ?? 0);
    current.shares = (current.shares ?? 0) + (point.shares ?? 0);
    current.reposts = (current.reposts ?? 0) + (point.reposts ?? 0);
    current.engagement = (current.engagement ?? 0) + (point.engagement ?? 0);
    byDate.set(point.date, current);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function toCampaignDashboard(raw: unknown): CampaignDashboardData {
  const value = asRecord(raw);
  const summary = asRecord(value.summary);
  const blast = asRecord(value.blast);
  const comment = asRecord(value.comment);
  const rawBreakdown = Array.isArray(value.platformBreakdown)
    ? value.platformBreakdown
    : [];
  const totalPlatformViews = rawBreakdown.reduce(
    (sum, item) => sum + asNumber(asRecord(item).views),
    0,
  );
  const rawRecentReports = Array.isArray(value.recentReports)
    ? value.recentReports
    : [];
  const rawTrend = Array.isArray(value.engagementTrend)
    ? value.engagementTrend
    : Array.isArray(value.trends)
      ? value.trends
      : Array.isArray(value.dailyMetrics)
        ? value.dailyMetrics
        : Array.isArray(value.series)
          ? value.series
          : [];

  return {
    totalViews: asNumber(summary.totalViews),
    totalLikes: asNumber(summary.totalLikes),
    totalComments: asNumber(summary.totalComments),
    totalShares: asNumber(summary.totalShares),
    totalReposts: asNumber(summary.totalReposts),
    totalEngagement: asNumber(summary.totalEngagement),
    completionRate: asNumber(summary.completionRate),
    completedAttempts: asNumber(blast.completedAttempts),
    totalAttempts: asNumber(blast.totalAttempts),
    availableAttempts: asNumber(blast.availableAttempts),
    keptAttempts: asNumber(blast.keptAttempts),
    expiredAttempts: asNumber(blast.expiredAttempts),
    completedCommentTasks: asNumber(
      summary.completedCommentTasks,
      asNumber(comment.completedCommentTasks),
    ),
    totalCommentTasks: asNumber(
      summary.totalCommentTasks,
      asNumber(comment.totalCommentTasks),
    ),
    engagementTrend: rawTrend.length
      ? rawTrend.map(toTrendPoint)
      : trendFromReports(rawRecentReports),
    platformBreakdown: rawBreakdown.flatMap((item) => {
      const row = asRecord(item);
      const platform = asPlatform(row.platform);
      if (!platform) return [];
      const views = asNumber(row.views);
      return [
        {
          platform,
          views,
          engagement: asNumber(row.engagement),
          percentage:
            totalPlatformViews > 0 ? (views / totalPlatformViews) * 100 : 0,
        },
      ];
    }),
    topBuzzers: (Array.isArray(value.topBuzzers) ? value.topBuzzers : []).map(
      (item) => {
        const row = asRecord(item);
        const totalViews = asNumber(row.totalViews, asNumber(row.views));
        const totalEngagement = asNumber(
          row.totalEngagement,
          asNumber(row.engagement),
        );
        return {
          userId: asString(row.userId),
          name: asString(row.name, "Unknown"),
          completedAttempts: asNumber(row.completedAttempts),
          totalViews,
          totalEngagement,
          completionRate: asNumber(row.completionRate),
          score: asNumber(row.score, totalViews + totalEngagement),
        };
      },
    ),
    recentReports: rawRecentReports.map(toRecentReport),
    overdueItems: [],
  };
}
