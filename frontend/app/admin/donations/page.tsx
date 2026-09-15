"use client";

import {
  CalendarDays,
  Check,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAccessToken } from "@/lib/api/client";

import { useTemples } from "@/features/temples/hooks";
import { useDevotees } from "@/features/devotees/hooks";

import {
  useCreateDonation,
  useDonations,
  useUpdateDonation,
} from "@/features/donations/hooks";

import type {
  DonationCreate,
  DonationResponse,
  DonationUpdate,
} from "@/features/donations/api";

function PageLoading() {
  return (
    <main className="min-h-screen bg-[var(--ivory)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/70" />

        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/70" />

        <div className="mt-8 h-24 animate-pulse rounded-2xl bg-white/70" />

        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-white/70" />
      </div>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--krishna-blue)] px-4 py-2 text-sm font-medium text-white"
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

function StatusBadge({
  value,
}: {
  value?: string | null;
}) {
  const status =
    value ?? "UNKNOWN";

  const classes =
    status === "COMPLETED" ||
    status === "SUCCESS" ||
    status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELLED" ||
          status === "FAILED"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${classes}`}
    >
      {status.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getName(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "—";
  }

  const item =
    value as Record<
      string,
      unknown
    >;

  const first =
    typeof item.first_name ===
    "string"
      ? item.first_name
      : "";

  const last =
    typeof item.last_name ===
    "string"
      ? item.last_name
      : "";

  return (
    [first, last]
      .filter(Boolean)
      .join(" ") ||
    (typeof item.name ===
    "string"
      ? item.name
      : "") ||
    "—"
  );
}

function DonationForm({
  templeId,
  onClose,
  onSuccess,
}: {
  templeId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [devoteeId, setDevoteeId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [donationDate, setDonationDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

  const [donationType, setDonationType] =
    useState("GENERAL");

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [notes, setNotes] =
    useState("");

  const devoteesQuery =
    useDevotees(
      {
        templeId,
        limit: 100,
        offset: 0,
      },
      Boolean(templeId),
    );

  const createMutation =
    useCreateDonation();

  const devotees =
    devoteesQuery.data ?? [];

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const numericAmount =
      Number(amount);

    if (
      !devoteeId ||
      !numericAmount ||
      numericAmount <= 0 ||
      !donationDate
    ) {
      return;
    }

    const selectedDevotee =
      devotees.find(
        (devotee) =>
          devotee.id === devoteeId,
      );

    const donorName =
      selectedDevotee
        ? [
            selectedDevotee.first_name,
            selectedDevotee.last_name,
          ]
            .filter(Boolean)
            .join(" ")
        : "";

    if (!donorName) {
      return;
    }

    const payload: DonationCreate = {
      devotee_id: devoteeId,
      amount: numericAmount,
      donation_type:
        donationType,
      donor_name: donorName,
      donated_at:
        donationDate,
      purpose:
        notes.trim() ||
        undefined,
    };

    try {
      await createMutation.mutateAsync(
        {
          templeId,
          data: payload,
        },
      );

      onSuccess();
    } catch {
      // Error displayed below.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--ivory)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <p className="font-devanagari text-xs tracking-[0.22em] text-[var(--radha-rose)]">
              DONATION MANAGEMENT
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              Record Donation
            </h2>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Record a devotee contribution.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--ivory)]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
              Devotee
            </label>

            <div className="relative">
              <UserRound
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />

              <select
                value={devoteeId}
                onChange={(event) =>
                  setDevoteeId(
                    event.target
                      .value,
                  )
                }
                required
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--peacock-green)]"
              >
                <option value="">
                  Select devotee
                </option>

                {devotees.map(
                  (devotee) => (
                    <option
                      key={
                        devotee.id
                      }
                      value={
                        devotee.id
                      }
                    >
                      {getName(
                        devotee,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
                  ₹
                </span>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target
                        .value,
                    )
                  }
                  placeholder="0.00"
                  required
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-9 pr-4 text-sm outline-none focus:border-[var(--peacock-green)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Donation date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />

                <input
                  type="date"
                  value={donationDate}
                  onChange={(event) =>
                    setDonationDate(
                      event.target
                        .value,
                    )
                  }
                  required
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--peacock-green)]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Donation type
              </label>

              <select
                value={donationType}
                onChange={(event) =>
                  setDonationType(
                    event.target
                      .value,
                  )
                }
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
              >
                <option value="GENERAL">
                  General
                </option>
                <option value="ANNADAN">
                  Annadan
                </option>
                <option value="FESTIVAL">
                  Festival
                </option>
                <option value="SEVA">
                  Seva
                </option>
                <option value="CONSTRUCTION">
                  Construction
                </option>
                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Payment method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value,
                  )
                }
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
              >
                <option value="CASH">
                  Cash
                </option>
                <option value="UPI">
                  UPI
                </option>
                <option value="CARD">
                  Card
                </option>
                <option value="BANK_TRANSFER">
                  Bank transfer
                </option>
                <option value="CHEQUE">
                  Cheque
                </option>
                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Optional donation note..."
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--peacock-green)]"
            />
          </div>

          {createMutation.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {createMutation.error instanceof
              Error
                ? createMutation
                    .error.message
                : "Unable to record donation."}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createMutation.isPending
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Check size={16} />
              )}

              {createMutation.isPending
                ? "Saving..."
                : "Record donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DonationDetails({
  donation,
  onClose,
  onUpdated,
}: {
  donation: DonationResponse;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const updateMutation =
    useUpdateDonation();

  const [error, setError] =
    useState("");

  const update = async (
    data: DonationUpdate,
  ) => {
    setError("");

    try {
      await updateMutation.mutateAsync(
        {
          donationId:
            donation.id,
          data,
        },
      );

      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update donation.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-xl flex-col bg-[var(--ivory)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <p className="font-devanagari text-xs tracking-[0.22em] text-[var(--radha-rose)]">
              DONATION DETAILS
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              {donation.id
                .slice(0, 8)
                .toUpperCase()}
            </h2>

            <div className="mt-2">
              <StatusBadge
                value={
                  donation.status
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--ivory)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
              Donation information
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Amount
                </p>

                <p className="mt-1 font-display text-2xl font-semibold text-[var(--krishna-blue)]">
                  ₹
                  {Number(
                    donation.amount,
                  ).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Date
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(
                    donation.donated_at,
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Temple
                </p>

                <p className="mt-1 break-all text-sm font-medium">
                  {donation.temple_id}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Devotee
                </p>

                <p className="mt-1 break-all text-sm font-medium">
                  {donation.devotee_id}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Type
                </p>

                <p className="mt-1 text-sm font-medium">
                  {donation.donation_type}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Payment
                </p>

                <p className="mt-1 text-sm font-medium">
                  —
                </p>
              </div>
            </div>

            {donation.notes && (
              <div className="mt-6 rounded-xl bg-[var(--ivory)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6">
                  {donation.notes}
                </p>
              </div>
            )}
          </section>

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="font-display text-xl font-semibold">
              Update status
            </h3>

            <div className="mt-4">
              <select
                value={
                  donation.status
                }
                disabled={
                  updateMutation.isPending
                }
                onChange={(event) =>
                  void update({
                    status:
                      event.target
                        .value,
                  } as DonationUpdate)
                }
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm outline-none"
              >
                <option value="PENDING">
                  Pending
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
                <option value="FAILED">
                  Failed
                </option>
              </select>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-white text-sm font-medium"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function DonationRow({
  donation,
  onOpen,
}: {
  donation: DonationResponse;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[1.2fr_1fr_1fr_140px_120px] items-center gap-4 border-b border-[var(--border)] px-5 py-4 text-left last:border-b-0 hover:bg-[var(--ivory)]"
    >
      <div>
        <p className="font-medium text-[var(--earth-brown-deep)]">
          {donation.id
            .slice(0, 8)
            .toUpperCase()}
        </p>

        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {formatDate(
            donation.donated_at,
          )}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">
          {donation.devotee_id
            ? donation.devotee_id.slice(
                0,
                8,
              )
            : "Walk-in donor"}
        </p>

        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {donation.donation_type}
        </p>
      </div>

      <div>
        <p className="font-display text-lg font-semibold text-[var(--krishna-blue)]">
          ₹
          {Number(
            donation.amount,
          ).toLocaleString(
            "en-IN",
          )}
        </p>

        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          —
        </p>
      </div>

      <StatusBadge
        value={donation.status}
      />

      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--krishna-blue)]">
        <Eye size={14} />
        View
      </span>
    </button>
  );
}

export default function DonationsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [donationDate, setDonationDate] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [selectedDonation, setSelectedDonation] =
    useState<DonationResponse | null>(
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

  const activeTemples =
    useMemo(
      () =>
        (
          templesQuery.data ??
          []
        ).filter(
          (temple) =>
            temple.is_active,
        ),
      [templesQuery.data],
    );

  const effectiveTempleId =
    selectedTempleId ||
    activeTemples[0]?.id ||
    "";

  const donationsQuery =
    useDonations(
      {
        templeId:
          effectiveTempleId ||
          undefined,
        donationDate:
          donationDate ||
          undefined,
        status:
          status || undefined,
        limit: 100,
        offset: 0,
      },
      hasToken &&
        Boolean(
          effectiveTempleId,
        ),
    );

  const donations =
    donationsQuery.data ?? [];

  const filteredDonations =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return donations;
      }

      return donations.filter(
        (donation) =>
          donation.id
            .toLowerCase()
            .includes(term) ||
          (donation.devotee_id
            ?.toLowerCase()
            .includes(term) ??
            false) ||
          donation.donation_number
            .toLowerCase()
            .includes(term) ||
          donation.donor_name
            .toLowerCase()
            .includes(term),
      );
    }, [
      donations,
      search,
    ]);

  const totalAmount =
    filteredDonations.reduce(
      (sum, donation) =>
        sum +
        Number(
          donation.amount,
        ),
      0,
    );

  if (!mounted) {
    return <PageLoading />;
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-white p-8">
          <h1 className="font-display text-3xl font-semibold">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please sign in to manage
            donations.
          </p>
        </div>
      </main>
    );
  }

  if (
    templesQuery.isLoading ||
    donationsQuery.isLoading
  ) {
    return <PageLoading />;
  }

  if (templesQuery.isError) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            message="Unable to load temples."
            onRetry={() =>
              templesQuery.refetch()
            }
          />
        </div>
      </main>
    );
  }

  if (donationsQuery.isError) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            message="Unable to load donations."
            onRetry={() =>
              donationsQuery.refetch()
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)] p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-devanagari text-xs tracking-[0.24em] text-[var(--radha-rose)]">
              TEMPLE CONTRIBUTIONS
            </p>

            <h1 className="mt-1 font-display text-4xl font-semibold text-[var(--earth-brown-deep)]">
              Donations
            </h1>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Record and manage devotee
              contributions.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowForm(true)
            }
            disabled={
              !effectiveTempleId
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            <Plus size={17} />
            Record Donation
          </button>
        </header>

        {activeTemples.length ===
        0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center">
            <h2 className="font-display text-2xl font-semibold">
              No active temple
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Activate a temple before
              recording donations.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Records
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                  {
                    filteredDonations.length
                  }
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Total displayed
                </p>

                <p className="mt-2 font-display text-3xl font-semibold text-[var(--krishna-blue)]">
                  ₹
                  {totalAmount.toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Temple
                </p>

                <p className="mt-2 truncate font-display text-xl font-semibold">
                  {
                    activeTemples.find(
                      (temple) =>
                        temple.id ===
                        effectiveTempleId,
                    )?.name
                  }
                </p>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Search donation or devotee ID"
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] pl-10 pr-4 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Temple
                  </label>

                  <select
                    value={
                      effectiveTempleId
                    }
                    onChange={(event) =>
                      setSelectedTempleId(
                        event.target
                          .value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm"
                  >
                    {activeTemples.map(
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
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Date
                  </label>

                  <input
                    type="date"
                    value={donationDate}
                    onChange={(event) =>
                      setDonationDate(
                        event.target
                          .value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target
                          .value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm"
                  >
                    <option value="">
                      All statuses
                    </option>
                    <option value="PENDING">
                      Pending
                    </option>
                    <option value="COMPLETED">
                      Completed
                    </option>
                    <option value="CANCELLED">
                      Cancelled
                    </option>
                    <option value="FAILED">
                      Failed
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Payment:
                  </span>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value,
                      )
                    }
                    className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-xs"
                  >
                    <option value="">
                      All
                    </option>
                    <option value="CASH">
                      Cash
                    </option>
                    <option value="UPI">
                      UPI
                    </option>
                    <option value="CARD">
                      Card
                    </option>
                    <option value="BANK_TRANSFER">
                      Bank transfer
                    </option>
                    <option value="CHEQUE">
                      Cheque
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    donationsQuery.refetch()
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="hidden grid-cols-[1.2fr_1fr_1fr_140px_120px] gap-4 border-b border-[var(--border)] bg-[var(--ivory)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] lg:grid">
                <span>Donation</span>
                <span>Devotee / Type</span>
                <span>Amount / Payment</span>
                <span>Status</span>
                <span>Details</span>
              </div>

              {filteredDonations.length ===
              0 ? (
                <div className="px-6 py-16 text-center">
                  <CalendarDays
                    size={30}
                    className="mx-auto text-[var(--antique-gold)]"
                  />

                  <h2 className="mt-4 font-display text-2xl font-semibold">
                    No donations found
                  </h2>

                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Record a donation or
                    adjust the filters.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowForm(
                        true,
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Record donation
                  </button>
                </div>
              ) : (
                filteredDonations.map(
                  (donation) => (
                    <DonationRow
                      key={
                        donation.id
                      }
                      donation={
                        donation
                      }
                      onOpen={() =>
                        setSelectedDonation(
                          donation,
                        )
                      }
                    />
                  ),
                )
              )}
            </section>
          </>
        )}
      </div>

      {showForm &&
        effectiveTempleId && (
          <DonationForm
            templeId={
              effectiveTempleId
            }
            onClose={() =>
              setShowForm(false)
            }
            onSuccess={async () => {
              setShowForm(false);

              await donationsQuery.refetch();
            }}
          />
        )}

      {selectedDonation && (
        <DonationDetails
          donation={
            selectedDonation
          }
          onClose={() =>
            setSelectedDonation(
              null,
            )
          }
          onUpdated={async () => {
            await donationsQuery.refetch();
            setSelectedDonation(
              null,
            );
          }}
        />
      )}
    </main>
  );
}












