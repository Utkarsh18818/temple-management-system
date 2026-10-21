"use client";

import { Suspense, useEffect, useState } from "react";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { useSearchParams } from "next/navigation";

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const donationId = searchParams.get("donation_id");
  const donationNumber = searchParams.get("donation_number");
  const paymentId = searchParams.get("payment_id");

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-stone-600">Loading donation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">
          ✓
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Donation Successful
        </p>

        <h1 className="font-serif text-4xl font-semibold text-stone-900">
          Thank you for your contribution
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-stone-600">
          Your donation has been successfully received. Please keep the
          transaction details below for your records.
        </p>

        <div className="mt-8 space-y-3 rounded-2xl bg-stone-50 p-6 text-left">
          {donationNumber && (
            <div className="flex justify-between gap-4 border-b border-stone-200 pb-3">
              <span className="text-stone-500">Donation Number</span>
              <span className="font-medium text-stone-900">
                {donationNumber}
              </span>
            </div>
          )}

          {donationId && (
            <div className="flex justify-between gap-4 border-b border-stone-200 pb-3">
              <span className="text-stone-500">Donation ID</span>
              <span className="break-all text-right font-medium text-stone-900">
                {donationId}
              </span>
            </div>
          )}

          {paymentId && (
            <div className="flex justify-between gap-4">
              <span className="text-stone-500">Payment ID</span>
              <span className="break-all text-right font-medium text-stone-900">
                {paymentId}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-800"
          >
            Back to Home
          </Link>

          <Link
            href="/donate"
            className="rounded-xl border border-stone-300 px-6 py-3 font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Make Another Donation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <p className="text-stone-600">Loading donation details...</p>
          </div>
        </div>
      }
    >
      <DonationSuccessContent />
    </Suspense>
  );
}
