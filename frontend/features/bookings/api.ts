import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type SevaBookingResponse =
  components["schemas"]["SevaBookingResponse"];

export type SevaBookingCreate =
  components["schemas"]["SevaBookingCreate"];

export type SevaBookingUpdate =
  components["schemas"]["SevaBookingUpdate"];

/*
 * Compatibility aliases used by the
 * existing Booking management page.
 */
export type BookingResponse =
  SevaBookingResponse;

export type BookingCreate =
  SevaBookingCreate;

export type BookingUpdate =
  SevaBookingUpdate;

export type GetBookingsParams = {
  templeId?: string;
  bookingDate?: string;
  status?: string;
  paymentStatus?: string;
  devoteeId?: string;
  sevaId?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetBookingsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.bookingDate) {
    searchParams.set(
      "booking_date",
      params.bookingDate,
    );
  }

  if (params.status) {
    searchParams.set(
      "status",
      params.status,
    );
  }

  if (params.paymentStatus) {
    searchParams.set(
      "payment_status",
      params.paymentStatus,
    );
  }

  if (params.devoteeId) {
    searchParams.set(
      "devotee_id",
      params.devoteeId,
    );
  }

  if (params.sevaId) {
    searchParams.set(
      "seva_id",
      params.sevaId,
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

export async function getBookings(
  params: GetBookingsParams = {},
): Promise<BookingResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<BookingResponse[]>(
    `/api/v1/bookings${queryString}`,
  );
}

export async function getBooking(
  bookingId: string,
): Promise<BookingResponse> {
  return apiRequest<BookingResponse>(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}`,
  );
}

export async function createBooking(
  payload: BookingCreate,
): Promise<BookingResponse> {
  return apiJson<BookingResponse>(
    "/api/v1/bookings",
    "POST",
    payload,
  );
}

export async function updateBooking(
  bookingId: string,
  payload: BookingUpdate,
): Promise<BookingResponse> {
  return apiJson<BookingResponse>(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}`,
    "PUT",
    payload,
  );
}
