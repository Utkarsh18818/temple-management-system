"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSeva,
  getSeva,
  getSevas,
  updateSeva,
  updateSevaStatus,
  type GetSevasParams,
  type SevaCreate,
  type SevaUpdate,
} from "@/features/sevas/api";

export const sevasQueryKey = [
  "sevas",
];

export function useSevas(
  params: GetSevasParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...sevasQueryKey,
      params,
    ],
    queryFn: () => getSevas(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSeva(
  sevaId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "seva",
      sevaId,
    ],
    queryFn: () =>
      getSeva(sevaId as string),
    enabled:
      Boolean(sevaId) &&
      enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateSeva() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
      payload,
    }: {
      templeId: string;
      data?: SevaCreate;
      payload?: SevaCreate;
    }) =>
      createSeva(
        templeId,
        data ?? payload as SevaCreate,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sevasQueryKey,
      });
    },
  });
}

export function useUpdateSeva() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      sevaId,
      data,
      payload,
    }: {
      sevaId: string;
      data?: SevaUpdate;
      payload?: SevaUpdate;
    }) =>
      updateSeva(
        sevaId,
        data ?? payload as SevaUpdate,
      ),

    onSuccess: (seva) => {
      queryClient.invalidateQueries({
        queryKey: sevasQueryKey,
      });

      queryClient.setQueryData(
        [
          "seva",
          seva.id,
        ],
        seva,
      );
    },
  });
}

export function useUpdateSevaStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      sevaId,
      isActive,
      data,
    }: {
      sevaId: string;
      isActive?: boolean;
      data?: {
        is_active: boolean;
      };
    }) =>
      updateSevaStatus(
        sevaId,
        isActive ??
          data?.is_active ??
          false,
      ),

    onSuccess: (seva) => {
      queryClient.invalidateQueries({
        queryKey: sevasQueryKey,
      });

      queryClient.setQueryData(
        [
          "seva",
          seva.id,
        ],
        seva,
      );
    },
  });
}
