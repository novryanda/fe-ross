import type {
  CampaignStatus,
  OrgUnit,
  PaginationMeta,
  Platform,
  PostingOrder,
  PostingSubmission,
  SocialAccount,
  Stance,
  User,
} from "@/types";
import { apiClient, isMockMode } from "./client";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toUser(value: unknown): User | undefined {
  const raw = asRecord(value);
  if (!raw.id) return undefined;
  return {
    id: asString(raw.id),
    name: asString(raw.name, "Unknown"),
    email: asString(raw.email),
    role: asString(raw.role, "VIEWER") as User["role"],
    status: asString(raw.status, "ACTIVE") as User["status"],
    picUnitId:
      typeof raw.picUnitId === "string" ? raw.picUnitId : raw.picUnitId === null ? null : undefined,
    createdAt: asString(raw.createdAt, new Date(0).toISOString()),
    updatedAt: asString(raw.updatedAt, new Date(0).toISOString()),
    lastLoginAt: asOptionalString(raw.lastLoginAt),
    image: asOptionalString(raw.image),
  };
}

function toOrgUnit(value: unknown): OrgUnit | undefined {
  const raw = asRecord(value);
  if (!raw.id) return undefined;
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    code: asOptionalString(raw.code),
    status: asString(raw.status, "ACTIVE") as OrgUnit["status"],
    parentId: raw.parentId === null ? null : asOptionalString(raw.parentId),
    createdAt: asString(raw.createdAt, new Date(0).toISOString()),
    updatedAt: asString(raw.updatedAt, new Date(0).toISOString()),
  };
}

function toSocialAccount(value: unknown): SocialAccount | undefined {
  const raw = asRecord(value);
  if (!raw.id) return undefined;
  return {
    id: asString(raw.id),
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

function fallbackMeta(page?: number, limit?: number, total = 0): PaginationMeta {
  const safePage = page ?? 1;
  const safeLimit = limit ?? 20;
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export interface PostingOrderListParams {
  page?: number;
  limit?: number;
  campaignId?: string;
  status?: PostingOrder["status"] | "";
  submissionStatus?: PostingSubmission["status"] | "";
  platform?: Platform | "";
  targetUnitId?: string;
  search?: string;
  eligibleForBlast?: boolean;
  eligibleForComment?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreatePostingOrderDto {
  targetUnitId: string;
  title: string;
  platform: Platform;
  contentDriveUrl: string;
  scheduledAt: string;
  caption?: string;
  description?: string;
}

export interface UpdatePostingOrderDto extends Partial<CreatePostingOrderDto> {
  status?: PostingOrder["status"];
}

export interface SubmitPostingOrderDto {
  socialAccountId: string;
  postedUrl: string;
  proofDriveUrl: string;
  notes?: string;
}

export interface ReviewPostingSubmissionDto {
  status: PostingSubmission["status"];
  reviewNotes?: string;
}

export interface CreateCommentCommandFromSubmissionDto {
  stance: Stance;
  narrative: string;
  instruction?: string;
  requiredSlots: number;
  keepExpiryMinutes?: number;
  deadline: string;
  status?: "DRAFT" | "ACTIVE";
}

function toPostingSubmission(value: unknown): PostingSubmission {
  const raw = asRecord(value);
  const blastTarget = asRecord(raw.blastTarget);
  const commentCommand = asRecord(raw.commentCommand);
  return {
    id: asString(raw.id),
    postingOrderId: asString(raw.postingOrderId),
    postingOrder: raw.postingOrder ? toPostingOrder(raw.postingOrder) : undefined,
    submittedById: asString(raw.submittedById ?? asRecord(raw.submittedBy).id),
    submittedByUser: toUser(raw.submittedBy),
    socialAccountId: asString(raw.socialAccountId ?? asRecord(raw.socialAccount).id),
    socialAccount: toSocialAccount(raw.socialAccount),
    postedUrl: asString(raw.postedUrl),
    proofDriveUrl: asString(raw.proofDriveUrl),
    notes: asOptionalString(raw.notes),
    status: asString(raw.status, "SUBMITTED") as PostingSubmission["status"],
    reviewNotes: asOptionalString(raw.reviewNotes),
    reviewedById:
      raw.reviewedById === null ? null : asOptionalString(raw.reviewedById ?? asRecord(raw.reviewedBy).id),
    reviewedByUser: toUser(raw.reviewedBy),
    reviewedAt: asOptionalString(raw.reviewedAt),
    submittedAt: asString(raw.submittedAt),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    blastTargetId: asOptionalString(blastTarget.id),
    commentCommandId: asOptionalString(commentCommand.id),
  };
}

function toPostingOrder(value: unknown): PostingOrder {
  const raw = asRecord(value);
  const campaign = asRecord(raw.campaign);
  return {
    id: asString(raw.id),
    campaignId: asString(raw.campaignId ?? campaign.id),
    campaign: campaign.id
      ? {
          id: asString(campaign.id),
          name: asString(campaign.name),
          status: asString(campaign.status, "DRAFT") as CampaignStatus,
        }
      : undefined,
    targetUnitId: asString(raw.targetUnitId ?? asRecord(raw.targetUnit).id),
    targetUnit: toOrgUnit(raw.targetUnit),
    title: asString(raw.title),
    platform: asString(raw.platform, "INSTAGRAM") as Platform,
    contentDriveUrl: asString(raw.contentDriveUrl),
    scheduledAt: asString(raw.scheduledAt),
    caption: asOptionalString(raw.caption),
    description: asOptionalString(raw.description),
    status: asString(raw.status, "PUBLISHED_TO_QUEUE") as PostingOrder["status"],
    createdById: asString(raw.createdById ?? asRecord(raw.createdBy).id),
    createdByUser: toUser(raw.createdBy),
    claimedById:
      raw.claimedById === null ? null : asOptionalString(raw.claimedById ?? asRecord(raw.claimedBy).id),
    claimedByUser: toUser(raw.claimedBy),
    claimedAt: asOptionalString(raw.claimedAt),
    completedAt: asOptionalString(raw.completedAt),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    submissionCount:
      typeof asRecord(raw._count).submissions === "number"
        ? (asRecord(raw._count).submissions as number)
        : undefined,
  };
}

export const postingOrdersApi = {
  async listOrders(
    params: PostingOrderListParams = {},
  ): Promise<{ data: PostingOrder[]; meta: PaginationMeta }> {
    const response = await apiClient.get<unknown[]>("/posting-orders", {
      page: params.page,
      limit: params.limit,
      campaignId: params.campaignId,
      status: params.status || undefined,
      platform: params.platform || undefined,
      targetUnitId: params.targetUnitId,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return {
      data: response.data.map(toPostingOrder),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async listCampaignOrders(
    campaignId: string,
    params: PostingOrderListParams = {},
  ): Promise<{ data: PostingOrder[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(150);
      return { data: [], meta: fallbackMeta(params.page, params.limit, 0) };
    }

    const response = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/posting-orders`,
      {
        page: params.page,
        limit: params.limit,
        status: params.status || undefined,
        platform: params.platform || undefined,
        targetUnitId: params.targetUnitId,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );
    return {
      data: response.data.map(toPostingOrder),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async createCampaignOrder(
    campaignId: string,
    dto: CreatePostingOrderDto,
  ): Promise<PostingOrder> {
    const response = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/posting-orders`,
      dto,
    );
    return toPostingOrder(response.data);
  },

  async updateOrder(id: string, dto: UpdatePostingOrderDto): Promise<PostingOrder> {
    const response = await apiClient.patch<unknown>(`/posting-orders/${id}`, dto);
    return toPostingOrder(response.data);
  },

  async getOrder(id: string): Promise<PostingOrder> {
    const response = await apiClient.get<unknown>(`/posting-orders/${id}`);
    return toPostingOrder(response.data);
  },

  async getPicQueue(
    params: PostingOrderListParams = {},
  ): Promise<{ data: PostingOrder[]; meta: PaginationMeta }> {
    const response = await apiClient.get<unknown[]>("/pic/posting-queue", {
      page: params.page,
      limit: params.limit,
      platform: params.platform || undefined,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return {
      data: response.data.map(toPostingOrder),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async getMySubmissions(
    params: PostingOrderListParams = {},
  ): Promise<{ data: PostingSubmission[]; meta: PaginationMeta }> {
    const response = await apiClient.get<unknown[]>("/pic/my-submissions", {
      page: params.page,
      limit: params.limit,
      platform: params.platform || undefined,
      submissionStatus: params.submissionStatus || undefined,
      sortOrder: params.sortOrder,
    });
    return {
      data: response.data.map(toPostingSubmission),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async claimOrder(id: string): Promise<PostingOrder> {
    const response = await apiClient.post<unknown>(`/posting-orders/${id}/claim`);
    return toPostingOrder(response.data);
  },

  async releaseOrder(id: string): Promise<PostingOrder> {
    const response = await apiClient.post<unknown>(`/posting-orders/${id}/release`);
    return toPostingOrder(response.data);
  },

  async submitOrder(id: string, dto: SubmitPostingOrderDto): Promise<PostingSubmission> {
    const response = await apiClient.post<unknown>(`/posting-orders/${id}/submit`, dto);
    return toPostingSubmission(response.data);
  },

  async listCampaignSubmissions(
    campaignId: string,
    params: PostingOrderListParams = {},
  ): Promise<{ data: PostingSubmission[]; meta: PaginationMeta }> {
    const response = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/pic-submissions`,
      {
        page: params.page,
        limit: params.limit,
        platform: params.platform || undefined,
        submissionStatus: params.submissionStatus || undefined,
        eligibleForBlast: params.eligibleForBlast ? true : undefined,
        eligibleForComment: params.eligibleForComment ? true : undefined,
        sortOrder: params.sortOrder,
      },
    );
    return {
      data: response.data.map(toPostingSubmission),
      meta: response.meta ?? fallbackMeta(params.page, params.limit, response.data.length),
    };
  },

  async reviewSubmission(
    submissionId: string,
    dto: ReviewPostingSubmissionDto,
  ): Promise<PostingSubmission> {
    const response = await apiClient.patch<unknown>(
      `/posting-submissions/${submissionId}/status`,
      dto,
    );
    return toPostingSubmission(response.data);
  },

  async createBlastFromSubmission(
    campaignId: string,
    submissionId: string,
  ) {
    const response = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/blast-targets/from-submission/${submissionId}`,
    );
    return response.data;
  },

  async createCommentFromSubmission(
    campaignId: string,
    submissionId: string,
    dto: CreateCommentCommandFromSubmissionDto,
  ) {
    const response = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/comment-commands/from-submission/${submissionId}`,
      dto,
    );
    return response.data;
  },
};
