import type { components } from "@/types/api";

import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type EventResponse =
  components["schemas"]["EventResponse"];

export type EventCreate =
  components["schemas"]["EventCreate"];

export type EventUpdate =
  components["schemas"]["EventUpdate"];

export type EventStatusUpdate =
  components["schemas"]["EventStatusUpdate"];

export type Event =
  EventResponse;

export type GetEventsParams = {
  templeId?: string;
  festivalId?: string;
  search?: string;
  eventDate?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isOnline?: boolean;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetEventsParams,
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.festivalId) {
    searchParams.set(
      "festival_id",
      params.festivalId,
    );
  }

  if (params.search) {
    searchParams.set(
      "search",
      params.search,
    );
  }

  if (params.eventDate) {
    searchParams.set(
      "event_date",
      params.eventDate,
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

  if (params.isOnline !== undefined) {
    searchParams.set(
      "is_online",
      String(params.isOnline),
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

export async function getEvents(
  params: GetEventsParams = {},
): Promise<EventResponse[]> {
  const query =
    buildQuery(params);

  const queryString =
    query ? `?${query}` : "";

  return apiRequest<EventResponse[]>(
    `/api/v1/events${queryString}`,
  );
}

export async function getEvent(
  eventId: string,
): Promise<EventResponse> {
  return apiRequest<EventResponse>(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
  );
}

export async function createEvent(
  templeId: string,
  payload: EventCreate,
): Promise<EventResponse> {
  return apiJson<EventResponse>(
    `/api/v1/events?temple_id=${encodeURIComponent(templeId)}`,
    "POST",
    payload,
  );
}

export async function updateEvent(
  eventId: string,
  payload: EventUpdate,
): Promise<EventResponse> {
  return apiJson<EventResponse>(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
    "PUT",
    payload,
  );
}

export async function updateEventStatus(
  eventId: string,
  isActive: boolean,
): Promise<EventResponse> {
  return apiJson<EventResponse>(
    `/api/v1/events/${encodeURIComponent(eventId)}/status`,
    "PATCH",
    {
      is_active: isActive,
    },
  );
}
