import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type TempleResponse =
  components["schemas"]["TempleResponse"];

export type TempleCreate =
  components["schemas"]["TempleCreate"];

export type TempleUpdate =
  components["schemas"]["TempleUpdate"];

export async function getTemples(): Promise<TempleResponse[]> {
  return apiRequest<TempleResponse[]>(
    "/api/v1/temples",
  );
}

export async function getTemple(
  templeId: string,
): Promise<TempleResponse> {
  return apiRequest<TempleResponse>(
    `/api/v1/temples/${encodeURIComponent(templeId)}`,
  );
}

export async function createTemple(
  payload: TempleCreate,
): Promise<TempleResponse> {
  return apiJson<TempleResponse>(
    "/api/v1/temples",
    "POST",
    payload,
  );
}

export async function updateTemple(
  templeId: string,
  payload: TempleUpdate,
): Promise<TempleResponse> {
  return apiJson<TempleResponse>(
    `/api/v1/temples/${encodeURIComponent(templeId)}`,
    "PUT",
    payload,
  );
}

export async function updateTempleStatus(
  templeId: string,
  isActive: boolean,
): Promise<TempleResponse> {
  return apiJson<TempleResponse>(
    `/api/v1/temples/${encodeURIComponent(templeId)}/status?is_active=${isActive}`,
    "PATCH",
  );
}
