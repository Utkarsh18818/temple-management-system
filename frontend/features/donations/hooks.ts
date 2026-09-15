"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDonation,
  getDonation,
  getDonations,
  updateDonation,
  updateDonationStatus,
  type DonationCreate,
  type DonationUpdate,
  type GetDonationsParams,
} from "@/features/donations/api";

export const donationsQueryKey = [
  "donations",
];

export function useDonations(
  params: GetDonationsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...donationsQueryKey,
      params,
    ],
    queryFn: () =>
      getDonations(params),
    enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useDonation(
  donationId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "donation",
      donationId,
    ],
    queryFn: () =>
      getDonation(
        donationId as string,
      ),
    enabled:
      Boolean(donationId) &&
      enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateDonation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: DonationCreate;
    }) =>
      createDonation(
        templeId,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          donationsQueryKey,
      });
    },
  });
}

export function useUpdateDonation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      donationId,
      data,
    }: {
      donationId: string;
      data: DonationUpdate;
    }) =>
      updateDonation(
        donationId,
        data,
      ),

    onSuccess: (donation) => {
      queryClient.invalidateQueries({
        queryKey:
          donationsQueryKey,
      });

      queryClient.setQueryData(
        [
          "donation",
          donation.id,
        ],
        donation,
      );
    },
  });
}

export function useUpdateDonationStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      donationId,
      status,
    }: {
      donationId: string;
      status: string;
    }) =>
      updateDonationStatus(
        donationId,
        status,
      ),

    onSuccess: (donation) => {
      queryClient.invalidateQueries({
        queryKey:
          donationsQueryKey,
      });

      queryClient.setQueryData(
        [
          "donation",
          donation.id,
        ],
        donation,
      );
    },
  });
}
