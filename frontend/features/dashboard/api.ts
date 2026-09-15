import type { components } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export type DashboardResponse =
  components["schemas"]["DashboardResponse"];

export type DashboardSummary =
  components["schemas"]["DashboardSummary"];

export type DashboardDonationItem =
  components["schemas"]["DashboardDonationItem"];

export type DashboardBookingItem =
  components["schemas"]["DashboardBookingItem"];

export async function getDashboard(
  templeId?: string,
): Promise<DashboardResponse> {
  const query = templeId
    ? `?temple_id=${encodeURIComponent(templeId)}`
    : "";

  return apiRequest<DashboardResponse>(
    `/api/v1/dashboard${query}`,
  );
}
