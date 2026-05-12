/**
 * Blast API adapter - mock + real backend contract v1.3.
 *
 * Pages should never fetch blast endpoints directly. This adapter keeps mock
 * mode alive while normalising backend Prisma shapes into UI types.
 */
import type {
  BlastAttempt,
  BlastReport,
  BlastTarget,
  BlastTargetStatus,
  PaginationMeta,
  Platform,
  SubmitBlastReportForm,
} from "@/types";
import { isMockMode, apiClient, ApiClientError } from "./client";
import {
  toBlastAttempt,
  toBlastAttemptFromReport,
  toBlastReport,
  toBlastTarget,
  toCreateBlastTargetDto,
  type CreateBlastTargetDto,
  type UpdateBlastTargetDto,
} from "./mappers/blast.mapper";
import {
  mockBlastAttempts,
  mockBlastTargets,
  mockBlastReports,
} from "@/lib/mock-data";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ListBlastTargetsParams {
  page?: number;
  limit?: number;
  platform?: Platform | "";
  status?: BlastTargetStatus | "";
  reviewStatus?: "APPROVED" | "PENDING" | "REJECTED" | "";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function fallbackMeta(
  params: Pick<ListBlastTargetsParams, "page" | "limit"> | undefined,
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

export interface ListBlastAttemptsParams {
  page?: number;
  limit?: number;
  platform?: Platform | "";
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ListBlastReportsParams {
  page?: number;
  limit?: number;
  platform?: Platform | "";
  submittedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type AddBlastTargetForm = CreateBlastTargetDto & {
  notes?: string;
  internalNotes?: string;
  createInitialAttempt?: boolean;
  keepDurationMinutes?: number;
};

function withTargetRelations(attempt: BlastAttempt): BlastAttempt {
  return {
    ...attempt,
    blastTarget:
      attempt.blastTarget ??
      mockBlastTargets.find((target) => target.id === attempt.blastTargetId),
    report:
      attempt.report ??
      mockBlastReports.find((report) => report.blastAttemptId === attempt.id),
  };
}

function attemptsForTarget(targetId: string) {
  return mockBlastAttempts
    .filter((attempt) => attempt.blastTargetId === targetId)
    .sort((a, b) => b.attemptNo - a.attemptNo);
}

function reportToCompletedAttempt(report: BlastReport): BlastAttempt {
  return toBlastAttemptFromReport(report);
}

export const blastApi = {
  async listTargets(
    campaignId: string,
    params: ListBlastTargetsParams = {},
  ): Promise<{ data: BlastTarget[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(300);
      let targets = mockBlastTargets.filter(
        (target) => target.campaignId === campaignId,
      );
      if (params.platform)
        targets = targets.filter(
          (target) => target.platform === params.platform,
        );
      if (params.status)
        targets = targets.filter((target) => target.status === params.status);
      if (params.search) {
        const query = params.search.toLowerCase();
        targets = targets.filter(
          (target) =>
            target.postUrl.toLowerCase().includes(query) ||
            target.socialAccount?.username?.toLowerCase().includes(query) ||
            target.socialAccount?.displayName?.toLowerCase().includes(query),
        );
      }
      const data = targets.map((target) => {
        const attempts = attemptsForTarget(target.id).map(withTargetRelations);
        return {
          ...target,
          latestAttempt: attempts[0],
          attempts,
          totalAttempts: attempts.length,
          completedAttempts: attempts.filter(
            (attempt) => attempt.status === "COMPLETED",
          ).length,
        };
      });
      return { data, meta: fallbackMeta(params, data.length) };
    }

    const res = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/blast-targets`,
      {
        page: params.page,
        limit: params.limit,
        platform: params.platform || undefined,
        status: params.status || undefined,
        reviewStatus: params.reviewStatus || undefined,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );
    return {
      data: res.data.map(toBlastTarget),
      meta: res.meta ?? fallbackMeta(params, res.data.length),
    };
  },

  async getTarget(campaignId: string, targetId: string): Promise<BlastTarget> {
    if (isMockMode()) {
      await delay(200);
      const target = mockBlastTargets.find(
        (item) => item.id === targetId && item.campaignId === campaignId,
      );
      if (!target)
        throw new ApiClientError("NOT_FOUND", "Target tidak ditemukan.");
      const attempts = attemptsForTarget(targetId).map(withTargetRelations);
      return {
        ...target,
        attempts,
        latestAttempt: attempts[0],
        totalAttempts: attempts.length,
        completedAttempts: attempts.filter(
          (attempt) => attempt.status === "COMPLETED",
        ).length,
      };
    }

    const res = await apiClient.get<unknown>(
      `/campaigns/${campaignId}/blast-targets/${targetId}`,
    );
    return toBlastTarget(res.data);
  },

  async addTarget(
    campaignId: string,
    form: AddBlastTargetForm,
  ): Promise<BlastTarget> {
    if (isMockMode()) {
      await delay(500);
      const now = new Date().toISOString();
      const target: BlastTarget = {
        id: `bt-${Date.now()}`,
        campaignId,
        socialAccountId: form.socialAccountId,
        platform: form.platform,
        postUrl: form.postUrl,
        instruction: form.instruction || form.notes,
        internalNotes: form.internalNotes,
        status: form.status ?? "ACTIVE",
        submittedBy: "user-admin-1",
        sourceType: form.sourceType ?? "ADMIN_SUBMITTED",
        reviewStatus: form.reviewStatus ?? "APPROVED",
        createdAt: now,
        updatedAt: now,
        totalAttempts: 1,
        completedAttempts: 0,
      };
      mockBlastTargets.push(target);
      mockBlastAttempts.push({
        id: `ba-${Date.now()}`,
        blastTargetId: target.id,
        blastTarget: target,
        attemptNo: 1,
        status: "AVAILABLE",
        createdAt: now,
        updatedAt: now,
      });
      return target;
    }

    const res = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/blast-targets`,
      toCreateBlastTargetDto(form),
    );
    return toBlastTarget(res.data);
  },

  async updateTarget(
    campaignId: string,
    targetId: string,
    form: UpdateBlastTargetDto,
  ): Promise<BlastTarget> {
    if (isMockMode()) {
      await delay(350);
      const idx = mockBlastTargets.findIndex(
        (target) => target.id === targetId && target.campaignId === campaignId,
      );
      if (idx === -1)
        throw new ApiClientError("NOT_FOUND", "Target tidak ditemukan.");
      mockBlastTargets[idx] = {
        ...mockBlastTargets[idx],
        ...form,
        updatedAt: new Date().toISOString(),
      };
      return mockBlastTargets[idx];
    }

    const res = await apiClient.patch<unknown>(
      `/campaigns/${campaignId}/blast-targets/${targetId}`,
      form,
    );
    return toBlastTarget(res.data);
  },

  async updateTargetStatus(
    campaignId: string,
    targetId: string,
    status: BlastTargetStatus,
  ): Promise<BlastTarget> {
    if (isMockMode()) {
      await delay(350);
      const idx = mockBlastTargets.findIndex(
        (target) => target.id === targetId && target.campaignId === campaignId,
      );
      if (idx === -1)
        throw new ApiClientError("NOT_FOUND", "Target tidak ditemukan.");
      mockBlastTargets[idx] = {
        ...mockBlastTargets[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      return mockBlastTargets[idx];
    }

    const res = await apiClient.patch<unknown>(
      `/campaigns/${campaignId}/blast-targets/${targetId}/status`,
      { status },
    );
    return toBlastTarget(res.data);
  },

  async getQueue(
    params: ListBlastAttemptsParams = {},
  ): Promise<BlastAttempt[]> {
    if (isMockMode()) {
      await delay(400);
      let attempts = mockBlastAttempts
        .filter((attempt) => attempt.status === "AVAILABLE")
        .map(withTargetRelations);
      if (params.platform)
        attempts = attempts.filter(
          (attempt) => attempt.blastTarget?.platform === params.platform,
        );
      return attempts;
    }

    const res = await apiClient.get<unknown[]>("/buzzer/blast-queue", {
      page: params.page,
      limit: params.limit,
      platform: params.platform || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return res.data.map(toBlastAttempt);
  },

  async getMyKept(
    _userId?: string,
    params: ListBlastAttemptsParams = {},
  ): Promise<BlastAttempt[]> {
    if (isMockMode()) {
      await delay(300);
      return mockBlastAttempts
        .filter(
          (attempt) =>
            attempt.status === "KEPT" &&
            (!_userId || attempt.keptBy === _userId),
        )
        .map(withTargetRelations);
    }

    const res = await apiClient.get<unknown[]>("/buzzer/my-kept", {
      page: params.page,
      limit: params.limit,
      platform: params.platform || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return res.data.map(toBlastAttempt);
  },

  async getMyCompleted(
    userId?: string,
    params: ListBlastReportsParams = {},
  ): Promise<BlastAttempt[]> {
    const reports = await blastApi.getMyReports(userId, params);
    return reports.map(reportToCompletedAttempt);
  },

  async getMyAttempts(userId?: string): Promise<BlastAttempt[]> {
    const [kept, completed] = await Promise.all([
      blastApi.getMyKept(userId),
      blastApi.getMyCompleted(userId),
    ]);
    const rows = new Map<string, BlastAttempt>();
    for (const attempt of [...kept, ...completed])
      rows.set(attempt.id, attempt);
    return [...rows.values()].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  },

  async keepAttempt(
    attemptId: string,
    _userId?: string,
    keepDurationMinutes?: number,
  ): Promise<BlastAttempt> {
    if (isMockMode()) {
      await delay(600);
      const idx = mockBlastAttempts.findIndex(
        (attempt) => attempt.id === attemptId,
      );
      if (idx === -1)
        throw new ApiClientError("NOT_FOUND", "Attempt tidak ditemukan.");
      if (mockBlastAttempts[idx].status !== "AVAILABLE") {
        throw new ApiClientError(
          "ATTEMPT_ALREADY_KEPT",
          "Blast attempt ini sudah diambil oleh buzzer lain.",
        );
      }
      const now = new Date();
      const keepExpiresAt = new Date(
        now.getTime() + (keepDurationMinutes ?? 120) * 60 * 1000,
      ).toISOString();
      mockBlastAttempts[idx] = {
        ...mockBlastAttempts[idx],
        status: "KEPT",
        keptBy: _userId,
        keptAt: now.toISOString(),
        keepExpiresAt,
        updatedAt: now.toISOString(),
      };
      return withTargetRelations(mockBlastAttempts[idx]);
    }

    const res = await apiClient.post<unknown>(
      `/blast-attempts/${attemptId}/keep`,
      keepDurationMinutes ? { keepDurationMinutes } : {},
    );
    return toBlastAttempt(res.data);
  },

  async releaseAttempt(attemptId: string): Promise<BlastAttempt> {
    if (isMockMode()) {
      await delay(400);
      const idx = mockBlastAttempts.findIndex(
        (attempt) => attempt.id === attemptId,
      );
      if (idx === -1)
        throw new ApiClientError("NOT_FOUND", "Attempt tidak ditemukan.");
      mockBlastAttempts[idx] = {
        ...mockBlastAttempts[idx],
        status: "RELEASED",
        keepExpiresAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      return withTargetRelations(mockBlastAttempts[idx]);
    }

    const res = await apiClient.post<unknown>(
      `/blast-attempts/${attemptId}/release`,
    );
    return toBlastAttempt(res.data);
  },

  async submitReport(
    attemptId: string,
    form: SubmitBlastReportForm,
    userId?: string,
  ): Promise<BlastReport> {
    if (isMockMode()) {
      await delay(700);
      const aIdx = mockBlastAttempts.findIndex(
        (attempt) => attempt.id === attemptId,
      );
      if (aIdx === -1)
        throw new ApiClientError("NOT_FOUND", "Attempt tidak ditemukan.");
      if (userId && mockBlastAttempts[aIdx].keptBy !== userId) {
        throw new ApiClientError(
          "ATTEMPT_NOT_OWNED",
          "Kamu tidak memegang attempt ini.",
        );
      }
      if (mockBlastAttempts[aIdx].status !== "KEPT") {
        throw new ApiClientError(
          "ATTEMPT_INVALID_STATUS",
          "Attempt tidak siap disubmit.",
        );
      }
      const now = new Date().toISOString();
      mockBlastAttempts[aIdx] = {
        ...mockBlastAttempts[aIdx],
        status: "COMPLETED",
        completedAt: now,
        updatedAt: now,
      };
      const report: BlastReport = {
        id: `br-${Date.now()}`,
        blastAttemptId: attemptId,
        submittedBy: userId ?? "mock-user",
        ...form,
        submittedAt: now,
        reviewStatus: "PENDING",
      };
      mockBlastReports.push(report);
      return report;
    }

    const res = await apiClient.post<unknown>(
      `/blast-attempts/${attemptId}/report`,
      form,
    );
    return toBlastReport(res.data);
  },

  async createReblast(
    campaignId: string,
    targetId: string,
  ): Promise<BlastAttempt> {
    if (isMockMode()) {
      await delay(500);
      const target = mockBlastTargets.find(
        (item) => item.id === targetId && item.campaignId === campaignId,
      );
      if (!target)
        throw new ApiClientError("NOT_FOUND", "Target tidak ditemukan.");
      if (target.status !== "ACTIVE") {
        throw new ApiClientError(
          "REBLAST_NOT_ALLOWED",
          "Target harus ACTIVE untuk reblast.",
        );
      }
      const existing = attemptsForTarget(targetId);
      const now = new Date().toISOString();
      const attempt: BlastAttempt = {
        id: `ba-${Date.now()}`,
        blastTargetId: targetId,
        blastTarget: target,
        attemptNo: (existing[0]?.attemptNo ?? 0) + 1,
        status: "AVAILABLE",
        createdAt: now,
        updatedAt: now,
      };
      mockBlastAttempts.push(attempt);
      return attempt;
    }

    const res = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/blast-targets/${targetId}/reblast`,
    );
    return toBlastAttempt(res.data);
  },

  async getAttemptsByTarget(
    campaignId: string,
    targetId: string,
    params: ListBlastAttemptsParams = {},
  ): Promise<BlastAttempt[]> {
    if (isMockMode()) {
      await delay(200);
      let attempts = attemptsForTarget(targetId).map(withTargetRelations);
      if (params.status)
        attempts = attempts.filter(
          (attempt) => attempt.status === params.status,
        );
      return attempts;
    }

    const res = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/blast-targets/${targetId}/attempts`,
      {
        page: params.page,
        limit: params.limit,
        status: params.status || undefined,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );
    return res.data.map(toBlastAttempt);
  },

  async getReport(reportId: string): Promise<BlastReport> {
    if (isMockMode()) {
      await delay(200);
      const report = mockBlastReports.find((item) => item.id === reportId);
      if (!report)
        throw new ApiClientError("NOT_FOUND", "Report tidak ditemukan.");
      return report;
    }

    const res = await apiClient.get<unknown>(`/blast-reports/${reportId}`);
    return toBlastReport(res.data);
  },

  async listReports(
    campaignId: string,
    params: ListBlastReportsParams = {},
  ): Promise<{ data: BlastReport[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(300);
      const targetIds = mockBlastTargets
        .filter((target) => target.campaignId === campaignId)
        .map((target) => target.id);
      const attemptIds = mockBlastAttempts
        .filter((attempt) => targetIds.includes(attempt.blastTargetId))
        .map((attempt) => attempt.id);
      const rows = mockBlastReports.filter((report) =>
        attemptIds.includes(report.blastAttemptId),
      );
      const meta = fallbackMeta(params, rows.length);
      const start = (meta.page - 1) * meta.limit;
      return { data: rows.slice(start, start + meta.limit), meta };
    }

    const res = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/blast-reports`,
      {
        page: params.page,
        limit: params.limit,
        platform: params.platform || undefined,
        submittedBy: params.submittedBy,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );
    return {
      data: res.data.map(toBlastReport),
      meta: res.meta ?? fallbackMeta(params, res.data.length),
    };
  },

  async getMyReports(
    userId?: string,
    params: ListBlastReportsParams = {},
  ): Promise<BlastReport[]> {
    if (isMockMode()) {
      await delay(300);
      return mockBlastReports.filter(
        (report) => !userId || report.submittedBy === userId,
      );
    }

    const res = await apiClient.get<unknown[]>("/buzzer/my-reports", {
      page: params.page,
      limit: params.limit,
      platform: params.platform || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return res.data.map(toBlastReport);
  },
};
