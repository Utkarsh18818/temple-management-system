import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type FestivalResponse =
  components["schemas"]["FestivalResponse"];

export type FestivalCreate =
  components["schemas"]["FestivalCreate"];

export type FestivalUpdate =
  components["schemas"]["FestivalUpdate"];

export type FestivalStatusUpdate =
  components["schemas"]["FestivalStatusUpdate"];

export type Festival =
  FestivalResponse;

export type GetFestivalsParams = {
  templeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetFestivalsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.search) {
    searchParams.set(
      "search",
      params.search,
    );
  }

  if (params.startDate) {
    searchParams.set(
      "start_date",
      params.startDate,
    );
  }

  if (params.endDate) {
    searchParams.set(
      "end_date",
      params.endDate,
    );
  }

  if (params.isActive !== undefined) {
    searchParams.set(
      "is_active",
      String(params.isActive),
    );
  }

  if (params.limit !== undefined) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (params.offset !== undefined) {
    searchParams.set(
      "offset",
      String(params.offset),
    );
  }

  return searchParams.toString();
}

export async function getFestivals(
  params: GetFestivalsParams = {},
): Promise<FestivalResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<FestivalResponse[]>(
    `/api/v1/festivals${queryString}`,
  );
}

export async function getFestival(
  festivalId: string,
): Promise<FestivalResponse> {
  return apiRequest<FestivalResponse>(
    `/api/v1/festivals/${encodeURIComponent(festivalId)}`,
  );
}

export async function createFestival(
  templeId: string,
  payload: FestivalCreate,
): Promise<FestivalResponse> {
  return apiJson<FestivalResponse>(
    `/api/v1/festivals?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}

export async function updateFestival(
  festivalId: string,
  payload: FestivalUpdate,
): Promise<FestivalResponse> {
  return apiJson<FestivalResponse>(
    `/api/v1/festivals/${encodeURIComponent(festivalId)}`,
    "PUT",
    payload,
  );
}

export async function updateFestivalStatus(
  festivalId: string,
  isActive: boolean,
): Promise<FestivalResponse> {
  return apiJson<FestivalResponse>(
    `/api/v1/festivals/${encodeURIComponent(festivalId)}/status`,
    "PATCH",
    {
      is_active: isActive,
    },
  );
}
