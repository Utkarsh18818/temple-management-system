"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
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
      <div className="min-h-[70vh] bg-[#fbf7ef]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af37]/40 bg-white shadow-sm">
              <Loader2
                size={26}
                className="animate-spin text-[#9a6b1f]"
              />
            </div>

            <p className="mt-5 text-sm font-medium text-[#776b63]">
              Preparing your seva booking...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sevaQuery.isError || !seva) {
    return (
      <div className="min-h-[70vh] bg-[#fbf7ef]">
        <div className="temple-container py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-[#e7c7c7] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8e9ec] text-[#a85e69]">
              <Sparkles className="h-7 w-7" />
            </div>

            <h1 className="temple-heading mt-6 text-3xl text-[#332a25]">
              Unable to load this seva
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#776b63]">
              We could not retrieve this seva right now. Please
              return to the seva directory and try again.
            </p>

            <Link
              href={`/temples/${templeId}/sevas`}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#102a43] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#183b5c]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sevas
            </Link>
          </div>
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
    <div className="min-h-[calc(100vh-140px)] bg-[#fbf7ef]">

      <section className="relative overflow-hidden bg-[#102a43] text-white">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(212,175,55,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="absolute -left-28 top-0 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />

        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#b76e79]/10 blur-3xl" />

        <div className="temple-container relative py-12 sm:py-16">

          <Link
            href={`/temples/${templeId}/sevas`}
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#e7c873]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sevas
          </Link>

          <div className="mt-9 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">

            <div className="max-w-3xl">

              <div className="temple-eyebrow text-[#e7c873]">
                <Heart className="h-4 w-4" />
                Seva booking
              </div>

              <h1 className="temple-heading mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
                {seva.name}
              </h1>

              {seva.description && (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  {seva.description}
                </p>
              )}

            </div>

            <div className="hidden shrink-0 lg:flex">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/40 bg-white/5">
                <span className="font-serif text-5xl text-[#e7c873]">
                  ॐ
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      <div className="temple-container py-8 sm:py-10">

        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">

          <main className="space-y-6">

            <section className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbf4df] text-[#9a6b1f]">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#332a25]">
                    Choose your date
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#776b63]">
                    Select the day on which you would like to
                    perform this seva.
                  </p>
                </div>

              </div>

              <div className="mt-7">

                <label
                  htmlFor="seva-date"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9088]"
                >
                  Seva date
                </label>

                <input
                  id="seva-date"
                  type="date"
                  min={getDateString(new Date())}
                  value={selectedDate}
                  onChange={(event) =>
                    changeDate(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-[#ddd3c7] bg-[#fbf7ef] px-4 text-sm text-[#332a25] outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                />

              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f8f2e8] px-4 py-3">
                <CalendarDays className="h-4 w-4 text-[#9a6b1f]" />

                <p className="text-sm font-medium text-[#66594f]">
                  {formatDate(selectedDate)}
                </p>
              </div>

            </section>

            {requiresSlot && (
              <section className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm sm:p-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#46715b]">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#332a25]">
                      Choose your time
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#776b63]">
                      Select an available slot for your chosen
                      date.
                    </p>
                  </div>

                </div>

                {slotsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-14">
                    <div className="text-center">
                      <Loader2
                        size={24}
                        className="mx-auto animate-spin text-[#9a6b1f]"
                      />

                      <p className="mt-3 text-xs text-[#8b8077]">
                        Checking available slots...
                      </p>
                    </div>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="mt-7 rounded-2xl border border-dashed border-[#d9cec0] bg-[#fbf7ef] p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#9a6b1f] shadow-sm">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <h3 className="mt-4 font-serif text-xl font-semibold text-[#332a25]">
                      No available slots
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#776b63]">
                      There are currently no available slots for
                      this date. Please choose another date.
                    </p>

                  </div>
                ) : (
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">

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
                          className={`group rounded-2xl border p-5 text-left transition ${
                            selected
                              ? "border-[#102a43] bg-[#102a43] text-white shadow-lg shadow-[#102a43]/15"
                              : "border-[#e7dfd4] bg-white hover:-translate-y-0.5 hover:border-[#d4af37]/70 hover:shadow-md"
                          }`}
                        >

                          <div className="flex items-center justify-between gap-3">

                            <div className="flex items-center gap-3">

                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  selected
                                    ? "bg-white/10 text-[#e7c873]"
                                    : "bg-[#fbf4df] text-[#9a6b1f]"
                                }`}
                              >
                                <Clock3 className="h-4 w-4" />
                              </div>

                              <span className="font-semibold">
                                {formatTime(
                                  slot.start_time,
                                )}
                              </span>

                            </div>

                            {selected && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e7c873] text-[#102a43]">
                                <Check className="h-4 w-4" />
                              </div>
                            )}

                          </div>

                          {slot.end_time && (
                            <p
                              className={`mt-3 pl-12 text-xs ${
                                selected
                                  ? "text-white/60"
                                  : "text-[#8b8077]"
                              }`}
                            >
                              Until{" "}
                              {formatTime(
                                slot.end_time,
                              )}
                            </p>
                          )}

                          <div
                            className={`mt-4 border-t pt-3 ${
                              selected
                                ? "border-white/10"
                                : "border-[#eee7de]"
                            }`}
                          >
                            <p
                              className={`text-xs ${
                                selected
                                  ? "text-[#e7c873]"
                                  : "text-[#8b8077]"
                              }`}
                            >
                              {remaining}{" "}
                              {remaining === 1
                                ? "place"
                                : "places"}{" "}
                              available
                            </p>
                          </div>

                        </button>
                      );
                    })}

                  </div>
                )}

              </section>
            )}

            <section className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f8e9ec] text-[#a85e69]">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#332a25]">
                    Number of devotees
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#776b63]">
                    Select the number of devotees this booking is
                    for.
                  </p>
                </div>

              </div>

              <div className="mt-7 flex items-center justify-between rounded-2xl bg-[#fbf7ef] p-5">

                <div>
                  <p className="font-semibold text-[#332a25]">
                    Quantity
                  </p>

                  <p className="mt-1 text-xs text-[#8b8077]">
                    Maximum {maxQuantity}{" "}
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
                    aria-label="Decrease quantity"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ddd3c7] bg-white text-[#66594f] transition hover:border-[#b8a894] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="w-8 text-center text-lg font-semibold text-[#332a25]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >= maxQuantity
                    }
                    aria-label="Increase quantity"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ddd3c7] bg-white text-[#66594f] transition hover:border-[#b8a894] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} />
                  </button>

                </div>

              </div>

            </section>

          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">

            <div className="overflow-hidden rounded-3xl border border-[#e7dfd4] bg-white shadow-xl shadow-[#6b5848]/10">

              <div className="bg-[#102a43] px-6 py-7 text-white">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e7c873]">
                      Your offering
                    </p>

                    <h2 className="mt-2 font-serif text-2xl font-semibold">
                      Booking summary
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af37]/40 bg-white/5">
                    <span className="font-serif text-2xl text-[#e7c873]">
                      ॐ
                    </span>
                  </div>

                </div>

              </div>

              <div className="p-6">

                <h3 className="font-serif text-xl font-semibold text-[#332a25]">
                  {seva.name}
                </h3>

                <div className="mt-6 space-y-4 border-t border-[#eee7de] pt-5">

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#8b8077]">
                      Date
                    </span>

                    <span className="text-right font-medium text-[#332a25]">
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
                      <span className="text-[#8b8077]">
                        Time
                      </span>

                      <span className="font-medium text-[#332a25]">
                        {formatTime(
                          selectedSlot.start_time,
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#8b8077]">
                      Price
                    </span>

                    <span className="font-medium text-[#332a25]">
                      ₹
                      {Number(seva.amount).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#8b8077]">
                      Quantity
                    </span>

                    <span className="font-medium text-[#332a25]">
                      {quantity}
                    </span>
                  </div>

                </div>

                <div className="mt-6 border-t border-[#e7dfd4] pt-5">

                  <div className="flex items-end justify-between gap-4">

                    <span className="text-sm font-medium text-[#776b63]">
                      Total offering
                    </span>

                    <span className="font-serif text-3xl font-semibold text-[#8a5a16]">
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
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#102a43] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#102a43]/15 transition hover:bg-[#183b5c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAuthenticated
                    ? "Continue to booking"
                    : "Sign in to continue"}

                  <ArrowRight className="h-4 w-4" />
                </button>

                {!canContinue && requiresSlot && (
                  <p className="mt-3 text-center text-xs text-[#a85e69]">
                    Please select an available time slot to
                    continue.
                  </p>
                )}

                <div className="mt-5 flex gap-3 rounded-2xl bg-[#f4ede2] p-4">

                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-[#46715b]"
                  />

                  <p className="text-xs leading-5 text-[#776b63]">
                    Your booking details are securely associated
                    with your devotee account.
                  </p>

                </div>

                {isAuthenticated && devotee && (
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#8b8077]">

                    <User className="h-3.5 w-3.5" />

                    <span>
                      Booking for{" "}
                      <span className="font-semibold text-[#66594f]">
                        {devotee.first_name}{" "}
                        {devotee.last_name ?? ""}
                      </span>
                    </span>

                  </div>
                )}

              </div>

            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}
