import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type DonationResponse =
  components["schemas"]["DonationResponse"];

export type DonationCreate =
  components["schemas"]["DonationCreate"];

export type DonationUpdate =
  components["schemas"]["DonationUpdate"];

/*
 * Compatibility aliases for the existing
 * Donation management page.
 */
export type Donation =
  DonationResponse;

export type DonationCreatePayload =
  DonationCreate;

export type DonationUpdatePayload =
  DonationUpdate;

export type GetDonationsParams = {
  templeId?: string;

  /*
   * Supported by the existing page as a
   * client-side/filter compatibility field.
   *
   * The current backend list endpoint does
   * not expose a donated_at/date filter.
   */
  donationDate?: string;

  donationType?: string;
  status?: string;
  devoteeId?: string;
  donorName?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetDonationsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.donationType) {
    searchParams.set(
      "donation_type",
      params.donationType,
    );
  }

  if (params.status) {
    searchParams.set(
      "status",
      params.status,
    );
  }

  if (params.devoteeId) {
    searchParams.set(
      "devotee_id",
      params.devoteeId,
    );
  }

  if (params.donorName) {
    searchParams.set(
      "donor_name",
      params.donorName,
    );
  }

  if (params.limit !== undefined) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (params.offset !== undefined) {
    searchParams.set(
      "offset",
      String(params.offset),
    );
  }

  /*
   * donationDate is intentionally not sent
   * to the backend because the current
   * GET /donations endpoint does not define
   * a donation-date query parameter.
   */
  return searchParams.toString();
}

export async function getDonations(
  params: GetDonationsParams = {},
): Promise<DonationResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  const donations =
    await apiRequest<DonationResponse[]>(
      `/api/v1/donations${queryString}`,
    );

  /*
   * Apply donationDate filtering client-side
   * when the existing page requests it.
   */
  if (params.donationDate) {
    return donations.filter(
      (donation) =>
        donation.donated_at.startsWith(
          params.donationDate as string,
        ),
    );
  }

  return donations;
}

export async function getDonation(
  donationId: string,
): Promise<DonationResponse> {
  return apiRequest<DonationResponse>(
    `/api/v1/donations/${encodeURIComponent(donationId)}`,
  );
}

export async function createDonation(
  templeId: string,
  payload: DonationCreate,
): Promise<DonationResponse> {
  return apiJson<DonationResponse>(
    `/api/v1/donations?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}

export async function updateDonation(
  donationId: string,
  payload: DonationUpdate,
): Promise<DonationResponse> {
  return apiJson<DonationResponse>(
    `/api/v1/donations/${encodeURIComponent(donationId)}`,
    "PUT",
    payload,
  );
}

export async function updateDonationStatus(
  donationId: string,
  status: string,
): Promise<DonationResponse> {
  return apiJson<DonationResponse>(
    `/api/v1/donations/${encodeURIComponent(donationId)}/status?status=${encodeURIComponent(status)}`,
    "PATCH",
  );
}
