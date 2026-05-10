/**
 * Dashboard API adapters.
 *
 * Backend only exposes a per-campaign dashboard
 * (`GET /api/v1/campaigns/:campaignId/dashboard`). The workspace-level
 * global/buzzer dashboards used by the current UI have no backend endpoint
 * yet — they remain mock-only for now. Real-mode callers get an explicit
 * `NOT_IMPLEMENTED` ApiError so missing backend surface is obvious.
 */
import type {
  BuzzerDashboardData,
  CampaignDashboardData,
  GlobalDashboardData,
} from "@/types";
import { apiClient, isMockMode } from "./client";
import { ApiError } from "./errors";
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

export const dashboardApi = {
  /**
   * @mockOnly Backend does not expose `/api/v1/dashboard/global` yet. In real
   * mode this throws a NOT_IMPLEMENTED ApiError so the Dashboard page fails
   * loudly and the integration phase can wire it to a per-campaign aggregate.
   */
  async getGlobalDashboard(): Promise<GlobalDashboardData> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockGlobalDashboard;
    }
    throw new ApiError(
      "NOT_IMPLEMENTED",
      "Workspace global dashboard belum tersedia di backend. Agregasikan dari /api/v1/campaigns + per-campaign dashboard.",
    );
  },

  /**
   * Per-campaign dashboard — real endpoint exists at
   * `GET /api/v1/campaigns/:campaignId/dashboard`.
   */
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

  /**
   * @mockOnly Backend does not expose `/api/v1/buzzer/dashboard` yet.
   * See Backend_API_Contract_Inventory_v1.3.md §12 for the planned
   * aggregation from `/buzzer/blast-queue` + `/buzzer/my-kept` + friends.
   */
  async getBuzzerDashboard(): Promise<BuzzerDashboardData> {
    if (isMockMode()) {
      await delay(MOCK_LATENCY_MS);
      return mockBuzzerDashboard;
    }
    throw new ApiError(
      "NOT_IMPLEMENTED",
      "Buzzer dashboard belum tersedia di backend. Gunakan buzzer queue + my-kept + my-reports.",
    );
  },
};
