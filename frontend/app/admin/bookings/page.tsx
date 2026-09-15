"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
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
import { useSevas } from "@/features/sevas/hooks";
import { useSevaSlots } from "@/features/seva-slots/hooks";

import {
  useBookings,
  useCreateBooking,
  useUpdateBooking,
} from "@/features/bookings/hooks";

import type {
  BookingCreate,
  BookingResponse,
  BookingUpdate,
} from "@/features/bookings/api";

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
  const status = value ?? "UNKNOWN";

  const classes =
    status === "CONFIRMED" ||
    status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELLED" ||
          status === "FAILED"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "COMPLETED"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function getDisplayName(
  value: unknown,
): string {
  if (!value || typeof value !== "object") {
    return "—";
  }

  const item =
    value as Record<string, unknown>;

  const firstName =
    typeof item.first_name === "string"
      ? item.first_name
      : "";

  const lastName =
    typeof item.last_name === "string"
      ? item.last_name
      : "";

  const name =
    typeof item.name === "string"
      ? item.name
      : "";

  return (
    [firstName, lastName]
      .filter(Boolean)
      .join(" ") ||
    name ||
    "—"
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(
  value?: string | null,
) {
  return value
    ? value.slice(0, 5)
    : "—";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>

      <div className="mt-1 text-sm font-medium text-[var(--earth-brown-deep)]">
        {value}
      </div>
    </div>
  );
}

function BookingDetails({
  booking,
  onClose,
  onUpdated,
}: {
  booking: BookingResponse;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const updateMutation =
    useUpdateBooking();

  const [actionError, setActionError] =
    useState("");

  const update = async (
    data: BookingUpdate,
  ) => {
    setActionError("");

    try {
      await updateMutation.mutateAsync({
        bookingId: booking.id,
        data,
      });

      onUpdated();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update booking.",
      );
    }
  };

  const confirmBooking = () =>
    update({
      status: "CONFIRMED",
    } as BookingUpdate);

  const completeBooking = () =>
    update({
      status: "COMPLETED",
    } as BookingUpdate);

  const cancelBooking = () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this booking? The slot capacity will be released by the backend.",
      );

    if (!confirmed) {
      return;
    }

    void update({
      status: "CANCELLED",
    } as BookingUpdate);
  };

  const updatePayment = (
    paymentStatus:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED",
  ) => {
    void update({
      payment_status:
        paymentStatus,
    } as BookingUpdate);
  };

  const canConfirm =
    booking.status === "PENDING";

  const canComplete =
    booking.status === "CONFIRMED";

  const canCancel =
    booking.status === "PENDING" ||
    booking.status === "CONFIRMED";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-xl flex-col bg-[var(--ivory)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] bg-white px-6 py-5">
          <div>
            <p className="font-devanagari text-xs tracking-[0.22em] text-[var(--radha-rose)]">
              BOOKING DETAILS
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              {booking.id
                .slice(0, 8)
                .toUpperCase()}
            </h2>

            <div className="mt-2 flex gap-2">
              <StatusBadge
                value={booking.status}
              />

              <StatusBadge
                value={
                  booking.payment_status
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
              Booking information
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
              <DetailItem
                label="Booking ID"
                value={booking.id}
              />

              <DetailItem
                label="Temple"
                value={
                  booking.temple_id
                }
              />

              <DetailItem
                label="Devotee"
                value={
                  booking.devotee_id
                }
              />

              <DetailItem
                label="Seva"
                value={
                  booking.seva_id
                }
              />

              <DetailItem
                label="Booking date"
                value={formatDate(
                  booking.booking_date,
                )}
              />

              <DetailItem
                label="Quantity"
                value={
                  booking.quantity
                }
              />

              <DetailItem
                label="Total amount"
                value={
                  <span className="font-display text-lg text-[var(--krishna-blue)]">
                    ₹
                    {Number(
                      booking.amount,
                    ).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                }
              />

              <DetailItem
                label="Payment"
                value={
                  <StatusBadge
                    value={
                      booking.payment_status
                    }
                  />
                }
              />
            </div>

            {booking.special_request && (
              <div className="mt-6 rounded-xl bg-[var(--ivory)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Special request
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--earth-brown)]">
                  {booking.special_request}
                </p>
              </div>
            )}
          </section>

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
              Booking actions
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canConfirm && (
                <button
                  type="button"
                  onClick={() =>
                    void confirmBooking()
                  }
                  disabled={
                    updateMutation.isPending
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--peacock-green)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={16} />
                  )}

                  Confirm booking
                </button>
              )}

              {canComplete && (
                <button
                  type="button"
                  onClick={() =>
                    void completeBooking()
                  }
                  disabled={
                    updateMutation.isPending
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={16} />
                  )}

                  Mark completed
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={cancelBooking}
                  disabled={
                    updateMutation.isPending
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-60"
                >
                  <X size={16} />
                  Cancel booking
                </button>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="font-display text-xl font-semibold text-[var(--earth-brown-deep)]">
              Payment status
            </h3>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Update the payment state associated
              with this booking.
            </p>

            <div className="mt-4">
              <select
                value={
                  booking.payment_status
                }
                onChange={(event) =>
                  updatePayment(
                    event.target
                      .value as
                      | "PENDING"
                      | "PAID"
                      | "FAILED"
                      | "REFUNDED",
                  )
                }
                disabled={
                  updateMutation.isPending
                }
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm outline-none focus:border-[var(--peacock-green)]"
              >
                <option value="PENDING">
                  Pending
                </option>
                <option value="PAID">
                  Paid
                </option>
                <option value="FAILED">
                  Failed
                </option>
                <option value="REFUNDED">
                  Refunded
                </option>
              </select>
            </div>
          </section>

          {actionError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-white text-sm font-medium text-[var(--earth-brown)] hover:bg-[var(--ivory)]"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function BookingForm({
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

  const [sevaId, setSevaId] =
    useState("");

  const [slotId, setSlotId] =
    useState("");

  const [bookingDate, setBookingDate] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [specialRequest, setSpecialRequest] =
    useState("");

  const devoteesQuery = useDevotees(
    {
      templeId,
      limit: 100,
      offset: 0,
    },
    Boolean(templeId),
  );

  const sevasQuery = useSevas(
    {
      templeId,
      isActive: true,
      limit: 100,
      offset: 0,
    },
    Boolean(templeId),
  );

  const slotsQuery = useSevaSlots(
    sevaId,
    {
      slotDate:
        bookingDate || undefined,
      status: "AVAILABLE",
    },
    Boolean(
      sevaId && bookingDate,
    ),
  );

  const createMutation =
    useCreateBooking();

  const devotees =
    devoteesQuery.data ?? [];

  const sevas =
    sevasQuery.data ?? [];

  const slots =
    slotsQuery.data ?? [];

  const selectedSeva =
    sevas.find(
      (seva) =>
        seva.id === sevaId,
    );

  const selectedSlot =
    slots.find(
      (slot) =>
        slot.id === slotId,
    );

  const sevaAmount =
    Number(
      (selectedSeva as Record<
        string,
        unknown
      > | undefined)?.amount ??
        (selectedSeva as Record<
          string,
          unknown
        > | undefined)?.price ??
        0,
    );

  const totalAmount =
    sevaAmount *
    Math.max(
      Number(quantity) || 0,
      0,
    );

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const numericQuantity =
      Number(quantity);

    if (
      !devoteeId ||
      !sevaId ||
      !bookingDate ||
      !numericQuantity ||
      numericQuantity < 1
    ) {
      return;
    }

    if (
      selectedSlot &&
      numericQuantity >
        selectedSlot.capacity -
          selectedSlot.booked_count
    ) {
      return;
    }

    const payload: BookingCreate = {
      devotee_id: devoteeId,
      seva_id: sevaId,
      slot_id:
        slotId || undefined,
      booking_date: bookingDate,
      quantity: numericQuantity,
      special_request:
        specialRequest.trim() ||
        undefined,
    };

    try {
      await createMutation.mutateAsync(
        payload,
      );

      onSuccess();
    } catch {
      // Error shown below.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--ivory)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="font-devanagari text-xs tracking-[0.22em] text-[var(--radha-rose)]">
              SEVA BOOKING
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
              New Booking
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
              Devotee
            </label>

            <select
              value={devoteeId}
              onChange={(event) =>
                setDevoteeId(
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
              required
            >
              <option value="">
                Select devotee
              </option>

              {devotees.map(
                (devotee) => (
                  <option
                    key={devotee.id}
                    value={devotee.id}
                  >
                    {getDisplayName(
                      devotee,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Seva
              </label>

              <select
                value={sevaId}
                onChange={(event) => {
                  setSevaId(
                    event.target.value,
                  );
                  setSlotId("");
                }}
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
                required
              >
                <option value="">
                  Select seva
                </option>

                {sevas.map(
                  (seva) => (
                    <option
                      key={seva.id}
                      value={seva.id}
                    >
                      {String(
                        (
                          seva as Record<
                            string,
                            unknown
                          >
                        ).name ??
                          seva.id,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Booking date
              </label>

              <input
                type="date"
                value={bookingDate}
                onChange={(event) => {
                  setBookingDate(
                    event.target.value,
                  );
                  setSlotId("");
                }}
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
              Available slot
            </label>

            <select
              value={slotId}
              onChange={(event) =>
                setSlotId(
                  event.target.value,
                )
              }
              disabled={
                !sevaId ||
                !bookingDate ||
                slotsQuery.isLoading
              }
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none disabled:bg-gray-50 focus:border-[var(--peacock-green)]"
            >
              <option value="">
                {!sevaId
                  ? "Select seva first"
                  : !bookingDate
                    ? "Select date first"
                    : slotsQuery.isLoading
                      ? "Loading slots..."
                      : slots.length ===
                          0
                        ? "No available slots"
                        : "Select slot"}
              </option>

              {slots.map(
                (slot) => (
                  <option
                    key={slot.id}
                    value={slot.id}
                  >
                    {formatTime(
                      slot.start_time,
                    )}{" "}
                    –{" "}
                    {formatTime(
                      slot.end_time,
                    )}{" "}
                    ·{" "}
                    {Math.max(
                      slot.capacity -
                        slot.booked_count,
                      0,
                    )}{" "}
                    remaining
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                max={
                  selectedSlot
                    ? Math.max(
                        selectedSlot.capacity -
                          selectedSlot.booked_count,
                        1,
                      )
                    : undefined
                }
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--peacock-green)]"
                required
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              <p className="text-xs text-[var(--muted-foreground)]">
                Estimated amount
              </p>

              <p className="mt-1 font-display text-2xl font-semibold text-[var(--krishna-blue)]">
                ₹
                {totalAmount.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--earth-brown)]">
              Special request
            </label>

            <textarea
              value={specialRequest}
              onChange={(event) =>
                setSpecialRequest(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Optional request or note..."
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
                ? createMutation.error.message
                : "Unable to create booking."}
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
              {createMutation.isPending && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {createMutation.isPending
                ? "Creating..."
                : "Create booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  onOpen,
}: {
  booking: BookingResponse;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[1.3fr_1.2fr_1fr_120px_120px] items-center gap-4 border-b border-[var(--border)] px-5 py-4 text-left last:border-b-0 hover:bg-[var(--ivory)]"
    >
      <div>
        <p className="font-medium text-[var(--earth-brown-deep)]">
          {booking.id
            .slice(0, 8)
            .toUpperCase()}
        </p>

        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {formatDate(
            booking.booking_date,
          )}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--earth-brown-deep)]">
          {booking.seva_id.slice(
            0,
            8,
          )}
        </p>

        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Devotee{" "}
          {booking.devotee_id.slice(
            0,
            8,
          )}
        </p>
      </div>

      <div>
        <p className="text-sm">
          Qty: {booking.quantity}
        </p>

        <p className="mt-1 text-sm font-semibold text-[var(--krishna-blue)]">
          ₹
          {Number(
            booking.amount,
          ).toLocaleString(
            "en-IN",
          )}
        </p>
      </div>

      <StatusBadge
        value={booking.status}
      />

      <StatusBadge
        value={
          booking.payment_status
        }
      />
    </button>
  );
}

export default function BookingsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [bookingDate, setBookingDate] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<BookingResponse | null>(
      null,
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasToken =
    mounted && Boolean(
      getAccessToken(),
    );

  const templesQuery =
    useTemples(hasToken);

  const activeTemples =
    useMemo(
      () =>
        (
          templesQuery.data ?? []
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

  const bookingsQuery =
    useBookings(
      {
        templeId:
          effectiveTempleId ||
          undefined,
        bookingDate:
          bookingDate || undefined,
        status:
          status || undefined,
        paymentStatus:
          paymentStatus ||
          undefined,
        limit: 100,
        offset: 0,
      },
      hasToken &&
        Boolean(
          effectiveTempleId,
        ),
    );

  const bookings =
    bookingsQuery.data ?? [];

  const filteredBookings =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return bookings;
      }

      return bookings.filter(
        (booking) =>
          booking.id
            .toLowerCase()
            .includes(term) ||
          booking.devotee_id
            .toLowerCase()
            .includes(term) ||
          booking.seva_id
            .toLowerCase()
            .includes(term),
      );
    }, [bookings, search]);

  const refreshAfterUpdate =
    async () => {
      await bookingsQuery.refetch();
      setSelectedBooking(null);
    };

  if (!mounted) {
    return <PageLoading />;
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-white p-8">
          <h1 className="font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please sign in to manage
            bookings.
          </p>
        </div>
      </main>
    );
  }

  if (
    templesQuery.isLoading ||
    bookingsQuery.isLoading
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

  if (bookingsQuery.isError) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            message="Unable to load bookings."
            onRetry={() =>
              bookingsQuery.refetch()
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
              SEVA MANAGEMENT
            </p>

            <h1 className="mt-1 font-display text-4xl font-semibold text-[var(--earth-brown-deep)]">
              Bookings
            </h1>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Manage seva reservations,
              devotees and payment status.
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--krishna-blue-deep)] disabled:opacity-50"
          >
            <Plus size={17} />
            New Booking
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
              creating bookings.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
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
                      placeholder="Search booking, devotee or seva ID"
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] pl-10 pr-4 text-sm outline-none focus:border-[var(--peacock-green)]"
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
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm outline-none"
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
                    value={bookingDate}
                    onChange={(event) =>
                      setBookingDate(
                        event.target
                          .value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm outline-none"
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
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--ivory)] px-3 text-sm outline-none"
                  >
                    <option value="">
                      All statuses
                    </option>
                    <option value="PENDING">
                      Pending
                    </option>
                    <option value="CONFIRMED">
                      Confirmed
                    </option>
                    <option value="CANCELLED">
                      Cancelled
                    </option>
                    <option value="COMPLETED">
                      Completed
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
                      paymentStatus
                    }
                    onChange={(event) =>
                      setPaymentStatus(
                        event.target
                          .value,
                      )
                    }
                    className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-xs"
                  >
                    <option value="">
                      All
                    </option>
                    <option value="PENDING">
                      Pending
                    </option>
                    <option value="PAID">
                      Paid
                    </option>
                    <option value="FAILED">
                      Failed
                    </option>
                    <option value="REFUNDED">
                      Refunded
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    bookingsQuery.refetch()
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_120px_120px] gap-4 border-b border-[var(--border)] bg-[var(--ivory)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] lg:grid">
                <span>Booking</span>
                <span>Seva / Devotee</span>
                <span>Quantity / Amount</span>
                <span>Status</span>
                <span>Payment</span>
              </div>

              {filteredBookings.length ===
              0 ? (
                <div className="px-6 py-16 text-center">
                  <CalendarDays
                    size={30}
                    className="mx-auto text-[var(--antique-gold)]"
                  />

                  <h2 className="mt-4 font-display text-2xl font-semibold">
                    No bookings found
                  </h2>

                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Create a booking or
                    adjust your filters.
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
                    Create booking
                  </button>
                </div>
              ) : (
                <div>
                  {filteredBookings.map(
                    (booking) => (
                      <BookingRow
                        key={
                          booking.id
                        }
                        booking={
                          booking
                        }
                        onOpen={() =>
                          setSelectedBooking(
                            booking,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showForm &&
        effectiveTempleId && (
          <BookingForm
            templeId={
              effectiveTempleId
            }
            onClose={() =>
              setShowForm(false)
            }
            onSuccess={async () => {
              setShowForm(false);
              await bookingsQuery.refetch();
            }}
          />
        )}

      {selectedBooking && (
        <BookingDetails
          booking={
            selectedBooking
          }
          onClose={() =>
            setSelectedBooking(
              null,
            )
          }
          onUpdated={
            refreshAfterUpdate
          }
        />
      )}
    </main>
  );
}

