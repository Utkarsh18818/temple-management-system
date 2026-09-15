"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createFestival,
  getFestival,
  getFestivals,
  updateFestival,
  updateFestivalStatus,
  type FestivalCreate,
  type FestivalUpdate,
  type GetFestivalsParams,
} from "@/features/festivals/api";

export const festivalsQueryKey = [
  "festivals",
];

export function useFestivals(
  params: GetFestivalsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...festivalsQueryKey,
      params,
    ],
    queryFn: () =>
      getFestivals(params),
    enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useFestival(
  festivalId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "festival",
      festivalId,
    ],
    queryFn: () =>
      getFestival(
        festivalId as string,
      ),
    enabled:
      Boolean(festivalId) &&
      enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateFestival() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: FestivalCreate;
    }) =>
      createFestival(
        templeId,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          festivalsQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: [
          "events",
        ],
      });
    },
  });
}

export function useUpdateFestival() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      festivalId,
      data,
    }: {
      festivalId: string;
      data: FestivalUpdate;
    }) =>
      updateFestival(
        festivalId,
        data,
      ),

    onSuccess: (festival) => {
      queryClient.invalidateQueries({
        queryKey:
          festivalsQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: [
          "events",
        ],
      });

      queryClient.setQueryData(
        [
          "festival",
          festival.id,
        ],
        festival,
      );
    },
  });
}

export function useUpdateFestivalStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      festivalId,
      isActive,
      data,
    }: {
      festivalId: string;
      isActive?: boolean;
      data?: {
        is_active: boolean;
      };
    }) =>
      updateFestivalStatus(
        festivalId,
        isActive ??
          data?.is_active ??
          false,
      ),

    onSuccess: (festival) => {
      queryClient.invalidateQueries({
        queryKey:
          festivalsQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: [
          "events",
        ],
      });

      queryClient.setQueryData(
        [
          "festival",
          festival.id,
        ],
        festival,
      );
    },
  });
}
