"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPayment,
  getPayment,
  getPayments,
  updatePayment,
  type GetPaymentsParams,
  type PaymentCreate,
  type PaymentUpdate,
} from "@/features/payments/api";

export const paymentsQueryKey = [
  "payments",
];

export function usePayments(
  params: GetPaymentsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...paymentsQueryKey,
      params,
    ],
    queryFn: () =>
      getPayments(params),
    enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function usePayment(
  paymentId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "payment",
      paymentId,
    ],
    queryFn: () =>
      getPayment(
        paymentId as string,
      ),
    enabled:
      Boolean(paymentId) &&
      enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useCreatePayment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: PaymentCreate;
    }) =>
      createPayment(
        templeId,
        data,
      ),

    onSuccess: (payment) => {
      queryClient.invalidateQueries({
        queryKey:
          paymentsQueryKey,
      });

      /*
       * Payment creation starts in PENDING
       * and is linked to either a booking
       * or donation.
       */
      if (payment.booking_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "bookings",
          ],
        });
      }

      if (payment.donation_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "donations",
          ],
        });
      }
    },
  });
}

export function useUpdatePayment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: PaymentUpdate;
    }) =>
      updatePayment(
        paymentId,
        data,
      ),

    onSuccess: (payment) => {
      queryClient.invalidateQueries({
        queryKey:
          paymentsQueryKey,
      });

      /*
       * A SUCCESS payment can automatically
       * update the linked booking/donation.
       */
      if (payment.booking_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "bookings",
          ],
        });
      }

      if (payment.donation_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "donations",
          ],
        });
      }

      queryClient.setQueryData(
        [
          "payment",
          payment.id,
        ],
        payment,
      );
    },
  });
}
