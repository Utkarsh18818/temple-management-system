"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSevaSlot,
  getSevaSlot,
  getSevaSlots,
  updateSevaSlot,
  updateSevaSlotStatus,
  type GetSevaSlotsParams,
  type SevaSlotCreate,
  type SevaSlotUpdate,
} from "@/features/slots/api";

export const slotsQueryKey = [
  "seva-slots",
];

export function useSevaSlots(
  params: GetSevaSlotsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...slotsQueryKey,
      params,
    ],
    queryFn: () =>
      getSevaSlots(params),
    enabled:
      enabled &&
      Boolean(params.sevaId),
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useSevaSlot(
  slotId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "seva-slot",
      slotId,
    ],
    queryFn: () =>
      getSevaSlot(slotId as string),
    enabled:
      Boolean(slotId) &&
      enabled,
    staleTime:
      2 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateSevaSlot() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      sevaId,
      data,
      payload,
    }: {
      sevaId: string;
      data?: SevaSlotCreate;
      payload?: SevaSlotCreate;
    }) =>
      createSevaSlot(
        sevaId,
        data ?? payload as SevaSlotCreate,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: slotsQueryKey,
      });
    },
  });
}

export function useUpdateSevaSlot() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      slotId,
      data,
      payload,
    }: {
      slotId: string;
      data?: SevaSlotUpdate;
      payload?: SevaSlotUpdate;
    }) =>
      updateSevaSlot(
        slotId,
        data ?? payload as SevaSlotUpdate,
      ),

    onSuccess: (slot) => {
      queryClient.invalidateQueries({
        queryKey: slotsQueryKey,
      });

      queryClient.setQueryData(
        [
          "seva-slot",
          slot.id,
        ],
        slot,
      );
    },
  });
}

export function useUpdateSevaSlotStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      slotId,
      status,
      data,
    }: {
      slotId: string;
      status?: string;
      data?: {
        status: string;
      };
    }) =>
      updateSevaSlotStatus(
        slotId,
        status ??
          data?.status ??
          "AVAILABLE",
      ),

    onSuccess: (slot) => {
      queryClient.invalidateQueries({
        queryKey: slotsQueryKey,
      });

      queryClient.setQueryData(
        [
          "seva-slot",
          slot.id,
        ],
        slot,
      );
    },
  });
}
