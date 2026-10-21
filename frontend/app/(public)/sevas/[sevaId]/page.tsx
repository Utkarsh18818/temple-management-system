"use client";

import { TempleLink as Link } from "@/features/public/TempleContext";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import {
  usePublicSeva,
  usePublicSevaSlots,
} from "@/features/public/hooks";

export default function SevaDetailPage() {
  const params = useParams();
  const sevaId = params.sevaId as string;

  const {
    data: seva,
    isLoading: sevaLoading,
    isError: sevaError,
  } = usePublicSeva(sevaId);

  const {
    data: slots,
    isLoading: slotsLoading,
    isError: slotsError,
  } = usePublicSevaSlots({
    sevaId,
  });

  if (sevaLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 w-32 rounded bg-stone-200" />
          <div className="mt-8 h-72 rounded-3xl bg-stone-200" />
          <div className="mt-10 h-10 w-2/3 rounded bg-stone-200" />
        </div>
      </div>
    );
  }

  if (sevaError || !seva) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Heart className="h-7 w-7" />
        </div>

        <h1 className="mt-6 font-display text-4xl font-semibold text-stone-900">
          Seva not found
        </h1>

        <p className="mt-3 text-sm leading-7 text-stone-500">
          This seva is no longer available or could not be
          loaded.
        </p>

        <Link
          href="/sevas"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Browse Sevas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const requiresSlot = Boolean(seva.requires_slot);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.25),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(180,83,9,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Link
            href="/sevas"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition hover:text-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
            All Sevas
          </Link>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                {seva.seva_type || "Sacred Seva"}
              </div>

              <h1 className="mt-6 font-display text-5xl font-semibold leading-tight text-white sm:text-6xl">
                {seva.name}
              </h1>

              {seva.description && (
                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
                  {seva.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/60 px-5 py-3 text-sm text-stone-200">
                  <Heart className="h-4 w-4 text-amber-400" />
                  ₹{Number(seva.amount).toLocaleString("en-IN")}
                </div>

                {seva.duration_minutes && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/60 px-5 py-3 text-sm text-stone-200">
                    <Clock className="h-4 w-4 text-amber-400" />
                    {seva.duration_minutes} minutes
                  </div>
                )}

                {seva.requires_slot && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/60 px-5 py-3 text-sm text-stone-200">
                    <CalendarDays className="h-4 w-4 text-amber-400" />
                    Slot required
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="flex h-72 w-72 items-center justify-center rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/20 to-transparent">
                <div className="flex h-52 w-52 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
                  <Heart className="h-20 w-20 text-amber-400/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-stone-200 p-6 sm:border-r lg:border-b-0">
            <Heart className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Offering
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              ₹{Number(seva.amount).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="border-b border-stone-200 p-6 lg:border-b-0 lg:border-r">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Duration
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {seva.duration_minutes
                ? `${seva.duration_minutes} minutes`
                : "As per temple schedule"}
            </p>
          </div>

          <div className="border-b border-stone-200 p-6 sm:border-r lg:border-b-0">
            <Users className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Capacity
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {seva.max_bookings
                ? `${seva.max_bookings} bookings`
                : "Temple managed"}
            </p>
          </div>

          <div className="p-6">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Online booking
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {seva.is_online
                ? "Available"
                : "Not available"}
            </p>
          </div>
        </div>
      </section>

      {/* Booking / Slots */}
      <section className="bg-stone-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Reserve your participation
            </p>

            <h2 className="mt-2 font-display text-4xl font-semibold text-stone-900 sm:text-5xl">
              {requiresSlot
                ? "Available Slots"
                : "Book this Seva"}
            </h2>

            <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
              {requiresSlot
                ? "Choose an available date and time that works for you."
                : "Continue to provide your devotee details and complete the booking."}
            </p>
          </div>

          {!requiresSlot ? (
            <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-stone-900">
                    Ready to participate?
                  </h3>

                  <p className="mt-2 text-sm text-stone-500">
                    Booking for this seva does not require a
                    scheduled slot.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-300 px-7 text-sm font-semibold text-stone-600"
                >
                  Booking flow coming next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {slotsLoading && (
                <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-44 animate-pulse rounded-2xl bg-stone-200"
                      />
                    ),
                  )}
                </div>
              )}

              {slotsError && (
                <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                  <p className="text-sm text-red-700">
                    Unable to load available slots right now.
                  </p>
                </div>
              )}

              {!slotsLoading &&
                !slotsError &&
                (!slots || slots.length === 0) && (
                  <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                    <CalendarDays className="mx-auto h-10 w-10 text-stone-300" />

                    <h3 className="mt-5 font-display text-2xl font-semibold text-stone-800">
                      No slots available
                    </h3>

                    <p className="mt-2 text-sm text-stone-500">
                      There are currently no available slots
                      for this seva.
                    </p>
                  </div>
                )}

              {!slotsLoading &&
                !slotsError &&
                slots &&
                slots.length > 0 && (
                  <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot) => {
                      const remaining =
                        Math.max(
                          0,
                          slot.capacity -
                            slot.booked_count,
                        );

                      const available =
                        slot.status === "AVAILABLE" &&
                        remaining > 0;

                      return (
                        <div
                          key={slot.id}
                          className={`rounded-2xl border bg-white p-6 transition ${
                            available
                              ? "border-stone-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                              : "border-stone-200 opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              <CalendarDays className="h-5 w-5" />
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                available
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-stone-100 text-stone-500"
                              }`}
                            >
                              {available
                                ? "Available"
                                : slot.status}
                            </span>
                          </div>

                          <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">
                            {slot.slot_date}
                          </h3>

                          <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                            <Clock className="h-4 w-4 text-amber-600" />
                            {slot.start_time} —{" "}
                            {slot.end_time}
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                            <span className="text-xs text-stone-500">
                              {remaining}{" "}
                              {remaining === 1
                                ? "spot"
                                : "spots"}{" "}
                              remaining
                            </span>

                            {available ? (
                              <Link
                                href={`/sevas/${seva.id}/book?slotId=${slot.id}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
                              >
                                Select
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <span className="text-xs font-medium text-stone-400">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}
        </div>
      </section>

      {/* Temple link */}
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-amber-50 p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  Continue exploring
                </p>

                <h2 className="mt-2 font-display text-3xl font-semibold text-stone-900">
                  Discover more sacred experiences
                </h2>
              </div>

              <Link
                href="/temples"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Explore Temples
                <MapPin className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
