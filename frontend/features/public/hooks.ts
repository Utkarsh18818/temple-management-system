"use client";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getPublicBooking,
  getPublicBookings,
  getPublicEvents,
  getPublicFestivals,
  getPublicSeva,
  getPublicSevaSlots,
  getPublicSevas,
  getPublicTemple,
  getPublicTemples,
  type GetPublicBookingsParams,
  type GetPublicEventsParams,
  type GetPublicFestivalsParams,
  type GetPublicSevasParams,
  type GetPublicSlotsParams,
  type GetPublicTemplesParams,
} from "@/features/public/api";

export const publicTemplesQueryKey = [
  "public",
  "temples",
];

export const publicSevasQueryKey = [
  "public",
  "sevas",
];

export const publicEventsQueryKey = [
  "public",
  "events",
];

export const publicFestivalsQueryKey = [
  "public",
  "festivals",
];

export const publicSlotsQueryKey = [
  "public",
  "slots",
];

export const publicBookingsQueryKey = [
  "public",
  "bookings",
];


export function usePublicTemples(
  params: GetPublicTemplesParams = {},
) {
  return useQuery({
    queryKey: [
      ...publicTemplesQueryKey,
      params,
    ],
    queryFn: () =>
      getPublicTemples(params),
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicTemple(
  templeId?: string,
) {
  return useQuery({
    queryKey: [
      ...publicTemplesQueryKey,
      templeId,
    ],
    queryFn: () =>
      getPublicTemple(
        templeId as string,
      ),
    enabled:
      Boolean(templeId),
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicSevas(
  params: GetPublicSevasParams,
) {
  return useQuery({
    queryKey: [
      ...publicSevasQueryKey,
      params,
    ],
    queryFn: () =>
      getPublicSevas(params),
    enabled:
      Boolean(params.templeId),
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicSeva(
  sevaId?: string,
) {
  return useQuery({
    queryKey: [
      ...publicSevasQueryKey,
      sevaId,
    ],
    queryFn: () =>
      getPublicSeva(
        sevaId as string,
      ),
    enabled:
      Boolean(sevaId),
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicEvents(
  params: GetPublicEventsParams,
) {
  return useQuery({
    queryKey: [
      ...publicEventsQueryKey,
      params,
    ],
    queryFn: () =>
      getPublicEvents(params),
    enabled:
      Boolean(params.templeId),
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicFestivals(
  params: GetPublicFestivalsParams,
) {
  return useQuery({
    queryKey: [
      ...publicFestivalsQueryKey,
      params,
    ],
    queryFn: () =>
      getPublicFestivals(params),
    enabled:
      Boolean(params.templeId),
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}


export function usePublicSevaSlots(
  params: GetPublicSlotsParams,
) {
  return useQuery({
    queryKey: [
      ...publicSlotsQueryKey,
      params,
    ],
    queryFn: () =>
      getPublicSevaSlots(params),
    enabled:
      Boolean(params.sevaId),
    staleTime:
      30 * 1000,
    retry: 1,
  });
}


// ---------------------------------------------------------
// Public Bookings
// ---------------------------------------------------------

export function usePublicBookings(
  params: GetPublicBookingsParams = {},
) {
  return useQuery({
    queryKey: [
      ...publicBookingsQueryKey,
      "list",
      params,
    ],
    queryFn: () =>
      getPublicBookings(params),
    staleTime:
      30 * 1000,
    retry: 1,
  });
}


export function usePublicBooking(
  bookingId?: string,
) {
  return useQuery({
    queryKey: [
      ...publicBookingsQueryKey,
      bookingId,
    ],
    queryFn: () =>
      getPublicBooking(
        bookingId as string,
      ),
    enabled:
      Boolean(bookingId),
    staleTime:
      30 * 1000,
    retry: 1,
  });
}