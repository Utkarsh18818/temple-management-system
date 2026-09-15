"use client";

import Link from "next/link";
import { CheckCircle2, Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();

  const donationId =
    searchParams.get("donation");

  const paymentId =
    searchParams.get("payment");

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Payment Successful
          </p>

          <h1 className="font-serif text-3xl font-semibold text-stone-900 md:text-4xl">
            Thank You for Your Donation
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-stone-600">
            Your donation has been successfully
            submitted. May your seva bring blessings to
            you and your family.
          </p>

          {donationId && (
            <div className="mt-8 rounded-xl bg-stone-50 p-4 text-left">
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Heart
                  className="h-4 w-4 text-amber-700"
                  fill="currentColor"
                />
                <span className="font-medium">
                  Donation recorded successfully
                </span>
              </div>

              <p className="mt-3 break-all text-xs text-stone-500">
                Donation ID: {donationId}
              </p>

              {paymentId && (
                <p className="mt-1 break-all text-xs text-stone-500">
                  Payment ID: {paymentId}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Back to Home
            </Link>

            <Link
              href="/donate"
              className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Make Another Donation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
