import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type UserResponse =
  components["schemas"]["UserResponse"];

export type UserCreate =
  components["schemas"]["UserCreate"];

export type UserStatusUpdate =
  components["schemas"]["UserStatusUpdate"];

export type RoleResponse =
  components["schemas"]["RoleResponse"];

export type UserRole =
  | "SUPER_ADMIN"
  | "TEMPLE_ADMIN"
  | "STAFF"
  | "PANDIT"
  | "VOLUNTEER";

export async function getUsers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>(
    "/api/v1/users",
  );
}

export async function getUser(
  userId: string,
): Promise<UserResponse> {
  return apiRequest<UserResponse>(
    `/api/v1/users/${encodeURIComponent(userId)}`,
  );
}

export async function createUser(
  payload: UserCreate,
): Promise<UserResponse> {
  return apiJson<UserResponse>(
    "/api/v1/users",
    "POST",
    payload,
  );
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
): Promise<UserResponse> {
  return apiJson<UserResponse>(
    `/api/v1/users/${encodeURIComponent(userId)}/status`,
    "PATCH",
    {
      is_active: isActive,
    },
  );
}

export async function getRoles(): Promise<RoleResponse[]> {
  return apiRequest<RoleResponse[]>(
    "/api/v1/roles",
  );
}
