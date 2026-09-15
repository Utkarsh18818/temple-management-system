import type { components } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export type DevoteeResponse =
  components["schemas"]["DevoteeResponse"];

export type DevoteeCreate =
  components["schemas"]["DevoteeCreate"];

export type DevoteeUpdate =
  components["schemas"]["DevoteeUpdate"];

export type DevoteeStatusUpdate =
  components["schemas"]["DevoteeStatusUpdate"];

export interface GetDevoteesParams {
  templeId?: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export async function getDevotees(
  params: GetDevoteesParams = {},
): Promise<DevoteeResponse[]> {
  const searchParams = new URLSearchParams();

  if (params.templeId) {
    searchParams.set("temple_id", params.templeId);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.isActive !== undefined) {
    searchParams.set("is_active", String(params.isActive));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  const query = searchParams.toString();

  return apiRequest<DevoteeResponse[]>(
    `/api/v1/devotees${query ? `?${query}` : ""}`,
  );
}

export async function getDevotee(
  devoteeId: string,
): Promise<DevoteeResponse> {
  return apiRequest<DevoteeResponse>(
    `/api/v1/devotees/${encodeURIComponent(devoteeId)}`,
  );
}

export async function createDevotee(
  templeId: string,
  data: DevoteeCreate,
): Promise<DevoteeResponse> {
  return apiRequest<DevoteeResponse>(
    `/api/v1/devotees?temple_id=${encodeURIComponent(templeId)}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function updateDevotee(
  devoteeId: string,
  data: DevoteeUpdate,
): Promise<DevoteeResponse> {
  return apiRequest<DevoteeResponse>(
    `/api/v1/devotees/${encodeURIComponent(devoteeId)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export async function updateDevoteeStatus(
  devoteeId: string,
  data: DevoteeStatusUpdate,
): Promise<DevoteeResponse> {
  return apiRequest<DevoteeResponse>(
    `/api/v1/devotees/${encodeURIComponent(devoteeId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}
