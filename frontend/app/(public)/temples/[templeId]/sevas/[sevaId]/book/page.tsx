"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  usePublicSeva,
  usePublicSevaSlots,
} from "@/features/public/hooks";
import { usePublicAuth } from "@/features/public/PublicAuthContext";

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function SevaBookingPage() {
  const params = useParams<{
    templeId: string;
    sevaId: string;
  }>();

  const router = useRouter();

  const templeId = params.templeId;
  const sevaId = params.sevaId;

  const {
    devotee,
    isAuthenticated,
    isLoading: authLoading,
  } = usePublicAuth();

  const [selectedDate, setSelectedDate] = useState(
    getDateString(new Date()),
  );

  const [selectedSlotId, setSelectedSlotId] =
    useState<string>("");

  const [quantity, setQuantity] = useState(1);

  const sevaQuery = usePublicSeva(sevaId);

  const slotsQuery = usePublicSevaSlots({
    sevaId,
    slotDate: selectedDate,
  });

  const seva = sevaQuery.data;

  const slots = useMemo(
    () =>
      (slotsQuery.data ?? []).filter(
        (slot) =>
          slot.status === "AVAILABLE" &&
          slot.capacity > slot.booked_count,
      ),
    [slotsQuery.data],
  );

  const selectedSlot = slots.find(
    (slot) => slot.id === selectedSlotId,
  );

  const amount = useMemo(() => {
    if (!seva) {
      return 0;
    }

    return Number(seva.amount) * quantity;
  }, [seva, quantity]);

  const maxQuantity = selectedSlot
    ? Math.max(
        1,
        selectedSlot.capacity -
          selectedSlot.booked_count,
      )
    : 1;

  function changeDate(value: string) {
    setSelectedDate(value);
    setSelectedSlotId("");
    setQuantity(1);
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(current + 1, maxQuantity),
    );
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(current - 1, 1),
    );
  }

  function continueBooking() {
    if (!seva) {
      return;
    }

    if (seva.requires_slot && !selectedSlot) {
      return;
    }

    if (!isAuthenticated) {
      const redirect = encodeURIComponent(
        `/temples/${templeId}/sevas/${sevaId}/book?date=${selectedDate}${
          selectedSlotId
            ? `&slot=${selectedSlotId}`
            : ""
        }&quantity=${quantity}`,
      );

      router.push(`/login?redirect=${redirect}`);
      return;
    }

    router.push(
      `/temples/${templeId}/sevas/${sevaId}/book/confirm?date=${selectedDate}${
        selectedSlotId
          ? `&slot=${selectedSlotId}`
          : ""
      }&quantity=${quantity}`,
    );
  }

  if (
    authLoading ||
    sevaQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-stone-500"
        />
      </div>
    );
  }

  if (sevaQuery.isError || !seva) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-semibold text-red-900">
            Unable to load this seva
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Please return to the seva directory and try
            again.
          </p>

          <Link
            href={`/temples/${templeId}/sevas`}
            className="mt-6 inline-flex rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Sevas
          </Link>
        </div>
      </div>
    );
  }

  const requiresSlot = seva.requires_slot;

  const canContinue =
    (!requiresSlot || Boolean(selectedSlot)) &&
    quantity >= 1 &&
    quantity <= maxQuantity;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href={`/temples/${templeId}/sevas/${sevaId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={17} />
          Back to seva
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Seva Booking
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Book {seva.name}
          </h1>

          {seva.description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              {seva.description}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">

          <div className="space-y-6">

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-stone-900">
                    Choose date
                  </h2>

                  <p className="text-sm text-stone-500">
                    Select the day you want to perform this
                    seva.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <input
                  type="date"
                  min={getDateString(new Date())}
                  value={selectedDate}
                  onChange={(event) =>
                    changeDate(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none focus:border-stone-500"
                />
              </div>

              <p className="mt-3 text-sm text-stone-500">
                {formatDate(selectedDate)}
              </p>
            </section>

            {requiresSlot && (
              <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                    <Clock3 size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-stone-900">
                      Choose time slot
                    </h2>

                    <p className="text-sm text-stone-500">
                      Available slots for the selected date.
                    </p>
                  </div>
                </div>

                {slotsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2
                      size={24}
                      className="animate-spin text-stone-400"
                    />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-7 text-center">
                    <CalendarDays
                      size={26}
                      className="mx-auto text-stone-400"
                    />

                    <h3 className="mt-3 font-semibold text-stone-800">
                      No available slots
                    </h3>

                    <p className="mt-1 text-sm text-stone-500">
                      Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {slots.map((slot) => {
                      const remaining =
                        slot.capacity -
                        slot.booked_count;

                      const selected =
                        slot.id === selectedSlotId;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setQuantity((current) =>
                              Math.min(
                                current,
                                remaining,
                              ),
                            );
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white hover:border-stone-400"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">
                              {formatTime(
                                slot.start_time,
                              )}
                            </span>

                            {selected && (
                              <Check size={18} />
                            )}
                          </div>

                          {slot.end_time && (
                            <p
                              className={`mt-1 text-sm ${
                                selected
                                  ? "text-stone-300"
                                  : "text-stone-500"
                              }`}
                            >
                              Until{" "}
                              {formatTime(
                                slot.end_time,
                              )}
                            </p>
                          )}

                          <p
                            className={`mt-3 text-xs ${
                              selected
                                ? "text-stone-300"
                                : "text-stone-500"
                            }`}
                          >
                            {remaining}{" "}
                            {remaining === 1
                              ? "place"
                              : "places"}{" "}
                            available
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <User size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-stone-900">
                    Number of devotees
                  </h2>

                  <p className="text-sm text-stone-500">
                    Select how many devotees this booking is
                    for.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                <div>
                  <p className="font-medium text-stone-900">
                    Quantity
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    Maximum{" "}
                    {maxQuantity}{" "}
                    {maxQuantity === 1
                      ? "booking"
                      : "bookings"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 disabled:opacity-40"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="w-8 text-center font-semibold text-stone-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >= maxQuantity
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 disabled:opacity-40"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </section>

          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Booking Summary
              </p>

              <h2 className="mt-3 text-xl font-semibold text-stone-900">
                {seva.name}
              </h2>

              <div className="mt-6 space-y-4 border-t border-stone-100 pt-5">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    Date
                  </span>

                  <span className="text-right font-medium text-stone-800">
                    {new Date(
                      `${selectedDate}T00:00:00`,
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>

                {selectedSlot && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-stone-500">
                      Time
                    </span>

                    <span className="font-medium text-stone-800">
                      {formatTime(
                        selectedSlot.start_time,
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    Price
                  </span>

                  <span className="font-medium text-stone-800">
                    ₹
                    {Number(seva.amount).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    Quantity
                  </span>

                  <span className="font-medium text-stone-800">
                    {quantity}
                  </span>
                </div>

              </div>

              <div className="mt-6 border-t border-stone-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-medium text-stone-500">
                    Total
                  </span>

                  <span className="text-2xl font-semibold text-stone-900">
                    ₹
                    {amount.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canContinue}
                onClick={continueBooking}
                className="mt-6 w-full rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAuthenticated
                  ? "Continue to booking"
                  : "Sign in to continue"}
              </button>

              <div className="mt-5 flex gap-3 rounded-2xl bg-stone-50 p-4">
                <ShieldCheck
                  size={19}
                  className="shrink-0 text-stone-600"
                />

                <p className="text-xs leading-5 text-stone-500">
                  Your booking details will be securely
                  associated with your devotee account.
                </p>
              </div>

              {isAuthenticated && devotee && (
                <p className="mt-4 text-center text-xs text-stone-400">
                  Booking for{" "}
                  <span className="font-medium text-stone-600">
                    {devotee.first_name}{" "}
                    {devotee.last_name ?? ""}
                  </span>
                </p>
              )}

            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}