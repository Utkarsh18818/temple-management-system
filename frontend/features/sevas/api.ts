import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type SevaResponse =
  components["schemas"]["SevaResponse"];

export type SevaCreate =
  components["schemas"]["SevaCreate"];

export type SevaUpdate =
  components["schemas"]["SevaUpdate"];

export type SevaStatusUpdate =
  components["schemas"]["SevaStatusUpdate"];

export type GetSevasParams = {
  templeId?: string;
  sevaType?: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetSevasParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.sevaType) {
    searchParams.set(
      "seva_type",
      params.sevaType,
    );
  }

  if (params.search) {
    searchParams.set(
      "search",
      params.search,
    );
  }

  if (
    params.isActive !== undefined
  ) {
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

export async function getSevas(
  params: GetSevasParams,
): Promise<SevaResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query.length > 0
      ? `?${query}`
      : "";

  return apiRequest<SevaResponse[]>(
    `/api/v1/sevas${queryString}`,
  );
}

export async function getSeva(
  sevaId: string,
): Promise<SevaResponse> {
  return apiRequest<SevaResponse>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}`,
  );
}

export async function createSeva(
  templeId: string,
  payload: SevaCreate,
): Promise<SevaResponse> {
  return apiJson<SevaResponse>(
    `/api/v1/sevas?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}

export async function updateSeva(
  sevaId: string,
  payload: SevaUpdate,
): Promise<SevaResponse> {
  return apiJson<SevaResponse>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}`,
    "PUT",
    payload,
  );
}

export async function updateSevaStatus(
  sevaId: string,
  isActive: boolean,
): Promise<SevaResponse> {
  return apiJson<SevaResponse>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}/status`,
    "PATCH",
    {
      is_active: isActive,
    },
  );
}
