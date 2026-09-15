"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Loader2,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { usePublicBooking } from "@/features/public/hooks";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { isAuthenticated, isLoading: authLoading } =
    usePublicAuth();

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicBooking(bookingId);

  if (authLoading || isLoading) {
    return (
      <main className="min-h-[70vh] bg-stone-50">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-stone-600">
            <Loader2 className="h-5 w-5 animate-spin text-amber-700" />
            Loading booking...
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] bg-stone-50">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
          <div className="w-full rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <ShieldCheck className="mx-auto h-12 w-12 text-amber-700" />

            <h1 className="mt-5 font-serif text-3xl font-semibold text-stone-900">
              Sign in required
            </h1>

            <p className="mt-3 text-sm text-stone-600">
              Please sign in to view this booking.
            </p>

            <Link
              href={`/login?redirect=/account/bookings/${bookingId}`}
              className="mt-6 inline-flex rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !booking) {
    return (
      <main className="min-h-[70vh] bg-stone-50">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-red-700" />

            <h1 className="mt-5 text-xl font-semibold text-red-900">
              Booking not found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "This booking could not be found or you do not have access to it."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-stone-50">
      <section className="border-b border-stone-200 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
                Booking Details
              </p>

              <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                {booking.booking_number}
              </h1>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusClasses(
                booking.status,
              )}`}
            >
              {booking.status}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  Seva Booking
                </h2>

                <p className="text-sm text-stone-500">
                  Booking information and payment status
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-stone-100 sm:grid-cols-2">
            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Booking Date
              </p>

              <div className="mt-3 flex items-center gap-3 text-stone-900">
                <CalendarDays className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-semibold">
                  {formatDate(booking.booking_date)}
                </span>
              </div>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Quantity
              </p>

              <div className="mt-3 flex items-center gap-3 text-stone-900">
                <Clock3 className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-semibold">
                  {booking.quantity}
                </span>
              </div>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Amount
              </p>

              <div className="mt-3 flex items-center gap-3 text-stone-900">
                <IndianRupee className="h-5 w-5 text-amber-700" />
                <span className="text-lg font-bold">
                  {formatAmount(booking.amount)}
                </span>
              </div>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Payment Status
              </p>

              <div className="mt-3 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-700" />

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses(
                    booking.payment_status,
                  )}`}
                >
                  {booking.payment_status}
                </span>
              </div>
            </div>
          </div>

          {booking.special_request && (
            <div className="border-t border-stone-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Special Request
              </p>

              <p className="mt-3 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                {booking.special_request}
              </p>
            </div>
          )}

          <div className="border-t border-stone-200 bg-stone-50 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Payment
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Online payment will be available in the next phase.
                </p>
              </div>

              <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                Payment: {booking.payment_status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-amber-400 hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            All Bookings
          </Link>

          <Link
            href="/temples"
            className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            Book Another Seva
          </Link>
        </div>
      </section>
    </main>
  );
}