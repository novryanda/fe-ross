/**
 * Reports API façade — single entry point for the Reports pages.
 *
 * Backend v1.3 does not expose a dedicated `reports` module. Operational
 * reports are:
 *   - Blast reports (`/api/v1/blast-reports/*`, `/api/v1/buzzer/my-reports`)
 *   - Comment proofs (surfaced via completed comment tasks — no dedicated
 *     `/comment-reports` endpoint). We reuse `commentTasksApi.listByCampaign`
 *     filtered to `status: COMPLETED` so UI can combine both into one view.
 *
 * This façade keeps pages decoupled from the underlying adapters so future
 * backend `/reports` consolidation stays a contained change.
 */
import type {
  BlastReport,
  CommentTask,
  PaginationMeta,
  Platform,
} from "@/types";
import { blastApi } from "./blast";
import { commentTasksApi } from "./comment-commands";

export type ReportKind = "ALL" | "BLAST" | "COMMENT";

export interface ListReportsParams {
  page?: number;
  limit?: number;
  platform?: Platform;
  submittedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CampaignReportsBundle {
  blastReports: BlastReport[];
  commentProofs: CommentTask[];
  meta: PaginationMeta;
  paginationSource: "BLAST_REPORTS" | "NONE";
}

function fallbackMeta(
  params: Pick<ListReportsParams, "page" | "limit"> | undefined,
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

export const reportsApi = {
  /**
   * Campaign-scoped reports. Returns both blast reports and completed
   * comment proofs so the UI can render a unified list.
   */
  async listCampaignReports(
    campaignId: string,
    params: ListReportsParams = {},
    kind: ReportKind = "ALL",
  ): Promise<CampaignReportsBundle> {
    const includeBlast = kind === "ALL" || kind === "BLAST";
    const includeComment = kind === "ALL" || kind === "COMMENT";

    const [blastReports, commentTasks] = await Promise.all([
      includeBlast
        ? blastApi.listReports(campaignId, {
            page: params.page,
            limit: params.limit,
            platform: params.platform ?? "",
            submittedBy: params.submittedBy,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
          })
        : Promise.resolve<{ data: BlastReport[]; meta: PaginationMeta }>({
            data: [],
            meta: fallbackMeta(params, 0),
          }),
      includeComment
        ? commentTasksApi.listByCampaign(campaignId)
        : Promise.resolve<CommentTask[]>([]),
    ]);

    const completedProofs = includeComment
      ? commentTasks.filter(
          (task) => task.status === "COMPLETED" && Boolean(task.proofLink),
        )
      : [];

    return {
      blastReports: blastReports.data,
      commentProofs: completedProofs,
      meta: includeBlast
        ? blastReports.meta
        : fallbackMeta(params, completedProofs.length),
      paginationSource: includeBlast ? "BLAST_REPORTS" : "NONE",
    };
  },

  /** Buzzer `my-reports` bundle. */
  async listMyReports(
    userId?: string,
    params: ListReportsParams = {},
  ): Promise<{ data: BlastReport[]; meta: PaginationMeta }> {
    const data = await blastApi.getMyReports(userId, {
      page: params.page,
      limit: params.limit,
      platform: params.platform ?? "",
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    return { data, meta: fallbackMeta(params, data.length) };
  },

  async getBlastReport(reportId: string): Promise<BlastReport> {
    return blastApi.getReport(reportId);
  },
};
