"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Eye,
  Flower2,
  Loader2,
  MapPin,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { apiRequest } from "@/lib/api/client";
import {
  useCreateFestival,
  useFestivals,
  useUpdateFestival,
  useUpdateFestivalStatus,
} from "@/features/festivals/hooks";
import type {
  FestivalCreate,
  FestivalResponse,
  FestivalUpdate,
} from "@/features/festivals/api";

type Temple = {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
};

function PageLoading() {
  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-[var(--krishna-blue)]"
          />

          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Loading festivals…
          </p>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const [year, month, day] =
    value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function isOngoing(
  festival: FestivalResponse,
) {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    festival.is_active &&
    festival.start_date <= today &&
    festival.end_date >= today
  );
}

function isUpcoming(
  festival: FestivalResponse,
) {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    festival.is_active &&
    festival.start_date > today
  );
}

function FestivalForm({
  festival,
  templeId,
  onClose,
}: {
  festival: FestivalResponse | null;
  templeId: string;
  onClose: () => void;
}) {
  const createMutation =
    useCreateFestival();

  const updateMutation =
    useUpdateFestival();

  const [name, setName] =
    useState(festival?.name ?? "");

  const [code, setCode] =
    useState(festival?.code ?? "");

  const [description, setDescription] =
    useState(
      festival?.description ?? "",
    );

  const [startDate, setStartDate] =
    useState(
      festival?.start_date ?? "",
    );

  const [endDate, setEndDate] =
    useState(
      festival?.end_date ?? "",
    );

  const [location, setLocation] =
    useState(
      festival?.location ?? "",
    );

  const [deity, setDeity] =
    useState(
      festival?.deity ?? "",
    );

  const [isActive, setIsActive] =
    useState(
      festival?.is_active ?? true,
    );

  const [error, setError] =
    useState("");

  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError(
        "Festival name is required.",
      );
      return;
    }

    if (!code.trim()) {
      setError(
        "Festival code is required.",
      );
      return;
    }

    if (!startDate || !endDate) {
      setError(
        "Start date and end date are required.",
      );
      return;
    }

    if (endDate < startDate) {
      setError(
        "End date cannot be earlier than start date.",
      );
      return;
    }

    try {
      if (festival) {
        const payload: FestivalUpdate =
          {
            name: name.trim(),
            code: code.trim(),
            description:
              description.trim() ||
              null,
            start_date: startDate,
            end_date: endDate,
            location:
              location.trim() ||
              null,
            deity:
              deity.trim() ||
              null,
            is_active: isActive,
          };

        await updateMutation.mutateAsync(
          {
            festivalId: festival.id,
            data: payload,
          },
        );
      } else {
        const payload: FestivalCreate =
          {
            name: name.trim(),
            code: code.trim(),
            description:
              description.trim() ||
              null,
            start_date: startDate,
            end_date: endDate,
            location:
              location.trim() ||
              null,
            deity:
              deity.trim() ||
              null,
            is_active: isActive,
          };

        await createMutation.mutateAsync(
          {
            templeId,
            data: payload,
          },
        );
      }

      onClose();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save festival.";

      setError(message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="my-4 flex max-h-[90vh] w-full min-w-0 max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Festival Management
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
                {festival
                  ? "Edit Festival"
                  : "Create Festival"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--ivory)] hover:text-[var(--earth-brown-deep)]"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="space-y-5 px-6 py-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                    Festival Name *
                  </label>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    maxLength={150}
                    placeholder="Diwali Mahotsav"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                    Festival Code *
                  </label>

                  <input
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value.toUpperCase(),
                      )
                    }
                    maxLength={50}
                    placeholder="DIWALI-2026"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm uppercase outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                    Deity
                  </label>

                  <input
                    value={deity}
                    onChange={(event) =>
                      setDeity(
                        event.target.value,
                      )
                    }
                    maxLength={150}
                    placeholder="Lord Krishna"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                    Start Date *
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                    End Date *
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
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
                    placeholder="Main Temple Complex"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
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
                    placeholder="Festival details and significance..."
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      !isActive,
                    )
                  }
                  className="sm:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-4 text-left transition hover:border-[var(--krishna-blue)]/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
                      Active Festival
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Active festivals can be associated with temple events.
                    </p>
                  </div>

                  {isActive ? (
                    <ToggleRight
                      size={28}
                      className="shrink-0 text-[var(--peacock-green)]"
                    />
                  ) : (
                    <ToggleLeft
                      size={28}
                      className="shrink-0 text-[var(--muted-foreground)]"
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--border)] bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {festival
                  ? "Save Changes"
                  : "Create Festival"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FestivalDetails({
  festival,
  onClose,
}: {
  festival: FestivalResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[2px]">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border)] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Festival Details
            </p>

            <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
              {festival.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--ivory)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-3xl bg-[var(--ivory)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Festival Code
                </p>

                <p className="mt-2 font-mono text-lg font-semibold text-[var(--earth-brown-deep)]">
                  {festival.code}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  festival.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {festival.is_active
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              Festival Period
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Starts
                </p>

                <p className="mt-1 font-semibold text-[var(--earth-brown-deep)]">
                  {formatDate(
                    festival.start_date,
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Ends
                </p>

                <p className="mt-1 font-semibold text-[var(--earth-brown-deep)]">
                  {formatDate(
                    festival.end_date,
                  )}
                </p>
              </div>
            </div>
          </section>

          {(festival.deity ||
            festival.location) && (
            <section className="space-y-3">
              {festival.deity && (
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
                  <Flower2
                    size={19}
                    className="shrink-0 text-[var(--krishna-blue)]"
                  />

                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Deity
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--earth-brown-deep)]">
                      {festival.deity}
                    </p>
                  </div>
                </div>
              )}

              {festival.location && (
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
                  <MapPin
                    size={19}
                    className="shrink-0 text-[var(--krishna-blue)]"
                  />

                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--earth-brown-deep)]">
                      {festival.location}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {festival.description && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Description
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--earth-brown-deep)]">
                {festival.description}
              </p>
            </section>
          )}

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              Record Information
            </p>

            <div className="mt-3 space-y-3 rounded-2xl border border-[var(--border)] p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Festival ID
                </span>

                <span className="max-w-[65%] break-all text-right font-mono text-xs text-[var(--earth-brown-deep)]">
                  {festival.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Created
                </span>

                <span className="text-xs text-[var(--earth-brown-deep)]">
                  {String(
                    festival.created_at ??
                      "—",
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function FestivalCard({
  festival,
  onEdit,
  onDetails,
  onToggle,
  updating,
}: {
  festival: FestivalResponse;
  onEdit: () => void;
  onDetails: () => void;
  onToggle: () => void;
  updating: boolean;
}) {
  const ongoing =
    isOngoing(festival);

  const upcoming =
    isUpcoming(festival);

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ivory)] px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--earth-brown-deep)]">
              {festival.code}
            </span>

            {ongoing && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                Ongoing
              </span>
            )}

            {!ongoing && upcoming && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                Upcoming
              </span>
            )}

            {!festival.is_active && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                Inactive
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
            {festival.name}
          </h3>

          {festival.deity && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {festival.deity}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--ivory)] p-3">
          <Flower2
            size={21}
            className="text-[var(--krishna-blue)]"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <CalendarDays size={15} />

            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Period
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-[var(--earth-brown-deep)]">
            {formatDate(
              festival.start_date,
            )}
          </p>

          <p className="text-xs text-[var(--muted-foreground)]">
            to {formatDate(
              festival.end_date,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] p-3">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <MapPin size={15} />

            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Location
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-[var(--earth-brown-deep)]">
            {festival.location ||
              "Not specified"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onDetails}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)]"
        >
          <Eye size={15} />
          View
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)]"
        >
          <Edit3 size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={updating}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
        >
          {updating ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : festival.is_active ? (
            <ToggleLeft size={15} />
          ) : (
            <ToggleRight size={15} />
          )}

          {festival.is_active
            ? "Deactivate"
            : "Activate"}
        </button>
      </div>
    </article>
  );
}

export default function FestivalsPage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "active" | "inactive" | "all"
  >("active");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingFestival, setEditingFestival] =
    useState<FestivalResponse | null>(
      null,
    );

  const [detailsFestival, setDetailsFestival] =
    useState<FestivalResponse | null>(
      null,
    );

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [temples, setTemples] =
    useState<Temple[]>([]);

  const [templesLoading, setTemplesLoading] =
    useState(false);

  const statusValue =
    statusFilter === "all"
      ? undefined
      : statusFilter === "active";

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    async function loadTemples() {
      setTemplesLoading(true);

      try {
        const data =
          await apiRequest<Temple[]>(
            "/api/v1/temples?limit=100&offset=0",
          );

        if (!cancelled) {
          setTemples(data);
        }
      } catch {
        if (!cancelled) {
          setTemples([]);
        }
      } finally {
        if (!cancelled) {
          setTemplesLoading(false);
        }
      }
    }

    loadTemples();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const effectiveTempleId =
    user?.temple_id ||
    selectedTempleId ||
    temples.find(
      (temple) => temple.is_active,
    )?.id;

  const festivalsQuery =
    useFestivals(
      {
        templeId:
          effectiveTempleId,
        search:
          search.trim() ||
          undefined,
        startDate:
          startDate ||
          undefined,
        endDate:
          endDate ||
          undefined,
        isActive:
          statusValue,
        limit: 100,
        offset: 0,
      },
      Boolean(user) &&
        Boolean(
          effectiveTempleId,
        ),
    );

  const statusMutation =
    useUpdateFestivalStatus();

  const festivals =
    festivalsQuery.data ?? [];

  const activeCount =
    festivals.filter(
      (festival) =>
        festival.is_active,
    ).length;

  const inactiveCount =
    festivals.length -
    activeCount;

  const ongoingCount =
    festivals.filter(
      (festival) =>
        isOngoing(festival),
    ).length;

  const upcomingCount =
    festivals.filter(
      (festival) =>
        isUpcoming(festival),
    ).length;

  const templeName =
    temples.find(
      (temple) =>
        temple.id ===
        effectiveTempleId,
    )?.name ??
    "Select a temple";

  function openCreate() {
    setEditingFestival(null);
    setShowForm(true);
  }

  function openEdit(
    festival: FestivalResponse,
  ) {
    setEditingFestival(festival);
    setShowForm(true);
  }

  async function toggleStatus(
    festival: FestivalResponse,
  ) {
    setUpdatingId(festival.id);

    try {
      await statusMutation.mutateAsync(
        {
          festivalId:
            festival.id,
          data: {
            is_active:
              !festival.is_active,
          },
        },
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingFestival(null);
  }

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("active");
  }

  if (authLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--border)] bg-white p-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please sign in to manage temple festivals.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--ivory)] p-3">
                  <Flower2
                    size={25}
                    className="text-[var(--krishna-blue)]"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    TempleOS
                  </p>

                  <h1 className="font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                    Festivals
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Manage temple festivals, dates, deities,
                locations and festival-linked events.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {!user.temple_id && (
                <div className="relative">
                  <select
                    value={
                      selectedTempleId
                    }
                    onChange={(event) =>
                      setSelectedTempleId(
                        event.target.value,
                      )
                    }
                    disabled={
                      templesLoading
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-3 pr-9 text-sm font-medium text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)] sm:w-56"
                  >
                    <option value="">
                      {templesLoading
                        ? "Loading temples…"
                        : "Select temple"}
                    </option>

                    {temples
                      .filter(
                        (temple) =>
                          temple.is_active,
                      )
                      .map(
                        (temple) => (
                          <option
                            key={
                              temple.id
                            }
                            value={
                              temple.id
                            }
                          >
                            {temple.name}
                          </option>
                        ),
                      )}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={openCreate}
                disabled={
                  !effectiveTempleId
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />
                New Festival
              </button>
            </div>
          </div>
        </section>

        {!effectiveTempleId ? (
          <section className="rounded-3xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
            <Flower2
              size={38}
              className="mx-auto text-[var(--muted-foreground)]"
            />

            <h2 className="mt-4 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
              Select a temple
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Choose a temple to view and manage its festivals.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Temple
                </p>

                <p className="mt-2 truncate font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
                  {templeName}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Total
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                  {festivals.length}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Active
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--peacock-green)]">
                  {activeCount}
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {inactiveCount} inactive
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Ongoing
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--krishna-blue)]">
                  {ongoingCount}
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Currently running
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Upcoming
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                  {upcomingCount}
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Scheduled ahead
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="festival-search"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    />

                    <input
                      id="festival-search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search festival, code, deity..."
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                    />
                  </div>
                </div>

                <div className="w-full xl:w-44">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | "active"
                          | "inactive"
                          | "all",
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="all">
                      All
                    </option>
                  </select>
                </div>

                <div className="w-full xl:w-44">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    From
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <div className="w-full xl:w-44">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    To
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)]"
                >
                  Clear
                </button>
              </div>
            </section>

            {festivalsQuery.isLoading ? (
              <section className="rounded-2xl border border-[var(--border)] bg-white px-6 py-16 text-center">
                <Loader2
                  size={25}
                  className="mx-auto animate-spin text-[var(--krishna-blue)]"
                />

                <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                  Loading festivals…
                </p>
              </section>
            ) : festivalsQuery.isError ? (
              <section className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center">
                <Clock3
                  size={38}
                  className="mx-auto text-red-400"
                />

                <h3 className="mt-4 font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
                  Unable to load festivals
                </h3>

                <p className="mt-2 text-sm text-red-600">
                  {festivalsQuery.error instanceof
                  Error
                    ? festivalsQuery.error.message
                    : "Please try again."}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    festivalsQuery.refetch()
                  }
                  className="mt-5 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </section>
            ) : festivals.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
                <Flower2
                  size={40}
                  className="mx-auto text-[var(--muted-foreground)]"
                />

                <h3 className="mt-4 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
                  No festivals found
                </h3>

                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Create a festival or adjust your filters.
                </p>

                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Create Festival
                </button>
              </section>
            ) : (
              <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {festivals.map(
                  (festival) => (
                    <FestivalCard
                      key={festival.id}
                      festival={festival}
                      onEdit={() =>
                        openEdit(
                          festival,
                        )
                      }
                      onDetails={() =>
                        setDetailsFestival(
                          festival,
                        )
                      }
                      onToggle={() =>
                        toggleStatus(
                          festival,
                        )
                      }
                      updating={
                        updatingId ===
                        festival.id
                      }
                    />
                  ),
                )}
              </section>
            )}
          </>
        )}
      </div>

      {showForm &&
        effectiveTempleId && (
          <FestivalForm
            festival={
              editingFestival
            }
            templeId={
              effectiveTempleId
            }
            onClose={
              closeForm
            }
          />
        )}

      {detailsFestival && (
        <FestivalDetails
          festival={
            detailsFestival
          }
          onClose={() =>
            setDetailsFestival(
              null,
            )
          }
        />
      )}
    </main>
  );
}


