"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createUser,
  getRoles,
  getUser,
  getUsers,
  updateUserStatus,
  type UserCreate,
  type UserStatusUpdate,
} from "@/features/users/api";

export const usersQueryKey = ["users"];

export const rolesQueryKey = ["roles"];

export function useUsers(
  enabled = true,
) {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: getUsers,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useUser(
  userId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () =>
      getUser(userId as string),
    enabled:
      Boolean(userId) && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useRoles(
  enabled = true,
) {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: getRoles,
    enabled,
    staleTime:
      30 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateUser() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: UserCreate,
    ) => createUser(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKey,
      });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UserStatusUpdate;
    }) =>
      updateUserStatus(
        userId,
        data.is_active,
      ),

    onSuccess: (user) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKey,
      });

      queryClient.setQueryData(
        ["user", user.id],
        user,
      );
    },
  });
}
