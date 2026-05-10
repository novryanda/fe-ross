import type {
  Campaign,
  CommentCommand,
  CommentCommandStatus,
  CommentTask,
  CommentTaskStatus,
  Platform,
  SocialAccount,
  Stance,
  User,
} from "@/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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

function asCampaign(value: unknown): Campaign | undefined {
  const raw = asRecord(value);
  const id = asOptionalString(raw.id);
  if (!id) return undefined;

  return {
    id,
    name: asString(raw.name),
    description: asOptionalString(raw.description),
    status: asString(raw.status, "ACTIVE") as Campaign["status"],
    startDate: asString(raw.startDate),
    endDate: asOptionalString(raw.endDate),
    platforms: Array.isArray(raw.platforms) ? (raw.platforms as Platform[]) : [],
    ownerId: asString(raw.ownerId),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
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
  };
}

export interface CommentCommandWriteForm {
  targetPostUrl: string;
  platform: Platform;
  socialAccountId?: string;
  stance: Stance;
  narrative: string;
  instruction?: string;
  requiredSlots: number;
  keepExpiryMinutes?: number;
  deadline: string;
  status?: CommentCommandStatus;
}

export function toCommentCommand(value: unknown): CommentCommand {
  const raw = asRecord(value);
  const slotCounts = asRecord(raw.slotCounts);
  const createdByUser = asUser(raw.createdBy) ?? asUser(raw.createdByUser);
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(toCommentTask) : undefined;
  const requiredSlots = asNumber(raw.requiredSlots ?? slotCounts.requiredSlots);
  const completedSlots = asNumber(
    raw.completedSlots ?? slotCounts.completedSlots,
    tasks?.filter((task) => task.status === "COMPLETED").length ?? 0,
  );

  return {
    id: asString(raw.id),
    campaignId: asString(raw.campaignId),
    campaign: asCampaign(raw.campaign),
    socialAccountId: asOptionalString(raw.socialAccountId),
    socialAccount: asSocialAccount(raw.socialAccount),
    targetPostUrl: asString(raw.targetPostUrl),
    platform: asString(raw.platform, "INSTAGRAM") as Platform,
    stance: asString(raw.stance, "PRO") as Stance,
    narrative: asString(raw.narrative),
    instruction: asOptionalString(raw.instruction),
    requiredSlots,
    availableSlots: asNumber(raw.availableSlots ?? slotCounts.availableSlots),
    keptSlots:
      asNumber(raw.keptSlots ?? slotCounts.keptSlots) +
      asNumber(slotCounts.inProgressSlots),
    completedSlots,
    keepExpiryMinutes: asNumber(raw.keepExpiryMinutes, 120),
    deadline: asOptionalString(raw.deadline),
    status: asString(raw.status, "DRAFT") as CommentCommandStatus,
    createdBy: createdByUser?.id ?? asString(raw.createdById ?? raw.createdBy),
    createdByUser,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    tasks,
    totalTasks: asNumber(raw.totalTasks ?? raw.taskCount, requiredSlots),
    completedTasks: asNumber(raw.completedTasks, completedSlots),
  };
}

export function toCommentTask(value: unknown): CommentTask {
  const raw = asRecord(value);
  const keptByUser = asUser(raw.keptBy) ?? asUser(raw.keptByUser);

  return {
    id: asString(raw.id),
    commandId: asString(raw.commandId ?? raw.commentCommandId),
    command: raw.command ? toCommentCommand(raw.command) : undefined,
    taskNo: asNumber(raw.taskNo),
    status: asString(raw.status, "AVAILABLE") as CommentTaskStatus,
    keptBy: keptByUser?.id ?? asOptionalString(raw.keptById) ?? asOptionalString(raw.keptBy),
    keptByUser,
    keptAt: asOptionalString(raw.keptAt),
    keepExpiresAt: asOptionalString(raw.keepExpiresAt),
    proofLink: asOptionalString(raw.proofLink),
    notes: asOptionalString(raw.notes),
    completedAt: asOptionalString(raw.completedAt),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function toCommentCommandDto(form: CommentCommandWriteForm) {
  return {
    targetPostUrl: form.targetPostUrl.trim(),
    platform: form.platform,
    ...(form.socialAccountId ? { socialAccountId: form.socialAccountId } : {}),
    stance: form.stance,
    narrative: form.narrative.trim(),
    ...(form.instruction?.trim() ? { instruction: form.instruction.trim() } : {}),
    requiredSlots: form.requiredSlots,
    ...(form.keepExpiryMinutes ? { keepExpiryMinutes: form.keepExpiryMinutes } : {}),
    deadline: form.deadline,
    ...(form.status ? { status: form.status } : {}),
  };
}
