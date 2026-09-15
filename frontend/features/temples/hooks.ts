"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTemple,
  getTemple,
  getTemples,
  updateTemple,
  updateTempleStatus,
  type TempleCreate,
  type TempleUpdate,
} from "@/features/temples/api";

export const templesQueryKey = ["temples"];

export function useTemples(enabled = true) {
  return useQuery({
    queryKey: templesQueryKey,
    queryFn: getTemples,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useTemple(
  templeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["temple", templeId],
    queryFn: () => getTemple(templeId as string),
    enabled: Boolean(templeId) && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateTemple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TempleCreate) =>
      createTemple(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templesQueryKey,
      });
    },
  });
}

export function useUpdateTemple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      payload,
    }: {
      templeId: string;
      payload: TempleUpdate;
    }) => updateTemple(templeId, payload),
    onSuccess: (temple) => {
      queryClient.invalidateQueries({
        queryKey: templesQueryKey,
      });

      queryClient.setQueryData(
        ["temple", temple.id],
        temple,
      );
    },
  });
}

export function useUpdateTempleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      isActive,
    }: {
      templeId: string;
      isActive: boolean;
    }) =>
      updateTempleStatus(
        templeId,
        isActive,
      ),
    onSuccess: (temple) => {
      queryClient.invalidateQueries({
        queryKey: templesQueryKey,
      });

      queryClient.setQueryData(
        ["temple", temple.id],
        temple,
      );
    },
  });
}
