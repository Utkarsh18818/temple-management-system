"use client";

import { TempleLink as Link } from "@/features/public/TempleContext";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Heart,
  Loader2,
  Receipt,
  Sparkles,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import { usePublicAuth } from "@/features/public/PublicAuthContext";

type DonationResponse = {
  id: string;
  temple_id: string;
  devotee_id: string | null;
  donation_number: string;
  amount: string;
  donation_type: string;
  purpose: string | null;
  donor_name: string;
  donor_phone: string | null;
  donor_email: string | null;
  pan_number: string | null;
  status: string;
  donated_at: string;
  notes: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "bg-[#e8f0ec] text-[#46715b]";

    case "PENDING":
      return "bg-[#fbf4df] text-[#8a6b2f]";

    case "CANCELLED":
    case "FAILED":
      return "bg-[#f8e9ec] text-[#a85e69]";

    default:
      return "bg-[#f4ede2] text-[#776b63]";
  }
}

export default function DonationsPage() {
  const {
    devotee,
    isAuthenticated,
    isLoading: authLoading,
  } = usePublicAuth();

  const donationsQuery = useQuery({
    queryKey: ["public", "account", "donations", devotee?.id],
    queryFn: () =>
      apiRequest<DonationResponse[]>(
        "/api/v1/public/account/donations?limit=100&offset=0",
      ),
    enabled:
      isAuthenticated && Boolean(devotee),
    staleTime: 30 * 1000,
    retry: 1,
  });

  if (authLoading) {
    return (
      <div className="min-h-[70vh] bg-[#fbf7ef]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2
            className="animate-spin text-[#9a6b1f]"
            size={28}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !devotee) {
    return (
      <div className="min-h-[70vh] bg-[#fbf7ef]">
        <div className="temple-container py-20">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#e7dfd4] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf4df] text-[#9a6b1f]">
              <User className="h-7 w-7" />
            </div>

            <h1 className="temple-heading mt-6 text-3xl text-[#332a25]">
              Sign in required
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#776b63]">
              Please sign in to view your donation history.
            </p>

            <Link
              href="/login?redirect=/account/donations"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#572630]"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const donations = donationsQuery.data ?? [];

  const completedDonations = donations.filter(
    (donation) =>
      donation.status.toUpperCase() === "COMPLETED",
  );

  const totalCompleted = completedDonations.reduce(
    (total, donation) =>
      total + Number(donation.amount),
    0,
  );

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#fbf7ef]">

      <section className="relative overflow-hidden bg-[#71333e] text-white">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(212,175,55,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />

        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#b76e79]/10 blur-3xl" />

        <div className="temple-container relative py-12 sm:py-16">

          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#e7c873]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to account
          </Link>

          <div className="mt-9 flex items-end justify-between gap-8">

            <div>
              <div className="temple-eyebrow text-[#e7c873]">
                <Heart className="h-4 w-4" />
                Your offerings
              </div>

              <h1 className="temple-heading mt-5 text-4xl text-white sm:text-5xl">
                My Donations
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                View the offerings you have made through TempleOS
                and keep your devotional journey in one place.
              </p>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/40 bg-white/5 lg:flex">
              <span className="font-serif text-5xl text-[#e7c873]">
                ॐ
              </span>
            </div>

          </div>

        </div>
      </section>

      <div className="temple-container py-8 sm:py-10">

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf4df] text-[#9a6b1f]">
                <Heart className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                  Completed offerings
                </p>

                <p className="mt-1 font-serif text-2xl font-semibold text-[#332a25]">
                  {completedDonations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#46715b]">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                  Total completed
                </p>

                <p className="mt-1 font-serif text-2xl font-semibold text-[#8a5a16]">
                  ₹{formatAmount(String(totalCompleted))}
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-10">

          <div className="mb-6">
            <p className="temple-eyebrow text-[#9a6b1f]">
              Donation history
            </p>

            <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
              Your offerings
            </h2>
          </div>

          {donationsQuery.isLoading ? (
            <div className="rounded-3xl border border-[#e7dfd4] bg-white p-16 text-center shadow-sm">
              <Loader2
                className="mx-auto animate-spin text-[#9a6b1f]"
                size={28}
              />

              <p className="mt-4 text-sm text-[#776b63]">
                Loading your donation history...
              </p>
            </div>
          ) : donationsQuery.isError ? (
            <div className="rounded-3xl border border-[#e7c7c7] bg-white p-10 text-center shadow-sm">
              <Sparkles className="mx-auto h-8 w-8 text-[#a85e69]" />

              <h2 className="mt-5 font-serif text-2xl font-semibold text-[#332a25]">
                Unable to load donations
              </h2>

              <p className="mt-2 text-sm text-[#776b63]">
                Please try again shortly.
              </p>

              <button
                type="button"
                onClick={() =>
                  donationsQuery.refetch()
                }
                className="mt-6 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : donations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf4df] text-[#9a6b1f]">
                <Heart className="h-7 w-7" />
              </div>

              <h2 className="mt-6 font-serif text-2xl font-semibold text-[#332a25]">
                No donations yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#776b63]">
                Your donation history will appear here after you
                make an offering through TempleOS.
              </p>

              <Link
                href="/donate"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white"
              >
                Make an offering
                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          ) : (
            <div className="space-y-4">

              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm transition hover:border-[#d4af37]/50 hover:shadow-md sm:p-7"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbf4df] text-[#9a6b1f]">
                        <Heart className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="font-semibold text-[#332a25]">
                            {donation.donation_number}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusClasses(
                              donation.status,
                            )}`}
                          >
                            {donation.status}
                          </span>

                        </div>

                        <p className="mt-2 text-sm capitalize text-[#776b63]">
                          {donation.donation_type}
                        </p>

                        {donation.purpose && (
                          <p className="mt-1 text-xs text-[#9a9088]">
                            Purpose: {donation.purpose}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="sm:text-right">
                      <p className="font-serif text-2xl font-semibold text-[#8a5a16]">
                        ₹{formatAmount(donation.amount)}
                      </p>

                      <p className="mt-1 text-xs text-[#9a9088]">
                        {formatDate(donation.donated_at)}
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#eee7de] pt-5">

                    <span className="flex items-center gap-2 text-xs text-[#776b63]">
                      <CalendarDays className="h-4 w-4 text-[#9a6b1f]" />
                      {formatDate(donation.donated_at)}
                    </span>

                    {donation.status.toUpperCase() ===
                      "COMPLETED" && (
                      <span className="flex items-center gap-2 text-xs text-[#46715b]">
                        <CheckCircle2 className="h-4 w-4" />
                        Offering completed
                      </span>
                    )}

                    <Link
                      href="/account/receipts"
                      className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#8a5a16]"
                    >
                      View receipts
                      <Receipt className="h-3.5 w-3.5" />
                    </Link>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      <section className="border-t border-[#e7dfd4] bg-[#f4ede2]">
        <div className="temple-container py-14 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#fbf7ef]">
            <Heart className="h-5 w-5 text-[#9a6b1f]" />
          </div>

          <h2 className="mt-5 font-serif text-2xl font-semibold text-[#332a25]">
            Every offering carries a prayer.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#776b63]">
            Continue your journey of devotion and service.
          </p>

        </div>
      </section>

    </div>
  );
}
