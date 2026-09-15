"use client";

import {
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@/lib/api/client";

import { useTemples } from "@/features/temples/hooks";
import {
  useCreateSeva,
  useSevas,
  useUpdateSeva,
  useUpdateSevaStatus,
} from "@/features/sevas/hooks";
import type {
  SevaCreate,
  SevaResponse,
  SevaUpdate,
} from "@/features/sevas/api";

type FormState = {
  name: string;
  code: string;
  description: string;
  seva_type: string;
  amount: string;
  duration_minutes: string;
  max_bookings: string;
  requires_slot: boolean;
  is_online: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  description: "",
  seva_type: "GENERAL",
  amount: "0",
  duration_minutes: "",
  max_bookings: "",
  requires_slot: false,
  is_online: true,
};

const SEVA_TYPES = [
  "GENERAL",
  "PUJA",
  "ARCHANA",
  "ABHISHEK",
  "AARTI",
  "DARSHAN",
  "PRASAD",
  "SPECIAL",
];

function formatCurrency(
  value: number | string | null | undefined,
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDuration(
  value: number | null | undefined,
) {
  if (!value) {
    return "—";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return minutes === 0
    ? `${hours} hr`
    : `${hours} hr ${minutes} min`;
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S"
  );
}

function getInitialForm(
  seva?: SevaResponse | null,
): FormState {
  if (!seva) {
    return EMPTY_FORM;
  }

  return {
    name: seva.name,
    code: seva.code,
    description: seva.description ?? "",
    seva_type: seva.seva_type,
    amount: String(seva.amount ?? 0),
    duration_minutes:
      seva.duration_minutes == null
        ? ""
        : String(seva.duration_minutes),
    max_bookings:
      seva.max_bookings == null
        ? ""
        : String(seva.max_bookings),
    requires_slot: seva.requires_slot,
    is_online: seva.is_online,
  };
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-[#e4f3ed] text-[#287c72]"
          : "bg-[#f1ece7] text-[#74685f]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#287c72]"
            : "bg-[#74685f]"
        }`}
      />
      {active ? "Active" : "Inactive"}
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
          Loading Seva Management...
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

function EmptySevas({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--antique-gold)]">
        <Plus size={22} />
      </div>

      <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
        No sevas found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        There are no sevas matching the current filters.
        Create the first seva for this temple.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white"
      >
        <Plus size={16} />
        Add Seva
      </button>
    </section>
  );
}

function EmptyWorkspace() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white px-6 py-16 text-center">
      <h2 className="font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
        Select a temple
      </h2>

      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Select an active temple to manage its sevas.
      </p>
    </section>
  );
}

function TableLoading() {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
      <div className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-[var(--ivory)]"
          />
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  min,
  step,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--radha-rose)]">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none transition focus:border-[var(--krishna-blue)] focus:ring-2 focus:ring-[var(--krishna-blue)]/10"
      />
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-4 text-left transition hover:border-[var(--krishna-blue)]/30"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>

      {checked ? (
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
  );
}

function SevaForm({
  editingSeva,
  templeId,
  onClose,
}: {
  editingSeva: SevaResponse | null;
  templeId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    () => getInitialForm(editingSeva),
  );

  const [error, setError] = useState("");
  const createMutation = useCreateSeva();
  const updateMutation = useUpdateSeva();

  const isEditing = Boolean(editingSeva);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validate() {
    if (form.name.trim().length < 2) {
      return "Seva name must be at least 2 characters.";
    }

    if (form.code.trim().length < 2) {
      return "Seva code must be at least 2 characters.";
    }

    if (!form.seva_type.trim()) {
      return "Seva type is required.";
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return "Enter a valid non-negative amount.";
    }

    if (
      form.duration_minutes &&
      (!Number.isInteger(
        Number(form.duration_minutes),
      ) ||
        Number(form.duration_minutes) < 1)
    ) {
      return "Duration must be a positive whole number.";
    }

    if (
      form.max_bookings &&
      (!Number.isInteger(
        Number(form.max_bookings),
      ) ||
        Number(form.max_bookings) < 1)
    ) {
      return "Maximum bookings must be a positive whole number.";
    }

    return "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    const duration = form.duration_minutes
      ? Number(form.duration_minutes)
      : null;

    const maxBookings = form.max_bookings
      ? Number(form.max_bookings)
      : null;

    try {
      if (editingSeva) {
        const data: SevaUpdate = {
          name: form.name.trim(),
          code: form.code.trim(),
          description:
            form.description.trim() || null,
          seva_type: form.seva_type.trim(),
          amount: Number(form.amount),
          duration_minutes: duration,
          max_bookings: maxBookings,
          requires_slot: form.requires_slot,
          is_online: form.is_online,
        };

        await updateMutation.mutateAsync({
          sevaId: editingSeva.id,
          data,
        });
      } else {
        const data: SevaCreate = {
          name: form.name.trim(),
          code: form.code.trim(),
          description:
            form.description.trim() || null,
          seva_type: form.seva_type.trim(),
          amount: Number(form.amount),
          duration_minutes: duration,
          max_bookings: maxBookings,
          requires_slot: form.requires_slot,
          is_online: form.is_online,
        };

        await createMutation.mutateAsync({
          templeId,
          data,
        });
      }

      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save the seva.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--antique-gold)]">
              Seva Management
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              {isEditing
                ? "Edit Seva"
                : "Create Seva"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Seva name"
              required
              value={form.name}
              onChange={(value) =>
                updateField("name", value)
              }
            />

            <Field
              label="Seva code"
              required
              value={form.code}
              onChange={(value) =>
                updateField("code", value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              rows={4}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none transition focus:border-[var(--krishna-blue)] focus:ring-2 focus:ring-[var(--krishna-blue)]/10"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--earth-brown-deep)]">
                Seva type
              </label>

              <select
                value={form.seva_type}
                onChange={(event) =>
                  updateField(
                    "seva_type",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
              >
                {SEVA_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Amount"
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(value) =>
                updateField("amount", value)
              }
            />

            <Field
              label="Duration (minutes)"
              type="number"
              min="1"
              step="1"
              value={form.duration_minutes}
              onChange={(value) =>
                updateField(
                  "duration_minutes",
                  value,
                )
              }
            />
          </div>

          <Field
            label="Maximum bookings"
            type="number"
            min="1"
            step="1"
            value={form.max_bookings}
            onChange={(value) =>
              updateField(
                "max_bookings",
                value,
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleField
              label="Requires slot"
              description="Visitors must select an available time slot."
              checked={form.requires_slot}
              onChange={(value) =>
                updateField(
                  "requires_slot",
                  value,
                )
              }
            />

            <ToggleField
              label="Available online"
              description="Allow this seva to be offered through online booking."
              checked={form.is_online}
              onChange={(value) =>
                updateField(
                  "is_online",
                  value,
                )
              }
            />
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
              className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--krishna-blue-deep)] disabled:cursor-not-allowed disabled:opacity-60"
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
                : "Create seva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--ivory)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[var(--earth-brown-deep)]">
        {value}
      </p>
    </div>
  );
}

function SevaTableRow({
  seva,
  onEdit,
  onToggle,
  updating,
}: {
  seva: SevaResponse;
  onEdit: (seva: SevaResponse) => void;
  onToggle: (seva: SevaResponse) => void;
  updating: boolean;
}) {
  return (
    <tr className="transition hover:bg-[var(--ivory)]/60">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--krishna-blue)]/8 font-display text-sm font-semibold text-[var(--krishna-blue)]">
            {getInitials(seva.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--earth-brown-deep)]">
              {seva.name}
            </p>

            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {seva.code}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-[var(--earth-brown-deep)]">
        {seva.seva_type}
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-[var(--earth-brown-deep)]">
        {formatCurrency(seva.amount)}
      </td>

      <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">
        {formatDuration(seva.duration_minutes)}
      </td>

      <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">
        {seva.requires_slot
          ? "Slot required"
          : "Flexible"}
      </td>

      <td className="px-5 py-4">
        <StatusBadge active={seva.is_active} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(seva)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--krishna-blue)] transition hover:bg-[var(--ivory)]"
          >
            <Edit3 size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onToggle(seva)}
            disabled={updating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
          >
            {updating ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : seva.is_active ? (
              <ToggleLeft size={15} />
            ) : (
              <ToggleRight size={15} />
            )}

            {seva.is_active
              ? "Deactivate"
              : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function SevaMobileCard({
  seva,
  onEdit,
  onToggle,
  updating,
}: {
  seva: SevaResponse;
  onEdit: (seva: SevaResponse) => void;
  onToggle: (seva: SevaResponse) => void;
  updating: boolean;
}) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--krishna-blue)]/8 font-display text-sm font-semibold text-[var(--krishna-blue)]">
            {getInitials(seva.name)}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--earth-brown-deep)]">
              {seva.name}
            </h3>

            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {seva.code} · {seva.seva_type}
            </p>
          </div>
        </div>

        <StatusBadge active={seva.is_active} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info
          label="Amount"
          value={formatCurrency(seva.amount)}
        />

        <Info
          label="Duration"
          value={formatDuration(
            seva.duration_minutes,
          )}
        />

        <Info
          label="Booking"
          value={
            seva.requires_slot
              ? "Slot required"
              : "Flexible"
          }
        />

        <Info
          label="Online"
          value={seva.is_online ? "Yes" : "No"}
        />
      </div>

      <div className="mt-5 flex gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={() => onEdit(seva)}
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--krishna-blue)] transition hover:bg-[var(--ivory)]"
        >
          <span className="inline-flex items-center gap-2">
            <Edit3 size={15} />
            Edit
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggle(seva)}
          disabled={updating}
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {updating ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : seva.is_active ? (
              <ToggleLeft size={16} />
            ) : (
              <ToggleRight size={16} />
            )}

            {seva.is_active
              ? "Deactivate"
              : "Activate"}
          </span>
        </button>
      </div>
    </article>
  );
}

export default function SevasPage() {
  /*
   * Authentication is intentionally handled directly from the
   * existing browser JWT.
   *
   * We already verified:
   *   sessionStorage token = PRESENT
   *   GET /api/v1/auth/me = 200
   *
   * Therefore Sevas does not depend on AuthContext hydration.
   */

  const [mounted, setMounted] = useState(false);

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"active" | "inactive" | "all">(
      "active",
    );

  const [showForm, setShowForm] =
    useState(false);

  const [editingSeva, setEditingSeva] =
    useState<SevaResponse | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasToken =
    mounted && Boolean(getAccessToken());

  const templesQuery = useTemples(hasToken);

  const activeTemples = useMemo(
    () =>
      (templesQuery.data ?? []).filter(
        (temple) => temple.is_active,
      ),
    [templesQuery.data],
  );

  const effectiveTempleId = useMemo(() => {
    if (selectedTempleId) {
      return selectedTempleId;
    }

    return activeTemples[0]?.id;
  }, [selectedTempleId, activeTemples]);

  const statusValue =
    statusFilter === "all"
      ? undefined
      : statusFilter === "active";

  const sevasQuery = useSevas(
    {
      templeId: effectiveTempleId,
      search:
        search.trim() || undefined,
      sevaType:
        typeFilter || undefined,
      isActive: statusValue,
      limit: 100,
      offset: 0,
    },
    hasToken && Boolean(effectiveTempleId),
  );

  const statusMutation =
    useUpdateSevaStatus();

  const sevas = sevasQuery.data ?? [];

  const activeCount = sevas.filter(
    (seva) => seva.is_active,
  ).length;

  const inactiveCount =
    sevas.length - activeCount;

  const slotBasedCount = sevas.filter(
    (seva) => seva.requires_slot,
  ).length;

  const selectedTemple = activeTemples.find(
    (temple) =>
      temple.id === effectiveTempleId,
  );

  const templeName =
    selectedTemple?.name ??
    "Temple Workspace";

  function openCreate() {
    setEditingSeva(null);
    setShowForm(true);
  }

  function openEdit(
    seva: SevaResponse,
  ) {
    setEditingSeva(seva);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSeva(null);
  }

  async function toggleStatus(
    seva: SevaResponse,
  ) {
    try {
      await statusMutation.mutateAsync({
        sevaId: seva.id,
        data: {
          is_active: !seva.is_active,
        },
      });
    } catch {
      // React Query exposes the mutation error state.
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
            Please sign in to manage temple sevas.
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

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-devanagari text-sm tracking-[0.18em] text-[var(--antique-gold)]">
              सेवा प्रबंधन
            </p>

            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-[var(--earth-brown-deep)]">
              Sevas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Manage pujas, archana, abhishek and
              other temple services from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={!effectiveTempleId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--krishna-blue-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Seva
          </button>
        </header>

        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Temple
              </p>

              <div className="mt-2 relative max-w-xl">
                <select
                  value={effectiveTempleId ?? ""}
                  onChange={(event) =>
                    setSelectedTempleId(
                      event.target.value,
                    )
                  }
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

            <div className="text-sm text-[var(--muted-foreground)]">
              Current workspace:
              <span className="ml-1 font-semibold text-[var(--earth-brown-deep)]">
                {templeName}
              </span>
            </div>
          </div>
        </section>

        {!effectiveTempleId ? (
          <EmptyWorkspace />
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  Total Sevas
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                  {sevas.length}
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
                  Slot Based
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--krishna-blue)]">
                  {slotBasedCount}
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Require scheduled slots
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="seva-search"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    />

                    <input
                      id="seva-search"
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search by name, code or description"
                      className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)] focus:ring-2 focus:ring-[var(--krishna-blue)]/10"
                    />
                  </div>
                </div>

                <div className="w-full xl:w-48">
                  <label
                    htmlFor="seva-type"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                  >
                    Type
                  </label>

                  <select
                    id="seva-type"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
                  >
                    <option value="">
                      All types
                    </option>

                    {SEVA_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="w-full xl:w-48">
                  <label
                    htmlFor="seva-status"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]"
                  >
                    Status
                  </label>

                  <select
                    id="seva-status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target
                          .value as
                          | "active"
                          | "inactive"
                          | "all",
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="all">
                      All statuses
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void sevasQuery.refetch()
                  }
                  disabled={
                    sevasQuery.isFetching
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--earth-brown-deep)] transition hover:bg-[var(--ivory)] disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      sevasQuery.isFetching
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Refresh
                </button>
              </div>
            </section>

            {sevasQuery.isLoading ? (
              <TableLoading />
            ) : sevasQuery.isError ? (
              <ErrorState
                title="Unable to load sevas"
                message={
                  sevasQuery.error instanceof
                  Error
                    ? sevasQuery.error.message
                    : "The seva list could not be loaded."
                }
                onRetry={() =>
                  void sevasQuery.refetch()
                }
              />
            ) : sevas.length === 0 ? (
              <EmptySevas
                onAdd={openCreate}
              />
            ) : (
              <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[0_8px_30px_rgba(89,72,61,0.04)]">
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="border-b border-[var(--border)] bg-[var(--ivory)]">
                      <tr className="text-xs uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        <th className="px-5 py-4 font-semibold">
                          Seva
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Type
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Amount
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Duration
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Booking
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border)]">
                      {sevas.map(
                        (seva) => (
                          <SevaTableRow
                            key={seva.id}
                            seva={seva}
                            onEdit={openEdit}
                            onToggle={(item) =>
                              void toggleStatus(
                                item,
                              )
                            }
                            updating={
                              statusMutation.isPending &&
                              statusMutation.variables
                                ?.sevaId ===
                                seva.id
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[var(--border)] md:hidden">
                  {sevas.map(
                    (seva) => (
                      <SevaMobileCard
                        key={seva.id}
                        seva={seva}
                        onEdit={openEdit}
                        onToggle={(item) =>
                          void toggleStatus(
                            item,
                          )
                        }
                        updating={
                          statusMutation.isPending &&
                          statusMutation.variables
                            ?.sevaId ===
                            seva.id
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showForm && effectiveTempleId && (
        <SevaForm
          key={
            editingSeva?.id ?? "new"
          }
          editingSeva={editingSeva}
          templeId={effectiveTempleId}
          onClose={closeForm}
        />
      )}
    </main>
  );
}
