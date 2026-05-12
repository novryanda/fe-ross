import type {
  BlastAttempt,
  BlastAttemptStatus,
  BlastReport,
  BlastTarget,
  BlastTargetStatus,
  Platform,
  SocialAccount,
  User,
} from "@/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asUser(value: unknown): User | undefined {
  const raw = asRecord(value);
  const id = asOptionalString(raw.id);
  if (!id) return undefined;

  return {
    id,
    name: asString(raw.name, "Unknown"),
    email: asString(raw.email),
    role: asString(raw.role, "BUZZER") as User["role"],
    status: asString(raw.status, "ACTIVE") as User["status"],
    image: asOptionalString(raw.image),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    lastLoginAt: asOptionalString(raw.lastLoginAt),
  };
}

function asSocialAccount(value: unknown): SocialAccount | undefined {
  const raw = asRecord(value);
  const id = asOptionalString(raw.id);
  if (!id) return undefined;

  return {
    id,
    platform: asString(raw.platform, "INSTAGRAM") as Platform,
    username: asString(raw.username),
    displayName: asOptionalString(raw.displayName),
    profileUrl: asString(raw.profileUrl),
    category: asString(raw.category, "OTHER") as SocialAccount["category"],
    status: asString(raw.status, "ACTIVE") as SocialAccount["status"],
    createdBy: asString(raw.createdById ?? raw.createdBy),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    blastTargetCount: asNumber(raw.blastTargetCount ?? asRecord(raw._count).blastTargets, undefined as unknown as number),
  };
}

export interface CreateBlastTargetDto {
  socialAccountId: string;
  platform: Platform;
  postUrl: string;
  instruction?: string;
  sourceType?: "ADMIN_SUBMITTED" | "BUZZER_SUGGESTED";
  reviewStatus?: "APPROVED" | "PENDING" | "REJECTED";
  status?: BlastTargetStatus;
}

export interface UpdateBlastTargetDto {
  socialAccountId?: string;
  platform?: Platform;
  postUrl?: string;
  instruction?: string;
}

export function toCreateBlastTargetDto(form: {
  socialAccountId: string;
  platform: Platform | string;
  postUrl: string;
  instruction?: string;
  sourceType?: "ADMIN_SUBMITTED" | "BUZZER_SUGGESTED";
  reviewStatus?: "APPROVED" | "PENDING" | "REJECTED";
  status?: BlastTargetStatus;
}): CreateBlastTargetDto {
  return {
    socialAccountId: form.socialAccountId,
    platform: form.platform as Platform,
    postUrl: form.postUrl,
    ...(form.instruction ? { instruction: form.instruction } : {}),
    ...(form.sourceType ? { sourceType: form.sourceType } : {}),
    ...(form.reviewStatus ? { reviewStatus: form.reviewStatus } : {}),
    ...(form.status ? { status: form.status } : {}),
  };
}

export function toBlastReport(value: unknown): BlastReport {
  const raw = asRecord(value);
  const submittedByUser = asUser(raw.submittedBy);
  const attempt = raw.attempt ?? raw.blastAttempt;
  const attemptRecord = asRecord(attempt);
  const targetRecord = asRecord(attemptRecord.blastTarget);
  const socialAccount = asSocialAccount(raw.socialAccount ?? targetRecord.socialAccount);

  return {
    id: asString(raw.id),
    blastAttemptId: asString(raw.blastAttemptId),
    blastTargetId: asOptionalString(raw.blastTargetId) ?? asOptionalString(targetRecord.id),
    campaignId: asOptionalString(raw.campaignId) ?? asOptionalString(targetRecord.campaignId),
    postUrl: asOptionalString(raw.postUrl) ?? asOptionalString(targetRecord.postUrl),
    platform: (asOptionalString(raw.platform) ?? asOptionalString(targetRecord.platform)) as Platform | undefined,
    socialAccount,
    attempt: attemptRecord.id ? toBlastAttempt(attemptRecord) : undefined,
    submittedBy: submittedByUser?.id ?? asString(raw.submittedById ?? raw.submittedBy),
    submittedByUser: submittedByUser ?? asUser(raw.submittedByUser),
    views: asNumber(raw.views),
    likes: asNumber(raw.likes),
    comments: asNumber(raw.comments),
    shares: asNumber(raw.shares),
    reposts: asNumber(raw.reposts),
    totalEngagement: asNumber(
      raw.totalEngagement,
      asNumber(raw.likes) + asNumber(raw.comments) + asNumber(raw.shares) + asNumber(raw.reposts),
    ),
    proofLink: asString(raw.proofLink),
    notes: asOptionalString(raw.notes),
    submittedAt: asString(raw.submittedAt),
    attemptNo: asNumber(raw.attemptNo || attemptRecord.attemptNo, undefined as unknown as number),
    attemptStatus: (asOptionalString(raw.attemptStatus) ?? asOptionalString(attemptRecord.status)) as BlastAttemptStatus | undefined,
    reviewStatus: asOptionalString(raw.reviewStatus) as BlastReport["reviewStatus"],
  };
}

export function toBlastAttempt(value: unknown): BlastAttempt {
  const raw = asRecord(value);
  const keptByUser =
    asUser(raw.keptBy) ??
    asUser(raw.keptByUser) ??
    asUser(raw.claimedBy) ??
    asUser(raw.claimedByUser) ??
    asUser(raw.user);
  const report = raw.report ? toBlastReport(raw.report) : undefined;

  return {
    id: asString(raw.id),
    blastTargetId: asString(raw.blastTargetId),
    blastTarget: raw.blastTarget ? toBlastTarget(raw.blastTarget) : undefined,
    attemptNo: asNumber(raw.attemptNo),
    status: asString(raw.status, "AVAILABLE") as BlastAttemptStatus,
    keptBy: keptByUser?.id ?? asOptionalString(raw.keptById) ?? asOptionalString(raw.keptBy),
    keptByUser,
    keptAt: asOptionalString(raw.keptAt),
    keepExpiresAt: asOptionalString(raw.keepExpiresAt),
    completedAt: asOptionalString(raw.completedAt),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    report,
  };
}

export function toBlastAttemptFromReport(report: BlastReport): BlastAttempt {
  return {
    id: report.blastAttemptId,
    blastTargetId: report.blastTargetId ?? "",
    blastTarget: report.blastTargetId
      ? {
          id: report.blastTargetId,
          campaignId: report.campaignId ?? "",
          socialAccountId: report.socialAccount?.id ?? "",
          socialAccount: report.socialAccount,
          platform: report.platform ?? "INSTAGRAM",
          postUrl: report.postUrl ?? "",
          status: "ACTIVE",
          submittedBy: "",
          createdAt: report.submittedAt,
          updatedAt: report.submittedAt,
        }
      : undefined,
    attemptNo: report.attemptNo ?? 0,
    status: report.attemptStatus ?? "COMPLETED",
    keptBy: report.submittedBy,
    keptByUser: report.submittedByUser,
    completedAt: report.submittedAt,
    createdAt: report.submittedAt,
    updatedAt: report.submittedAt,
    report,
  };
}

export function toBlastTarget(value: unknown): BlastTarget {
  const raw = asRecord(value);
  const attempts = Array.isArray(raw.attempts) ? raw.attempts.map(toBlastAttempt) : undefined;
  const latestAttempt = raw.latestAttempt
    ? toBlastAttempt(raw.latestAttempt)
    : raw.currentAttempt
      ? toBlastAttempt(raw.currentAttempt)
      : Array.isArray(raw.attempts) && attempts?.length
        ? [...attempts].sort((a, b) => b.attemptNo - a.attemptNo)[0]
        : undefined;
  const count = asRecord(raw._count);
  const completedAttempts = asNumber(
    raw.completedAttempts ?? raw.completedAttemptCount,
    attempts?.filter((attempt) => attempt.status === "COMPLETED").length ?? 0,
  );

  return {
    id: asString(raw.id),
    campaignId: asString(raw.campaignId),
    socialAccountId: asString(raw.socialAccountId),
    socialAccount: asSocialAccount(raw.socialAccount),
    platform: asString(raw.platform, "INSTAGRAM") as Platform,
    postUrl: asString(raw.postUrl),
    instruction: asOptionalString(raw.instruction),
    internalNotes: asOptionalString(raw.internalNotes),
    status: asString(raw.status, "ACTIVE") as BlastTargetStatus,
    submittedBy: asString(raw.submittedById ?? asRecord(raw.submittedBy).id ?? raw.submittedBy),
    sourceType: asOptionalString(raw.sourceType) as BlastTarget["sourceType"],
    reviewStatus: asOptionalString(raw.reviewStatus) as BlastTarget["reviewStatus"],
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    attempts,
    latestAttempt,
    totalAttempts: asNullableNumber(raw.totalAttempts ?? raw.attemptCount ?? count.attempts) ?? attempts?.length,
    completedAttempts: asNullableNumber(raw.completedAttempts ?? raw.completedAttemptCount) ?? (attempts ? completedAttempts : undefined),
  };
}
