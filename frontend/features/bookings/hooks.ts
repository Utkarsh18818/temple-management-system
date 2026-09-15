"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createBooking,
  getBooking,
  getBookings,
  updateBooking,
  type BookingCreate,
  type BookingUpdate,
  type GetBookingsParams,
} from "@/features/bookings/api";

export const bookingsQueryKey = [
  "bookings",
];

export function useBookings(
  params: GetBookingsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...bookingsQueryKey,
      params,
    ],
    queryFn: () =>
      getBookings(params),
    enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useBooking(
  bookingId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "booking",
      bookingId,
    ],
    queryFn: () =>
      getBooking(
        bookingId as string,
      ),
    enabled:
      Boolean(bookingId) &&
      enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateBooking() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BookingCreate,
    ) =>
      createBooking(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          bookingsQueryKey,
      });

      /*
       * Booking creation changes slot
       * booked_count/status.
       */
      queryClient.invalidateQueries({
        queryKey: [
          "seva-slots",
        ],
      });
    },
  });
}

export function useUpdateBooking() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: string;
      data: BookingUpdate;
    }) =>
      updateBooking(
        bookingId,
        data,
      ),

    onSuccess: (booking) => {
      queryClient.invalidateQueries({
        queryKey:
          bookingsQueryKey,
      });

      /*
       * Cancellation can release
       * slot capacity.
       */
      queryClient.invalidateQueries({
        queryKey: [
          "seva-slots",
        ],
      });

      queryClient.setQueryData(
        [
          "booking",
          booking.id,
        ],
        booking,
      );
    },
  });
}
