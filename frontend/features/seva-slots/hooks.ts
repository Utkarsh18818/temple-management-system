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
  type SevaSlotStatusUpdate,
  type SevaSlotUpdate,
} from "@/features/seva-slots/api";

export function useSevaSlots(
  sevaId?: string,
  params: GetSevaSlotsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["seva-slots", sevaId, params],
    queryFn: () =>
      getSevaSlots(sevaId as string, params),
    enabled: Boolean(sevaId) && enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useSevaSlot(
  slotId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["seva-slot", slotId],
    queryFn: () =>
      getSevaSlot(slotId as string),
    enabled: Boolean(slotId) && enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useCreateSevaSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sevaId,
      data,
    }: {
      sevaId: string;
      data: SevaSlotCreate;
    }) => createSevaSlot(sevaId, data),

    onSuccess: (slot) => {
      queryClient.invalidateQueries({
        queryKey: ["seva-slots"],
      });

      queryClient.setQueryData(
        ["seva-slot", slot.id],
        slot,
      );
    },
  });
}

export function useUpdateSevaSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slotId,
      data,
    }: {
      slotId: string;
      data: SevaSlotUpdate;
    }) => updateSevaSlot(slotId, data),

    onSuccess: (slot) => {
      queryClient.invalidateQueries({
        queryKey: ["seva-slots"],
      });

      queryClient.setQueryData(
        ["seva-slot", slot.id],
        slot,
      );
    },
  });
}

export function useUpdateSevaSlotStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slotId,
      data,
    }: {
      slotId: string;
      data: SevaSlotStatusUpdate;
    }) => updateSevaSlotStatus(slotId, data),

    onSuccess: (slot) => {
      queryClient.invalidateQueries({
        queryKey: ["seva-slots"],
      });

      queryClient.setQueryData(
        ["seva-slot", slot.id],
        slot,
      );
    },
  });
}
