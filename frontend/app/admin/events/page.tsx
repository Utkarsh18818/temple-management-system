"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  useCreateEvent,
  useEvent,
  useEvents,
  useUpdateEvent,
  useUpdateEventStatus,
} from "@/features/events/hooks";

import type {
  EventCreate,
  EventResponse,
  EventUpdate,
} from "@/features/events/api";

import { useAuth } from "@/lib/auth/auth-context";
import {
  apiRequest,
  getAccessToken,
} from "@/lib/api/client";

type Festival = {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  if (!value) {
    return "—";
  }

  return value.slice(0, 5);
}

function shortId(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return `${value.slice(0, 8)}…`;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading events…
      </div>
    </div>
  );
}

function EventForm({
  event,
  festivals,
  templeId,
  onClose,
}: {
  event: EventResponse | null;
  festivals: Festival[];
  templeId: string;
  onClose: () => void;
}) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const editing = Boolean(event);
  const mutationPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const [festivalId, setFestivalId] =
    useState(event?.festival_id ?? "");

  const [name, setName] =
    useState(event?.name ?? "");

  const [code, setCode] =
    useState(event?.code ?? "");

  const [description, setDescription] =
    useState(event?.description ?? "");

  const [eventDate, setEventDate] =
    useState(event?.event_date ?? "");

  const [startTime, setStartTime] =
    useState(
      event?.start_time
        ? event.start_time.slice(0, 5)
        : "",
    );

  const [endTime, setEndTime] =
    useState(
      event?.end_time
        ? event.end_time.slice(0, 5)
        : "",
    );

  const [location, setLocation] =
    useState(event?.location ?? "");

  const [organizer, setOrganizer] =
    useState(event?.organizer ?? "");

  const [maxCapacity, setMaxCapacity] =
    useState(
      event?.max_capacity !== null &&
      event?.max_capacity !== undefined
        ? String(event.max_capacity)
        : "",
    );

  const [isOnline, setIsOnline] =
    useState(event?.is_online ?? false);

  const [isActive, setIsActive] =
    useState(event?.is_active ?? true);

  const [error, setError] =
    useState("");

  const handleSubmit =
    async () => {
      setError("");

      if (!name.trim()) {
        setError("Event name is required.");
        return;
      }

      if (!code.trim()) {
        setError("Event code is required.");
        return;
      }

      if (!eventDate) {
        setError("Event date is required.");
        return;
      }

      if (!startTime) {
        setError("Start time is required.");
        return;
      }

      if (
        endTime &&
        endTime <= startTime
      ) {
        setError(
          "End time must be later than start time.",
        );
        return;
      }

      const capacity =
        maxCapacity.trim()
          ? Number(maxCapacity)
          : null;

      if (
        capacity !== null &&
        (!Number.isInteger(capacity) ||
          capacity <= 0)
      ) {
        setError(
          "Maximum capacity must be a positive whole number.",
        );
        return;
      }

      if (!editing) {
        const payload: EventCreate = {
          festival_id:
            festivalId || null,
          name: name.trim(),
          code: code.trim(),
          description:
            description.trim() || null,
          event_date: eventDate,
          start_time: startTime,
          end_time:
            endTime || null,
          location:
            location.trim() || null,
          organizer:
            organizer.trim() || null,
          max_capacity: capacity,
          is_online: isOnline,
          is_active: isActive,
        };

        try {
          await createMutation.mutateAsync({
            templeId,
            data: payload,
          });

          onClose();
        } catch (mutationError) {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : "Unable to create the event.",
          );
        }

        return;
      }

      const payload: EventUpdate = {
        festival_id:
          festivalId || null,
        name: name.trim(),
        code: code.trim(),
        description:
          description.trim() || null,
        event_date: eventDate,
        start_time: startTime,
        end_time:
          endTime || null,
        location:
          location.trim() || null,
        organizer:
          organizer.trim() || null,
        max_capacity: capacity,
        is_online: isOnline,
        is_active: isActive,
      };

      if (!event) {
        setError("Unable to update the event because the event was not found.");
        return;
      }

      try {
        await updateMutation.mutateAsync({
          eventId: event.id,
          data: payload,
        });

        onClose();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to update the event.",
        );
      }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="my-4 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {editing
                ? "Edit Event"
                : "Create Event"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editing
                ? "Update the event details."
                : "Create a new temple event."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={mutationPending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Event Name *
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={150}
                placeholder="e.g. Maha Aarti"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Event Code *
              </label>

              <input
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                maxLength={50}
                placeholder="MAHA-AARTI-001"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Festival
              </label>

              <select
                value={festivalId}
                onChange={(event) =>
                  setFestivalId(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">
                  No festival
                </option>

                {festivals
                  .filter(
                    (festival) =>
                      festival.is_active ||
                      festival.id ===
                        festivalId,
                  )
                  .map((festival) => (
                    <option
                      key={festival.id}
                      value={festival.id}
                    >
                      {festival.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Event Date *
              </label>

              <input
                type="date"
                value={eventDate}
                onChange={(event) =>
                  setEventDate(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Time *
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  End Time
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                maxLength={200}
                placeholder="Temple hall"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Organizer
              </label>

              <input
                value={organizer}
                onChange={(event) =>
                  setOrganizer(
                    event.target.value,
                  )
                }
                maxLength={150}
                placeholder="Temple administration"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Maximum Capacity
              </label>

              <input
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(event) =>
                  setMaxCapacity(
                    event.target.value,
                  )
                }
                placeholder="Optional"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Describe the event…"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Online Event
                    </p>

                    <p className="text-xs text-slate-500">
                      Event is hosted online
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(event) =>
                    setIsOnline(
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400" />
                  )}

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Active
                    </p>

                    <p className="text-xs text-slate-500">
                      Event is visible and active
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4"
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />

                <p className="text-sm text-red-800">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={mutationPending}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutationPending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutationPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {editing
                ? "Save Changes"
                : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [mounted, setMounted] =
    useState(false);

  const [temples, setTemples] =
    useState<
      Array<{
        id: string;
        name: string;
      }>
    >([]);

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [festivals, setFestivals] =
    useState<Festival[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [onlineFilter, setOnlineFilter] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [editingEventId, setEditingEventId] =
    useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasToken =
    mounted &&
    Boolean(getAccessToken());

  const templeId =
    user?.temple_id ??
    (selectedTempleId || undefined);

  useEffect(() => {
    if (
      !mounted ||
      !hasToken ||
      user?.temple_id
    ) {
      return;
    }

    apiRequest<
      Array<{
        id: string;
        name: string;
      }>
    >("/api/v1/temples")
      .then((data) => {
        setTemples(data);

        if (
          data.length > 0 &&
          !selectedTempleId
        ) {
          setSelectedTempleId(
            data[0].id,
          );
        }
      })
      .catch(() => {
        setTemples([]);
      });
  }, [
    mounted,
    hasToken,
    user?.temple_id,
    selectedTempleId,
  ]);

  useEffect(() => {
    if (
      !mounted ||
      !hasToken ||
      !templeId
    ) {
      return;
    }

    const params = new URLSearchParams({
      temple_id: templeId,
      limit: "100",
      offset: "0",
    });

    apiRequest<Festival[]>(
      `/api/v1/festivals?${params.toString()}`,
    )
      .then(setFestivals)
      .catch(() => setFestivals([]));
  }, [
    mounted,
    hasToken,
    templeId,
  ]);

  const {
    data: events = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useEvents(
    {
      templeId,
      search:
        search.trim() || undefined,
      isActive:
        statusFilter === ""
          ? undefined
          : statusFilter === "ACTIVE",
      isOnline:
        onlineFilter === ""
          ? undefined
          : onlineFilter === "ONLINE",
      limit: 100,
      offset: 0,
    },
    hasToken &&
      !authLoading &&
      Boolean(templeId),
  );

  const selectedEventQuery =
    useEvent(
      selectedEventId ?? undefined,
      hasToken,
    );

  const editingEventQuery =
    useEvent(
      editingEventId ?? undefined,
      hasToken,
    );

  const updateStatusMutation =
    useUpdateEventStatus();

  const selectedEvent =
    selectedEventQuery.data ??
    events.find(
      (event) =>
        event.id ===
        selectedEventId,
    ) ??
    null;

  const editingEvent =
    editingEventQuery.data ??
    events.find(
      (event) =>
        event.id ===
        editingEventId,
    ) ??
    null;

  const stats = useMemo(() => {
    const today =
      new Date().toISOString().slice(0, 10);

    const active =
      events.filter(
        (event) => event.is_active,
      ).length;

    const online =
      events.filter(
        (event) => event.is_online,
      ).length;

    const todayCount =
      events.filter(
        (event) =>
          event.event_date === today,
      ).length;

    return {
      total: events.length,
      active,
      online,
      today: todayCount,
    };
  }, [events]);

  const handleStatusChange =
    async (
      event: EventResponse,
    ) => {
      setActionError("");

      try {
        await updateStatusMutation.mutateAsync(
          {
            eventId: event.id,
            data: {
              is_active:
                !event.is_active,
            },
          },
        );
      } catch (mutationError) {
        setActionError(
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to update event status.",
        );
      }
    };

  if (!mounted || authLoading) {
    return <PageLoading />;
  }

  if (!hasToken || !user) {
    return (
      <main className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Authentication required
              </h2>

              <p className="mt-1 text-sm text-amber-800">
                Please sign in to access events.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Temple Operations
              <span>/</span>
              Events
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Events
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Plan and manage temple events, programs and activities.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingEventId(null);
                setActionError("");
                setShowCreate(true);
              }}
              disabled={!templeId}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Temple Context */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Temple Context
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {templeId
                  ? "Events are scoped to the selected temple."
                  : "Select a temple to manage events."}
              </p>
            </div>

            {!user.temple_id &&
              temples.length > 0 && (
                <div className="relative w-full sm:max-w-xs">
                  <select
                    value={
                      selectedTempleId
                    }
                    onChange={(event) =>
                      setSelectedTempleId(
                        event.target.value,
                      )
                    }
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    {temples.map(
                      (temple) => (
                        <option
                          key={temple.id}
                          value={temple.id}
                        >
                          {temple.name}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              )}
          </div>
        </div>

        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm text-red-800">
                {actionError}
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load events
                </h2>

                <p className="mt-1 text-sm text-red-800">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong while loading events."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={String(stats.total)}
            description="Events in current view"
            icon={CalendarDays}
          />

          <StatCard
            title="Active Events"
            value={String(stats.active)}
            description="Currently active"
            icon={CheckCircle2}
          />

          <StatCard
            title="Online Events"
            value={String(stats.online)}
            description="Online programs"
            icon={Globe2}
          />

          <StatCard
            title="Today"
            value={String(stats.today)}
            description="Events scheduled today"
            icon={Clock3}
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search event name, code or details…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none"
              >
                <option value="">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={onlineFilter}
                onChange={(event) =>
                  setOnlineFilter(
                    event.target.value,
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none"
              >
                <option value="">
                  All event types
                </option>

                <option value="ONLINE">
                  Online
                </option>

                <option value="OFFLINE">
                  Offline
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Events */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />

            <p className="mt-3 text-sm text-slate-500">
              Loading events…
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No events found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first event or adjust the filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingEventId(null);
                setShowCreate(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Event
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date & Time
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Capacity
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEventId(
                              event.id,
                            )
                          }
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900 hover:underline">
                            {event.name}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                              {event.code}
                            </span>

                            <span className="font-mono text-xs text-slate-400">
                              {shortId(
                                event.id,
                              )}
                            </span>
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {formatDate(
                                event.event_date,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatTime(
                                event.start_time,
                              )}
                              {event.end_time
                                ? ` – ${formatTime(
                                    event.end_time,
                                  )}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {event.is_online ? (
                            <Globe2 className="h-4 w-4 text-slate-400" />
                          ) : (
                            <MapPin className="h-4 w-4 text-slate-400" />
                          )}

                          <span>
                            {event.is_online
                              ? "Online"
                              : event.location ||
                                "Location not set"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" />

                          {event.max_capacity ??
                            "Unlimited"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              event,
                            )
                          }
                          disabled={
                            updateStatusMutation.isPending
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            event.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {event.is_active
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEventId(
                                event.id,
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="View"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventId(
                                event.id,
                              );
                              setActionError("");
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create */}
        {showCreate && templeId && (
          <EventForm
            event={null}
            festivals={festivals}
            templeId={templeId}
            onClose={() =>
              setShowCreate(false)
            }
          />
        )}

        {/* Edit */}
        {editingEventId &&
          templeId &&
          (editingEvent ? (
            <EventForm
              event={editingEvent}
              festivals={festivals}
              templeId={templeId}
              onClose={() =>
                setEditingEventId(null)
              }
            />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50">
              <div className="rounded-2xl bg-white p-8 shadow-2xl">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading event…
                </p>
              </div>
            </div>
          ))}

        {/* Details Drawer */}
        {selectedEventId && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
            <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Event Details
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {selectedEvent?.name ??
                      "Event"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEventId(
                      null,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedEventQuery.isLoading &&
              !selectedEvent ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : selectedEvent ? (
                <div className="space-y-5 p-6">
                  <div className="rounded-2xl bg-slate-950 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                          Event Code
                        </p>

                        <p className="mt-2 font-mono text-lg font-semibold">
                          {selectedEvent.code}
                        </p>
                      </div>

                      {selectedEvent.is_active ? (
                        <CheckCircle2 className="h-7 w-7 text-slate-400" />
                      ) : (
                        <XCircle className="h-7 w-7 text-slate-500" />
                      )}
                    </div>

                    <div className="mt-7">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Date
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {formatDate(
                          selectedEvent.event_date,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatTime(
                          selectedEvent.start_time,
                        )}
                        {selectedEvent.end_time
                          ? ` – ${formatTime(
                              selectedEvent.end_time,
                            )}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedEvent.is_active
                          ? "Active"
                          : "Inactive"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Event Type
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedEvent.is_online
                          ? "Online"
                          : "In-person"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Capacity
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedEvent.max_capacity ??
                          "Unlimited"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Festival
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {festivals.find(
                          (festival) =>
                            festival.id ===
                            selectedEvent.festival_id,
                        )?.name ??
                          "None"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Event Information
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Location
                        </span>

                        <span className="text-right text-sm font-medium text-slate-800">
                          {selectedEvent.is_online
                            ? "Online"
                            : selectedEvent.location ??
                              "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Organizer
                        </span>

                        <span className="text-right text-sm font-medium text-slate-800">
                          {selectedEvent.organizer ??
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Event ID
                        </span>

                        <span className="max-w-[260px] truncate font-mono text-xs text-slate-700">
                          {selectedEvent.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />

                        <h3 className="text-sm font-semibold text-slate-900">
                          Description
                        </h3>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {
                          selectedEvent.description
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventId(
                          null,
                        );
                        setEditingEventId(
                          selectedEvent.id,
                        );
                      }}
                      className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Edit Event
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          selectedEvent,
                        )
                      }
                      disabled={
                        updateStatusMutation.isPending
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {selectedEvent.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      Unable to load this event.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

