import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type ReceiptResponse =
  components["schemas"]["ReceiptResponse"];

export type ReceiptCreate =
  components["schemas"]["ReceiptCreate"];

/*
 * Compatibility aliases for the existing
 * Receipt management page.
 */
export type Receipt =
  ReceiptResponse;

export type ReceiptCreatePayload =
  ReceiptCreate;

export type GetReceiptsParams = {
  templeId?: string;
  receiptType?: string;
  donationId?: string;
  bookingId?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetReceiptsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.receiptType) {
    searchParams.set(
      "receipt_type",
      params.receiptType,
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

export async function getReceipts(
  params: GetReceiptsParams = {},
): Promise<ReceiptResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<ReceiptResponse[]>(
    `/api/v1/receipts${queryString}`,
  );
}

export async function getReceipt(
  receiptId: string,
): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(
    `/api/v1/receipts/${encodeURIComponent(receiptId)}`,
  );
}

export async function createReceipt(
  templeId: string,
  payload: ReceiptCreate,
): Promise<ReceiptResponse> {
  return apiJson<ReceiptResponse>(
    `/api/v1/receipts?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}
