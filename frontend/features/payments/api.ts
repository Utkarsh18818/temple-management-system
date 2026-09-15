import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type PaymentResponse =
  components["schemas"]["PaymentResponse"];

export type PaymentCreate =
  components["schemas"]["PaymentCreate"];

export type PaymentUpdate =
  components["schemas"]["PaymentUpdate"];

/*
 * Compatibility aliases for the existing
 * Payment management page.
 */
export type Payment =
  PaymentResponse;

export type PaymentCreatePayload =
  PaymentCreate;

export type PaymentUpdatePayload =
  PaymentUpdate;

export type GetPaymentsParams = {
  templeId?: string;
  status?: string;
  paymentMethod?: string;
  donationId?: string;
  bookingId?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetPaymentsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.status) {
    searchParams.set(
      "status",
      params.status,
    );
  }

  if (params.paymentMethod) {
    searchParams.set(
      "payment_method",
      params.paymentMethod,
    );
  }

  if (params.donationId) {
    searchParams.set(
      "donation_id",
      params.donationId,
    );
  }

  if (params.bookingId) {
    searchParams.set(
      "booking_id",
      params.bookingId,
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

  return searchParams.toString();
}

export async function getPayments(
  params: GetPaymentsParams = {},
): Promise<PaymentResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<PaymentResponse[]>(
    `/api/v1/payments${queryString}`,
  );
}

export async function getPayment(
  paymentId: string,
): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(
    `/api/v1/payments/${encodeURIComponent(paymentId)}`,
  );
}

export async function createPayment(
  templeId: string,
  payload: PaymentCreate,
): Promise<PaymentResponse> {
  return apiJson<PaymentResponse>(
    `/api/v1/payments?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}

export async function updatePayment(
  paymentId: string,
  payload: PaymentUpdate,
): Promise<PaymentResponse> {
  return apiJson<PaymentResponse>(
    `/api/v1/payments/${encodeURIComponent(paymentId)}`,
    "PUT",
    payload,
  );
}
