import type { components } from "@/types/api";

import { apiRequest } from "@/lib/api/client";

export type SevaSlotResponse =
  components["schemas"]["SevaSlotResponse"];

export type SevaSlotCreate =
  components["schemas"]["SevaSlotCreate"];

export type SevaSlotUpdate =
  components["schemas"]["SevaSlotUpdate"];

export type SevaSlotStatusUpdate =
  components["schemas"]["SevaSlotStatusUpdate"];

export interface GetSevaSlotsParams {
  slotDate?: string;
  status?: string;
}

export async function getSevaSlots(
  sevaId: string,
  params: GetSevaSlotsParams = {},
): Promise<SevaSlotResponse[]> {
  const searchParams = new URLSearchParams();

  if (params.slotDate) {
    searchParams.set("slot_date", params.slotDate);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();

  return apiRequest<SevaSlotResponse[]>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}/slots${
      query ? `?${query}` : ""
    }`,
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
  data: SevaSlotCreate,
): Promise<SevaSlotResponse> {
  return apiRequest<SevaSlotResponse>(
    `/api/v1/sevas/${encodeURIComponent(sevaId)}/slots`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export async function updateSevaSlot(
  slotId: string,
  data: SevaSlotUpdate,
): Promise<SevaSlotResponse> {
  return apiRequest<SevaSlotResponse>(
    `/api/v1/sevas/slots/${encodeURIComponent(slotId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export async function updateSevaSlotStatus(
  slotId: string,
  data: SevaSlotStatusUpdate,
): Promise<SevaSlotResponse> {
  return apiRequest<SevaSlotResponse>(
    `/api/v1/sevas/slots/${encodeURIComponent(slotId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}
