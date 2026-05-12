/**
 * Dashboard API adapters.
 *
 * Backend exposes campaign dashboards and queue/report endpoints. Workspace
 * dashboards are derived here so pages stay on real adapters without direct
 * mock data imports.
 */
import type {
  BlastAttempt,
  BuzzerDashboardData,
  Campaign,
  CampaignDashboardData,
  GlobalDashboardData,
} from "@/types";
import { apiClient, isMockMode } from "./client";
import { campaignsApi } from "./campaigns";
import { blastApi } from "./blast";
import { commentTasksApi } from "./comment-commands";
import {
  mockBuzzerDashboard,
  mockCampaignDashboard,
  mockGlobalDashboard,
} from "@/lib/mock-data";
import { toCampaignDashboard } from "./mappers/campaign.mapper";

const MOCK_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

type CampaignDashboardPair = {
  campaign: Campaign;
  dashboard: CampaignDashboardData;
};

async function getCampaignDashboards(
  campaigns: Campaign[],
): Promise<CampaignDashboardPair[]> {
  if (!campaigns.length) return [];

  const settled = await Promise.allSettled(
    campaigns.map(async (campaign) => ({
      campaign,
      dashboard: await dashboardApi.getCampaignDashboard(campaign.id),
    })),
  );
  const pairs = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (!pairs.length) {
    const firstFailure = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (firstFailure) throw firstFailure.reason;
  }

  return pairs;
}

function riskFromCompletion(completion: number): "Low" | "Medium" | "High" {
  if (completion >= 80) return "Low";
  if (completion >= 50) return "Medium";
  return "High";
}

function isCompletedToday(attempt: BlastAttempt): boolean {
  if (!attempt.completedAt) return false;
  return new Date(attempt.completedAt).toDateString() === new Date().toDateString();
}

export const dashboardApi = {
  async getGlobalDashboard(): Promise<GlobalDashboardData> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockGlobalDashboard;
    }

    const campaignsResponse = await campaignsApi.list({ limit: 100 });
    const campaigns = campaignsResponse.data;
    const dashboardPairs = await getCampaignDashboards(campaigns);
    const dashboards = dashboardPairs.map((item) => item.dashboard);
    const totalAttempts = sum(dashboards.map((item) => item.totalAttempts));
    const completedAttempts = sum(dashboards.map((item) => item.completedAttempts));
    const totalCommentTasks = sum(dashboards.map((item) => item.totalCommentTasks));
    const completedCommentTasks = sum(
      dashboards.map((item) => item.completedCommentTasks),
    );
    const totalWork = totalAttempts + totalCommentTasks;
    const completedWork = completedAttempts + completedCommentTasks;
    const topBuzzers = dashboards
      .flatMap((item) => item.topBuzzers)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const recentReports = dashboards
      .flatMap((item) => item.recentReports)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
      .slice(0, 5);

    return {
      activeCampaigns: campaigns.filter((campaign) => campaign.status === "ACTIVE").length,
      totalViews: sum(dashboards.map((item) => item.totalViews)),
      totalEngagement: sum(dashboards.map((item) => item.totalEngagement)),
      completionRate:
        totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0,
      overdueTasks: sum(dashboards.map((item) => item.overdueItems.length)),
      expiredKeeps: sum(dashboards.map((item) => item.expiredAttempts)),
      activeBuzzers: new Set(topBuzzers.map((item) => item.userId).filter(Boolean)).size,
      engagementTrend: [],
      topBuzzers,
      recentActivity: recentReports.map((report) => ({
        id: report.id,
        type: "blast",
        message: `${report.submittedByUser?.name ?? "Buzzer"} submitted a blast report.`,
        timestamp: report.submittedAt,
        actor: report.submittedByUser?.name ?? report.submittedBy,
      })),
      campaignPerformance: dashboardPairs.map(({ campaign, dashboard }) => {
        const completion =
          campaign.completionRate ?? dashboard.completionRate ?? 0;
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          views: dashboard.totalViews,
          completion,
          risk: riskFromCompletion(completion),
        };
      }),
    };
  },

  async getCampaignDashboard(
    campaignId: string,
  ): Promise<CampaignDashboardData> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockCampaignDashboard;
    }
    const response = await apiClient.get<CampaignDashboardData>(
      `/campaigns/${campaignId}/dashboard`,
    );
    return toCampaignDashboard(response.data);
  },

  async getBuzzerDashboard(): Promise<BuzzerDashboardData> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockBuzzerDashboard;
    }

    const [queue, kept, reports, commentQueue, myCommentTasks] =
      await Promise.all([
        blastApi.getQueue({ limit: 100 }),
        blastApi.getMyKept(undefined, { limit: 100 }),
        blastApi.getMyCompleted(undefined, { limit: 100 }),
        commentTasksApi.getCommentQueue({ limit: 100 }),
        commentTasksApi.getMyCommentTasks({ limit: 100 }),
      ]);
    const pendingCommentTasks = myCommentTasks.filter((task) =>
      ["KEPT", "IN_PROGRESS"].includes(task.status),
    );
    const expiringSoon = kept
      .filter((attempt) => attempt.keepExpiresAt)
      .sort(
        (a, b) =>
          new Date(a.keepExpiresAt ?? 0).getTime() -
          new Date(b.keepExpiresAt ?? 0).getTime(),
      )
      .slice(0, 5);
    const completedToday = reports.filter(isCompletedToday);
    const submittedReports = reports.flatMap((attempt) =>
      attempt.report ? [attempt.report] : [],
    );

    return {
      availableBlastLinks: queue.length,
      myKept: kept.length,
      completedToday: completedToday.length,
      pendingComments: commentQueue.length + pendingCommentTasks.length,
      totalViewsSubmitted: sum(submittedReports.map((report) => report.views)),
      totalEngagementSubmitted: sum(
        submittedReports.map(
          (report) =>
            report.totalEngagement ??
            report.likes + report.comments + report.shares + report.reposts,
        ),
      ),
      myKeptAttempts: kept,
      pendingCommentTasks,
      expiringSoon,
    };
  },
};
