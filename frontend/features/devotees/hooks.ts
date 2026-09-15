"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDevotee,
  getDevotee,
  getDevotees,
  updateDevotee,
  updateDevoteeStatus,
  type DevoteeCreate,
  type DevoteeStatusUpdate,
  type DevoteeUpdate,
  type GetDevoteesParams,
} from "@/features/devotees/api";

export function useDevotees(
  params: GetDevoteesParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["devotees", params],
    queryFn: () => getDevotees(params),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useDevotee(
  devoteeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["devotee", devoteeId],
    queryFn: () => getDevotee(devoteeId as string),
    enabled: Boolean(devoteeId) && enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useCreateDevotee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: DevoteeCreate;
    }) => createDevotee(templeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["devotees"],
      });
    },
  });
}

export function useUpdateDevotee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      devoteeId,
      data,
    }: {
      devoteeId: string;
      data: DevoteeUpdate;
    }) => updateDevotee(devoteeId, data),
    onSuccess: (devotee) => {
      queryClient.invalidateQueries({
        queryKey: ["devotees"],
      });

      queryClient.setQueryData(
        ["devotee", devotee.id],
        devotee,
      );
    },
  });
}

export function useUpdateDevoteeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      devoteeId,
      data,
    }: {
      devoteeId: string;
      data: DevoteeStatusUpdate;
    }) => updateDevoteeStatus(devoteeId, data),
    onSuccess: (devotee) => {
      queryClient.invalidateQueries({
        queryKey: ["devotees"],
      });

      queryClient.setQueryData(
        ["devotee", devotee.id],
        devotee,
      );
    },
  });
}
