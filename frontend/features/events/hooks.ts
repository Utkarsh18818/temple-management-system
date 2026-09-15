"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createEvent,
  getEvent,
  getEvents,
  updateEvent,
  updateEventStatus,
  type EventCreate,
  type EventUpdate,
  type GetEventsParams,
} from "@/features/events/api";

export const eventsQueryKey = [
  "events",
];

export function useEvents(
  params: GetEventsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...eventsQueryKey,
      params,
    ],
    queryFn: () =>
      getEvents(params),
    enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useEvent(
  eventId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "event",
      eventId,
    ],
    queryFn: () =>
      getEvent(
        eventId as string,
      ),
    enabled:
      Boolean(eventId) &&
      enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateEvent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: EventCreate;
    }) =>
      createEvent(
        templeId,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          eventsQueryKey,
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: EventUpdate;
    }) =>
      updateEvent(
        eventId,
        data,
      ),

    onSuccess: (event) => {
      queryClient.invalidateQueries({
        queryKey:
          eventsQueryKey,
      });

      queryClient.setQueryData(
        [
          "event",
          event.id,
        ],
        event,
      );
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      isActive,
      data,
    }: {
      eventId: string;
      isActive?: boolean;
      data?: {
        is_active: boolean;
      };
    }) =>
      updateEventStatus(
        eventId,
        isActive ??
          data?.is_active ??
          false,
      ),

    onSuccess: (event) => {
      queryClient.invalidateQueries({
        queryKey:
          eventsQueryKey,
      });

      queryClient.setQueryData(
        [
          "event",
          event.id,
        ],
        event,
      );
    },
  });
}
