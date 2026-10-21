"use client";
import { useAdminTemple } from "@/components/admin/AdminWorkspace";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAccessToken } from "@/lib/api/client";
import { useTemples } from "@/features/temples/hooks";
import { useSevas } from "@/features/sevas/hooks";
import type { SevaResponse } from "@/features/sevas/api";
import {
  useCreateSevaSlot,
  useSevaSlots,
  useUpdateSevaSlot,
  useUpdateSevaSlotStatus,
} from "@/features/seva-slots/hooks";
import type {
  SevaSlotResponse,
  SevaSlotUpdate,
} from "@/features/seva-slots/api";

type SlotFormState = {
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: string;
};

const EMPTY_FORM: SlotFormState = {
  slot_date: "",
  start_time: "",
  end_time: "",
  capacity: "1",
};

const SLOT_STATUSES = [
  "AVAILABLE",
  "FULL",
  "CANCELLED",
  "COMPLETED",
];

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minuteText ?? "00"} ${suffix}`;
}

function getStatusClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-[#e4f3ed] text-[#287c72]";
    case "FULL":
      return "bg-[#fff2d9] text-[#9a6a18]";
    case "CANCELLED":
      return "bg-[#fde9e8] text-[#a13d3a]";
    case "COMPLETED":
      return "bg-[#e9eef8] text-[#48618b]";
    default:
      return "bg-[var(--ivory)] text-[var(--muted-foreground)]";
  }
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

function PageLoading() {
  return (
    <main className="min-h-screen bg-[var(--ivory)] p-6">
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <Loader2
            size={20}
            className="animate-spin text-[var(--krishna-blue)]"
          />
          Loading Slot Management...
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-3xl border border-red-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <X size={19} />
        </div>

        <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
          {title}
        </h2>

        <p className="mt-2 break-words text-sm leading-6 text-[var(--muted-foreground)]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </section>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--antique-gold)]">
        <CalendarDays size={24} />
      </div>

      <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function SlotForm({
  seva,
  editingSlot,
  onClose,
}: {
  seva: SevaResponse;
  editingSlot: SevaSlotResponse | null;
  onClose: () => void;
}) {
  const [form, setForm] =
    useState<SlotFormState>(() => {
      if (!editingSlot) {
        return {
          ...EMPTY_FORM,
        };
      }

      return {
        slot_date:
          editingSlot.slot_date.slice(0, 10),
        start_time:
          editingSlot.start_time.slice(0, 5),
        end_time:
          editingSlot.end_time
            ? editingSlot.end_time.slice(0, 5)
            : "",
        capacity:
          String(editingSlot.capacity),
      };
    });

  const [error, setError] = useState("");

  const createMutation =
    useCreateSevaSlot();

  const updateMutation =
    useUpdateSevaSlot();

  const isEditing =
    editingSlot !== null;

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  function updateField<K extends keyof SlotFormState>(
    field: K,
    value: SlotFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validate() {
    if (!form.slot_date) {
      return "Slot date is required.";
    }

    if (!form.start_time) {
      return "Start time is required.";
    }

    if (
      form.end_time &&
      form.end_time <= form.start_time
    ) {
      return "End time must be later than start time.";
    }

    const capacity = Number(
      form.capacity,
    );

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      return "Capacity must be a positive whole number.";
    }

    if (
      seva.max_bookings !== null &&
      seva.max_bookings !== undefined &&
      capacity > seva.max_bookings
    ) {
      return `Capacity cannot exceed this seva's maximum of ${seva.max_bookings}.`;
    }

    return "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    const data = {
      slot_date: form.slot_date,
      start_time: `${form.start_time}:00`,
      end_time: form.end_time
        ? `${form.end_time}:00`
        : null,
      capacity: Number(form.capacity),
    };

    try {
      if (editingSlot) {
        await updateMutation.mutateAsync({
          slotId: editingSlot.id,
          data: data as SevaSlotUpdate,
        });
      } else {
        await createMutation.mutateAsync({
          sevaId: seva.id,
          data,
        });
      }

      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save the slot.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--antique-gold)]">
              {seva.name}
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              {isEditing
                ? "Edit Slot"
                : "Create Slot"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-[var(--muted-foreground)] hover:bg-[var(--ivory)] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
                Date
              </label>

              <input aria-label="Slot date"
                type="date"
                value={form.slot_date}
                onChange={(event) =>
                  updateField(
                    "slot_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
                Capacity
              </label>

              <input aria-label="Capacity"
                type="number"
                min="1"
                step="1"
                value={form.capacity}
                onChange={(event) =>
                  updateField(
                    "capacity",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
                Start time
              </label>

              <input aria-label="Start time"
                type="time"
                value={form.start_time}
                onChange={(event) =>
                  updateField(
                    "start_time",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
                End time
              </label>

              <input aria-label="End time"
                type="time"
                value={form.end_time}
                onChange={(event) =>
                  updateField(
                    "end_time",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[var(--ivory)] px-4 py-3 text-xs leading-5 text-[var(--muted-foreground)]">
            {seva.max_bookings !== null &&
            seva.max_bookings !== undefined
              ? `This seva allows a maximum of ${seva.max_bookings} booking(s) per slot.`
              : "No seva-level maximum booking limit is configured."}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--earth-brown-deep)] hover:bg-[var(--ivory)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Check size={16} />
              )}

              {isEditing
                ? "Save changes"
                : "Create slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  onEdit,
  onStatusChange,
  updating,
}: {
  slot: SevaSlotResponse;
  onEdit: (slot: SevaSlotResponse) => void;
  onStatusChange: (
    slot: SevaSlotResponse,
    status: string,
  ) => void;
  updating: boolean;
}) {
  const remaining = Math.max(
    0,
    slot.capacity - slot.booked_count,
  );

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_30px_rgba(89,72,61,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--earth-brown-deep)]">
            <CalendarDays size={16} />
            {formatDate(slot.slot_date)}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Clock3 size={16} />

            {formatTime(slot.start_time)}

            {slot.end_time
              ? ` – ${formatTime(slot.end_time)}`
              : ""}
          </div>
        </div>

        <StatusBadge status={slot.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Capacity
          </p>

          <p className="mt-1 text-lg font-semibold text-[var(--earth-brown-deep)]">
            {slot.capacity}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Booked
          </p>

          <p className="mt-1 text-lg font-semibold text-[var(--earth-brown-deep)]">
            {slot.booked_count}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Remaining
          </p>

          <p className="mt-1 text-lg font-semibold text-[var(--peacock-green)]">
            {remaining}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row">
        <button
          type="button"
          onClick={() => onEdit(slot)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--krishna-blue)] hover:bg-[var(--ivory)]"
        >
          <Edit3 size={15} />
          Edit
        </button>

        <select aria-label="Status"
          value={slot.status}
          disabled={updating}
          onChange={(event) =>
            onStatusChange(
              slot,
              event.target.value,
            )
          }
          className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)] disabled:opacity-50"
        >
          {SLOT_STATUSES.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ),
          )}
        </select>
      </div>
    </article>
  );
}

export default function SlotsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [selectedTempleId, setSelectedTempleId] = useAdminTemple();

  const [selectedSevaId, setSelectedSevaId] =
    useState("");

  const [slotDate, setSlotDate] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingSlot, setEditingSlot] =
    useState<SevaSlotResponse | null>(
      null,
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasToken =
    mounted &&
    Boolean(getAccessToken());

  const templesQuery =
    useTemples(hasToken);

  const activeTemples = useMemo(
    () =>
      (templesQuery.data ?? []).filter(
        (temple) => temple.is_active,
      ),
    [templesQuery.data],
  );

  const effectiveTempleId =
    selectedTempleId ||
    activeTemples[0]?.id ||
    "";

  const sevasQuery = useSevas(
    {
      templeId:
        effectiveTempleId || undefined,
      isActive: true,
      limit: 100,
      offset: 0,
    },
    hasToken &&
      Boolean(effectiveTempleId),
  );

  const activeSevas =
    sevasQuery.data ?? [];

  const effectiveSevaId =
    activeSevas.some(
      (seva) =>
        seva.id === selectedSevaId,
    )
      ? selectedSevaId
      : activeSevas[0]?.id || "";

  const slotsQuery =
    useSevaSlots(
      effectiveSevaId,
      {
        slotDate:
          slotDate || undefined,
        status:
          statusFilter || undefined,
      },
      hasToken &&
        Boolean(effectiveSevaId),
    );

  const statusMutation =
    useUpdateSevaSlotStatus();

  const selectedSeva =
    activeSevas.find(
      (seva) =>
        seva.id === effectiveSevaId,
    ) ?? null;

  function openCreate() {
    setEditingSlot(null);
    setShowForm(true);
  }

  function openEdit(
    slot: SevaSlotResponse,
  ) {
    setEditingSlot(slot);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSlot(null);
  }

  async function handleStatusChange(
    slot: SevaSlotResponse,
    nextStatus: string,
  ) {
    if (
      nextStatus === slot.status
    ) {
      return;
    }

    try {
      await statusMutation.mutateAsync({
        slotId: slot.id,
        data: {
          status: nextStatus,
        },
      });
    } catch {
      // React Query retains the mutation error.
    }
  }

  if (!mounted) {
    return <PageLoading />;
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--border)] bg-white p-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please sign in to manage seva slots.
          </p>
        </div>
      </main>
    );
  }

  if (templesQuery.isLoading) {
    return <PageLoading />;
  }

  if (templesQuery.isError) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-5xl">
          <ErrorState
            title="Unable to load temples"
            message={
              templesQuery.error instanceof Error
                ? templesQuery.error.message
                : "The temple list could not be loaded."
            }
            onRetry={() =>
              void templesQuery.refetch()
            }
          />
        </div>
      </main>
    );
  }

  if (
    activeTemples.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl">
          <EmptyState
            title="No active temples"
            message="Create or activate a temple before configuring seva slots."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-devanagari text-sm tracking-[0.18em] text-[var(--antique-gold)]">
              स्लॉट प्रबंधन
            </p>

            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-[var(--earth-brown-deep)]">
              Seva Slots
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Manage scheduled seva slots,
              capacity, availability and
              booking limits.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={!selectedSeva}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--krishna-blue-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Slot
          </button>
        </header>

        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Temple
              </label>

              <div className="relative">
                <select aria-label="Effective Temple Id"
                  value={
                    effectiveTempleId
                  }
                  onChange={(event) => {
                    setSelectedTempleId(
                      event.target.value,
                    );
                    setSelectedSevaId(
                      "",
                    );
                  }}
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 pr-10 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
                >
                  {activeTemples.map(
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

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Seva
              </label>

              <div className="relative">
                <select aria-label="Effective Seva Id"
                  value={
                    effectiveSevaId
                  }
                  onChange={(event) =>
                    setSelectedSevaId(
                      event.target.value,
                    )
                  }
                  disabled={
                    sevasQuery.isLoading
                  }
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 pr-10 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)] disabled:opacity-60"
                >
                  {activeSevas.length ===
                  0 ? (
                    <option value="">
                      No active sevas
                    </option>
                  ) : (
                    activeSevas.map(
                      (seva) => (
                        <option
                          key={seva.id}
                          value={seva.id}
                        >
                          {seva.name}
                        </option>
                      ),
                    )
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Date
              </label>

              <input aria-label="Slot Date"
                type="date"
                value={slotDate}
                onChange={(event) =>
                  setSlotDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Status
              </label>

              <select aria-label="Status Filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              >
                <option value="">
                  All statuses
                </option>

                {SLOT_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </section>

        {sevasQuery.isError ? (
          <ErrorState
            title="Unable to load sevas"
            message={
              sevasQuery.error instanceof Error
                ? sevasQuery.error.message
                : "The seva list could not be loaded."
            }
            onRetry={() =>
              void sevasQuery.refetch()
            }
          />
        ) : !selectedSeva ? (
          <EmptyState
            title="No active sevas"
            message="Create an active seva first, then configure its scheduled slots."
          />
        ) : slotsQuery.isLoading ? (
          <PageLoading />
        ) : slotsQuery.isError ? (
          <ErrorState
            title="Unable to load slots"
            message={
              slotsQuery.error instanceof Error
                ? slotsQuery.error.message
                : "The slot list could not be loaded."
            }
            onRetry={() =>
              void slotsQuery.refetch()
            }
          />
        ) : slotsQuery.data?.length ===
          0 ? (
          <EmptyState
            title="No slots found"
            message={`No slots match the selected filters for ${selectedSeva.name}.`}
            actionLabel="Create first slot"
            onAction={openCreate}
          />
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Selected Seva
                </p>

                <p className="mt-2 truncate font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
                  {selectedSeva.name}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Slots
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--krishna-blue)]">
                  {slotsQuery.data?.length ??
                    0}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Total Capacity
                </p>

                <p className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold text-[var(--peacock-green)]">
                  <Users size={22} />

                  {slotsQuery.data?.reduce(
                    (sum, slot) =>
                      sum + slot.capacity,
                    0,
                  ) ?? 0}
                </p>
              </div>
            </section>

            <section className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Showing{" "}
                <span className="font-semibold text-[var(--earth-brown-deep)]">
                  {slotsQuery.data?.length ??
                    0}
                </span>{" "}
                slot(s)
              </p>

              <button
                type="button"
                onClick={() =>
                  void slotsQuery.refetch()
                }
                disabled={
                  slotsQuery.isFetching
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--earth-brown-deep)] hover:bg-[var(--ivory)] disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    slotsQuery.isFetching
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(slotsQuery.data ?? []).map(
                (slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onEdit={openEdit}
                    onStatusChange={
                      handleStatusChange
                    }
                    updating={
                      statusMutation.isPending &&
                      statusMutation.variables
                        ?.slotId ===
                        slot.id
                    }
                  />
                ),
              )}
            </section>
          </>
        )}
      </div>

      {showForm &&
        selectedSeva && (
          <SlotForm
            key={
              editingSlot?.id ??
              "new"
            }
            seva={selectedSeva}
            editingSlot={editingSlot}
            onClose={closeForm}
          />
        )}
    </main>
  );
}
