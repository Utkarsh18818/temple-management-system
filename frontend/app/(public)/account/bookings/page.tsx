"use client";

import { TempleLink as Link } from "@/features/public/TempleContext";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  IndianRupee,
  Loader2,
  ReceiptText,
  Sparkles,
} from "lucide-react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { usePublicBookings } from "@/features/public/hooks";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "CONFIRMED" ||
    normalized === "COMPLETED"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "REJECTED"
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default function AccountBookingsPage() {
  const { devotee, isAuthenticated, isLoading: authLoading } =
    usePublicAuth();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicBookings({
    page: 1,
    limit: 50,
  });

  if (authLoading) {
    return (
      <main className="min-h-[70vh] bg-stone-50">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <Loader2 className="h-7 w-7 animate-spin text-amber-700" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] bg-stone-50">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
          <div className="w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <ReceiptText className="h-8 w-8" />
            </div>

            <h1 className="mt-6 font-serif text-3xl font-semibold text-stone-900">
              Your Bookings
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
              Sign in to view your seva bookings, booking status,
              dates, quantities, and payment information.
            </p>

            <Link
              href="/login?redirect=/account/bookings"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-stone-50">
      <section className="border-b border-stone-200 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Devotee Account
              </div>

              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Your Bookings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                {devotee?.first_name
                  ? `Namaste, ${devotee.first_name}. Here are your seva bookings.`
                  : "View and manage your seva bookings."}
              </p>
            </div>

            <Link
              href="/temples"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-amber-400 hover:text-amber-800"
            >
              Book a Seva
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-stone-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-700" />
              Loading your bookings...
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-red-900">
              Unable to load bookings
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Something went wrong while loading your bookings."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        ) : !data?.items?.length ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <CalendarDays className="h-8 w-8" />
            </div>

            <h2 className="mt-6 font-serif text-2xl font-semibold text-stone-900">
              No bookings yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
              You have not made any seva bookings yet. Explore
              temples and choose a seva to get started.
            </p>

            <Link
              href="/temples"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Explore Temples
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Booking History
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {data.total}{" "}
                  {data.total === 1 ? "booking" : "bookings"}
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              {data.items.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/account/bookings/${booking.id}`}
                  className="group block rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:p-7"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-stone-900">
                          {booking.booking_number}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                            booking.status,
                          )}`}
                        >
                          {booking.status}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                            booking.payment_status,
                          )}`}
                        >
                          Payment: {booking.payment_status}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-stone-900">
                        Seva Booking
                      </h3>

                      <div className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-amber-700" />
                          {formatDate(booking.booking_date)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-amber-700" />
                          Quantity: {booking.quantity}
                        </div>

                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-amber-700" />
                          {formatAmount(booking.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-stone-100 pt-5 lg:border-t-0 lg:pt-0">
                      <span className="text-sm font-semibold text-amber-800">
                        View Details
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition group-hover:bg-amber-100">
                        <ChevronRight className="h-5 w-5 text-stone-600 group-hover:text-amber-800" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
