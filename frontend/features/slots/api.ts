import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type SevaSlotResponse =
  components["schemas"]["SevaSlotResponse"];

export type SevaSlotCreate =
  components["schemas"]["SevaSlotCreate"];

export type SevaSlotUpdate =
  components["schemas"]["SevaSlotUpdate"];

export type SevaSlotStatusUpdate =
  components["schemas"]["SevaSlotStatusUpdate"];

export type GetSevaSlotsParams = {
  sevaId: string;
  slotDate?: string;
  status?: string;
};

export async function getSevaSlots(
  params: GetSevaSlotsParams,
): Promise<SevaSlotResponse[]> {
  const searchParams =
    new URLSearchParams();

  if (params.slotDate) {
    searchParams.set(
      "slot_date",
      params.slotDate,
    );
  }

  if (params.status) {
    searchParams.set(
      "status",
      params.status,
    );
  }

  const query =
    searchParams.toString();

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<SevaSlotResponse[]>(
    `/api/v1/sevas/${encodeURIComponent(params.sevaId)}/slots${queryString}`,
  );
}

export async function getSevaSlot(
  slotId: string,
): Promise<SevaSlotResponse> {
  return apiRequest<SevaSlotResponse>(
    `/api/v1/sevas/slots/${encodeURIComponent(slotId)}`,
  );
}

export async function createSevaSlot(
  sevaId: string,
  payload: SevaSlotCreate,
): Promise<SevaSlotResponse> {
  return apiJson<SevaSlotResponse>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}/slots`,
    "POST",
    payload,
  );
}

export async function updateSevaSlot(
  slotId: string,
  payload: SevaSlotUpdate,
): Promise<SevaSlotResponse> {
  return apiJson<SevaSlotResponse>(
    `/api/v1/sevas/slots/${encodeURIComponent(slotId)}`,
    "PUT",
    payload,
  );
}

export async function updateSevaSlotStatus(
  slotId: string,
  status: string,
): Promise<SevaSlotResponse> {
  return apiJson<SevaSlotResponse>(
    `/api/v1/sevas/slots/${encodeURIComponent(slotId)}/status`,
    "PATCH",
    {
      status,
    },
  );
}
