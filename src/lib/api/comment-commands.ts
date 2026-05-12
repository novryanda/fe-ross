/**
 * Comment Commands + Tasks API — v1.3 Keep/Claim model.
 *
 * Mock mode mutates `mockCommentTasks` so existing UI flows keep working.
 * Real mode targets the backend endpoints documented in
 * `Backend_API_Contract_Inventory_v1.3.md` modules 10 & 11.
 */
import type {
  CommentCommand,
  CommentCommandStatus,
  CommentTask,
  PaginationMeta,
  Platform,
  Stance,
} from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError } from "./errors";
import { mockCommentCommands, mockCommentTasks } from "@/lib/mock-data";
import {
  toCommentCommand,
  toCommentCommandDto,
  toCommentTask,
  type CommentCommandWriteForm,
} from "./mappers/comment.mapper";

const MOCK_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CreateCommentCommandDto {
  targetPostUrl: string;
  platform: Platform;
  stance: Stance;
  narrative: string;
  instruction?: string;
  deadline?: string;
  socialAccountId?: string;
  requiredSlots: number;
  keepExpiryMinutes: number;
  status?: "DRAFT" | "ACTIVE";
}

export type UpdateCommentCommandDto = Partial<
  Omit<CreateCommentCommandDto, "status">
>;

export interface CommentQueueParams {
  page?: number;
  limit?: number;
  platform?: Platform;
  stance?: Stance;
}

export interface ListCommentCommandsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  stance?: Stance;
  platform?: Platform;
  status?: CommentCommandStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface MyCommentTasksParams {
  page?: number;
  limit?: number;
  status?: CommentTask["status"];
}

export interface KeepCommentTaskDto {
  keepDurationMinutes?: number;
}

export interface CompleteCommentTaskDto {
  proofLink: string;
  notes?: string;
}

function fallbackMeta(
  params: Pick<ListCommentCommandsParams, "page" | "limit"> | undefined,
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

// ---------- Commands (Admin) ----------

export const commentCommandsApi = {
  async list(
    campaignId: string,
    params: ListCommentCommandsParams = {},
  ): Promise<{ data: CommentCommand[]; meta: PaginationMeta }> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      let rows = mockCommentCommands.filter((c) => c.campaignId === campaignId);
      if (params.search) {
        const needle = params.search.toLowerCase();
        rows = rows.filter((command) =>
          `${command.targetPostUrl} ${command.narrative} ${command.instruction ?? ""}`
            .toLowerCase()
            .includes(needle),
        );
      }
      if (params.stance) rows = rows.filter((c) => c.stance === params.stance);
      if (params.platform)
        rows = rows.filter((c) => c.platform === params.platform);
      if (params.status) rows = rows.filter((c) => c.status === params.status);
      if (params.dateFrom) {
        const from = new Date(params.dateFrom).getTime();
        rows = rows.filter(
          (c) => c.deadline && new Date(c.deadline).getTime() >= from,
        );
      }
      if (params.dateTo) {
        const to = new Date(params.dateTo).getTime();
        rows = rows.filter(
          (c) => c.deadline && new Date(c.deadline).getTime() <= to,
        );
      }
      const meta = fallbackMeta(params, rows.length);
      const start = (meta.page - 1) * meta.limit;
      return { data: rows.slice(start, start + meta.limit), meta };
    }
    const response = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/comment-commands`,
      {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        search: params.search,
        stance: params.stance,
        platform: params.platform,
        status: params.status,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    );
    return {
      data: response.data.map(toCommentCommand),
      meta: response.meta ?? fallbackMeta(params, response.data.length),
    };
  },

  async get(commandId: string): Promise<CommentCommand> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const command = mockCommentCommands.find((c) => c.id === commandId);
      if (!command) throw new ApiError("NOT_FOUND", "Command tidak ditemukan.");
      command.tasks = mockCommentTasks.filter((t) => t.commandId === commandId);
      return command;
    }
    const response = await apiClient.get<unknown>(
      `/comment-commands/${commandId}`,
    );
    return toCommentCommand(response.data);
  },

  async create(
    campaignId: string,
    dto: CreateCommentCommandDto | CommentCommandWriteForm,
  ): Promise<CommentCommand> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const now = new Date().toISOString();
      const command: CommentCommand = {
        id: `cc-mock-${Date.now()}`,
        campaignId,
        targetPostUrl: dto.targetPostUrl,
        platform: dto.platform,
        stance: dto.stance,
        narrative: dto.narrative,
        instruction: dto.instruction,
        deadline: dto.deadline,
        socialAccountId: dto.socialAccountId,
        requiredSlots: dto.requiredSlots,
        availableSlots: dto.requiredSlots,
        keptSlots: 0,
        completedSlots: 0,
        keepExpiryMinutes: dto.keepExpiryMinutes ?? 120,
        status: dto.status ?? "DRAFT",
        createdBy: "user-admin-1",
        createdAt: now,
        updatedAt: now,
        totalTasks: dto.requiredSlots,
        completedTasks: 0,
      };
      mockCommentCommands.push(command);
      for (let i = 1; i <= dto.requiredSlots; i++) {
        mockCommentTasks.push({
          id: `ct-mock-${Date.now()}-${i}`,
          commandId: command.id,
          command,
          taskNo: i,
          status: "AVAILABLE",
          createdAt: now,
          updatedAt: now,
        });
      }
      return command;
    }
    const response = await apiClient.post<unknown>(
      `/campaigns/${campaignId}/comment-commands`,
      toCommentCommandDto(dto as CommentCommandWriteForm),
    );
    return toCommentCommand(response.data);
  },

  async update(
    commandId: string,
    dto: UpdateCommentCommandDto,
  ): Promise<CommentCommand> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentCommands.findIndex((c) => c.id === commandId);
      if (idx === -1)
        throw new ApiError("NOT_FOUND", "Command tidak ditemukan.");
      mockCommentCommands[idx] = {
        ...mockCommentCommands[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      return mockCommentCommands[idx];
    }
    const response = await apiClient.patch<unknown>(
      `/comment-commands/${commandId}`,
      dto,
    );
    return toCommentCommand(response.data);
  },

  async updateStatus(
    commandId: string,
    status: Extract<CommentCommandStatus, "ACTIVE" | "PAUSED" | "ARCHIVED">,
  ): Promise<CommentCommand> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentCommands.findIndex((c) => c.id === commandId);
      if (idx === -1)
        throw new ApiError("NOT_FOUND", "Command tidak ditemukan.");
      mockCommentCommands[idx] = {
        ...mockCommentCommands[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      return mockCommentCommands[idx];
    }
    const response = await apiClient.patch<unknown>(
      `/comment-commands/${commandId}/status`,
      { status },
    );
    return toCommentCommand(response.data);
  },
};

// ---------- Tasks (Admin + Buzzer, v1.3 Keep/Claim) ----------

export const commentTasksApi = {
  async listByCampaign(campaignId: string): Promise<CommentTask[]> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const commandIds = mockCommentCommands
        .filter((c) => c.campaignId === campaignId)
        .map((c) => c.id);
      return mockCommentTasks.filter((t) => commandIds.includes(t.commandId));
    }
    const response = await apiClient.get<unknown[]>(
      `/campaigns/${campaignId}/comment-tasks`,
    );
    return response.data.map(toCommentTask);
  },

  /** Buzzer queue — tasks that are AVAILABLE on ACTIVE commands. */
  async getCommentQueue(
    params: CommentQueueParams = {},
  ): Promise<CommentTask[]> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockCommentTasks
        .map((t) => ({
          ...t,
          command: mockCommentCommands.find((c) => c.id === t.commandId),
        }))
        .filter(
          (t) => t.status === "AVAILABLE" && t.command?.status === "ACTIVE",
        )
        .filter((t) =>
          params.platform ? t.command?.platform === params.platform : true,
        )
        .filter((t) =>
          params.stance ? t.command?.stance === params.stance : true,
        );
    }
    const response = await apiClient.get<unknown[]>("/buzzer/comment-queue", {
      page: params.page,
      limit: params.limit,
      platform: params.platform,
      stance: params.stance,
    });
    return response.data.map(toCommentTask);
  },

  /** Buzzer-owned tasks. Defaults to KEPT/IN_PROGRESS/COMPLETED/EXPIRED. */
  async getMyCommentTasks(
    params: MyCommentTasksParams = {},
    userId?: string,
  ): Promise<CommentTask[]> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const filtered = mockCommentTasks.filter(
        (t) => !userId || t.keptBy === userId,
      );
      const statusSet: CommentTask["status"][] = params.status
        ? [params.status]
        : ["KEPT", "IN_PROGRESS", "COMPLETED", "EXPIRED"];
      return filtered
        .filter((t) => statusSet.includes(t.status))
        .map((t) => ({
          ...t,
          command: mockCommentCommands.find((c) => c.id === t.commandId),
        }));
    }
    const response = await apiClient.get<unknown[]>("/buzzer/comment-tasks", {
      page: params.page,
      limit: params.limit,
      status: params.status,
    });
    return response.data.map(toCommentTask);
  },

  async get(taskId: string): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const task = mockCommentTasks.find((t) => t.id === taskId);
      if (!task) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      return {
        ...task,
        command: mockCommentCommands.find((c) => c.id === task.commandId),
      };
    }
    const response = await apiClient.get<unknown>(
      `/buzzer/comment-tasks/${taskId}`,
    );
    return toCommentTask(response.data);
  },

  /**
   * Atomic keep (AVAILABLE → KEPT). Backend enforces race-safety; the client
   * surfaces `COMMENT_TASK_ALREADY_KEPT` / `COMMENT_TASK_NOT_AVAILABLE`
   * conflicts as regular ApiErrors (HTTP 409) for the UI layer.
   */
  async keep(
    taskId: string,
    dto: KeepCommentTaskDto = {},
    userId?: string,
  ): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      const task = mockCommentTasks[idx];
      if (task.status !== "AVAILABLE") {
        throw new ApiError(
          "COMMENT_TASK_ALREADY_KEPT",
          "Task ini sudah diambil buzzer lain.",
        );
      }
      const now = new Date();
      const expires = new Date(
        now.getTime() + (dto.keepDurationMinutes ?? 120) * 60 * 1000,
      );
      mockCommentTasks[idx] = {
        ...task,
        status: "KEPT",
        keptBy: userId ?? task.keptBy,
        keptAt: now.toISOString(),
        keepExpiresAt: expires.toISOString(),
        updatedAt: now.toISOString(),
      };
      return mockCommentTasks[idx];
    }
    const response = await apiClient.post<unknown>(
      `/comment-tasks/${taskId}/keep`,
      dto,
    );
    return toCommentTask(response.data);
  },

  async release(taskId: string): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      mockCommentTasks[idx] = {
        ...mockCommentTasks[idx],
        status: "AVAILABLE",
        keptBy: undefined,
        keptAt: undefined,
        keepExpiresAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      return mockCommentTasks[idx];
    }
    const response = await apiClient.post<unknown>(
      `/comment-tasks/${taskId}/release`,
    );
    return toCommentTask(response.data);
  },

  /** Optional step between KEEP and COMPLETE. Buzzer-only. */
  async start(taskId: string): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      mockCommentTasks[idx] = {
        ...mockCommentTasks[idx],
        status: "IN_PROGRESS",
        updatedAt: new Date().toISOString(),
      };
      return mockCommentTasks[idx];
    }
    const response = await apiClient.post<unknown>(
      `/comment-tasks/${taskId}/start`,
    );
    return toCommentTask(response.data);
  },

  async complete(
    taskId: string,
    dto: CompleteCommentTaskDto,
  ): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      mockCommentTasks[idx] = {
        ...mockCommentTasks[idx],
        status: "COMPLETED",
        proofLink: dto.proofLink,
        notes: dto.notes,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return mockCommentTasks[idx];
    }
    const response = await apiClient.post<unknown>(
      `/comment-tasks/${taskId}/complete`,
      dto,
    );
    return toCommentTask(response.data);
  },

  /** @deprecated Since v1.3 — use `release` instead. Kept only for mock flows. */
  async reject(taskId: string, reason: string): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      mockCommentTasks[idx] = {
        ...mockCommentTasks[idx],
        status: "CANCELLED",
        notes: reason,
        updatedAt: new Date().toISOString(),
      };
      return mockCommentTasks[idx];
    }
    throw new ApiError(
      "DEPRECATED_ENDPOINT",
      "commentTasksApi.reject is deprecated since v1.3. Use commentTasksApi.release instead.",
    );
  },

  /** @deprecated Since v1.3 — use `release` instead. Kept only for mock flows. */
  async block(taskId: string, reason: string): Promise<CommentTask> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      const idx = mockCommentTasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
      mockCommentTasks[idx] = {
        ...mockCommentTasks[idx],
        status: "CANCELLED",
        notes: reason,
        updatedAt: new Date().toISOString(),
      };
      return mockCommentTasks[idx];
    }
    throw new ApiError(
      "DEPRECATED_ENDPOINT",
      "commentTasksApi.block is deprecated since v1.3. Use commentTasksApi.release instead.",
    );
  },
};
