"use client";

import { useState } from "react";
import { TempleLink as Link } from "@/features/public/TempleContext";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Heart,
  Loader2,
  Receipt as ReceiptIcon,
  Sparkles,
  User,
} from "lucide-react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";

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

function getReceiptTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

async function openReceiptPdf(receiptId: string) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(
          "templeos_access_token",
        )
      : null;

  if (!token) {
    throw new Error("Please sign in again to view your receipt.");
  }

  const response = await fetch(
    `${apiUrl}/api/v1/public/account/receipts/${receiptId}/pdf`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    let message =
      "Unable to open the receipt.";

    try {
      const body = await response.json();

      if (
        body &&
        typeof body.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error(
      "The receipt PDF is empty.",
    );
  }

  const blobUrl =
    window.URL.createObjectURL(blob);

  const popup = window.open(
    blobUrl,
    "_blank",
    "noopener,noreferrer",
  );

  if (!popup) {
    const link =
      document.createElement("a");

    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

type ReceiptItem = {
  status?: string;
  id: string;
  donation_id: string | null;
  booking_id: string | null;
  receipt_number: string;
  amount: string;
  receipt_type: string;
  issued_at: string;
  pdf_path: string | null;
  notes: string | null;
};

function ReceiptCard({
  receipt,
}: {
  receipt: ReceiptItem;
}) {
  const [isOpening, setIsOpening] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleViewReceipt() {
    setIsOpening(true);
    setError(null);

    try {
      await openReceiptPdf(receipt.id);
    } catch (viewError) {
      setError(
        viewError instanceof Error
          ? viewError.message
          : "Unable to open the receipt.",
      );
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm transition hover:border-[#d4af37]/50 hover:shadow-md sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbf4df] text-[#9a6b1f]">
            <ReceiptIcon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold text-[#332a25]">
                {receipt.receipt_number}
              </h3>

              <span className="rounded-full bg-[#e8f0ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#46715b]">
                {getReceiptTypeLabel(
                  receipt.receipt_type,
                )}
              </span>
            </div>

            <p className="mt-2 text-sm text-[#776b63]">
              Issued on{" "}
              {formatDate(receipt.issued_at)}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="font-serif text-2xl font-semibold text-[#8a5a16]">
            ₹{formatAmount(receipt.amount)}
          </p>

          <p className="mt-1 text-xs text-[#9a9088]">
            {receipt.receipt_type}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#eee7de] pt-5">
        <span className="flex items-center gap-2 text-xs text-[#776b63]">
          <CalendarDays className="h-4 w-4 text-[#9a6b1f]" />

          {formatDate(receipt.issued_at)}
        </span>

        {receipt.donation_id && (
          <span className="text-xs text-[#9a9088]">
            Donation receipt
          </span>
        )}

        {receipt.booking_id && (
          <span className="text-xs text-[#9a9088]">
            Seva booking receipt
          </span>
        )}

        {receipt.status === "VOID" && <p className="text-sm font-semibold text-red-700">Void · payment refunded</p>}
        {receipt.pdf_path && receipt.status !== "VOID" && (
          <button
            type="button"
            onClick={handleViewReceipt}
            disabled={isOpening}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#71333e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#572630] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOpening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}

            {isOpening
              ? "Opening..."
              : "View receipt"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#e7c7c7] bg-[#fff7f7] px-4 py-3">
          <p className="text-xs leading-5 text-[#8a414a]">
            {error}
          </p>
        </div>
      )}

      {receipt.notes && (
        <div className="mt-4 rounded-2xl bg-[#fbf7ef] px-4 py-3">
          <p className="text-xs leading-5 text-[#776b63]">
            {receipt.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ReceiptsPage() {
  const {
    devotee,
    isAuthenticated,
    isLoading: authLoading,
  } = usePublicAuth();

  const receiptsQuery = useQuery({
    queryKey: ["public", "receipts", devotee?.id],
    queryFn: () => apiRequest<ReceiptItem[]>("/api/v1/public/account/receipts?limit=100"),
    enabled: isAuthenticated && Boolean(devotee),
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
              Please sign in to access your
              temple receipts.
            </p>

            <Link
              href="/login?redirect=/account/receipts"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#572630]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const receipts = receiptsQuery.data ?? [];

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
                <FileText className="h-4 w-4" />
                Your documents
              </div>

              <h1 className="temple-heading mt-5 text-4xl text-white sm:text-5xl">
                My Receipts
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Access receipts generated for
                your donations and seva-related
                offerings.
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
        <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf4df] text-[#9a6b1f]">
              <ReceiptIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                Receipt archive
              </p>

              <p className="mt-1 font-serif text-2xl font-semibold text-[#332a25]">
                {receipts.length}{" "}
                {receipts.length === 1
                  ? "receipt"
                  : "receipts"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-6">
            <p className="temple-eyebrow text-[#9a6b1f]">
              Your records
            </p>

            <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
              Receipts
            </h2>
          </div>

          {receiptsQuery.isLoading ? (
            <div className="rounded-3xl border border-[#e7dfd4] bg-white p-16 text-center shadow-sm">
              <Loader2
                className="mx-auto animate-spin text-[#9a6b1f]"
                size={28}
              />

              <p className="mt-4 text-sm text-[#776b63]">
                Loading your receipts...
              </p>
            </div>
          ) : receiptsQuery.isError ? (
            <div className="rounded-3xl border border-[#e7c7c7] bg-white p-10 text-center shadow-sm">
              <Sparkles className="mx-auto h-8 w-8 text-[#a85e69]" />

              <h2 className="mt-5 font-serif text-2xl font-semibold text-[#332a25]">
                Unable to load receipts
              </h2>

              <p className="mt-2 text-sm text-[#776b63]">
                Please try again shortly.
              </p>

              <button
                type="button"
                onClick={() =>
                  receiptsQuery.refetch()
                }
                className="mt-6 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : receipts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf4df] text-[#9a6b1f]">
                <FileText className="h-7 w-7" />
              </div>

              <h2 className="mt-6 font-serif text-2xl font-semibold text-[#332a25]">
                No receipts yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#776b63]">
                Receipts will appear here when
                completed donations or other
                eligible offerings generate them.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/donate"
                  className="inline-flex items-center gap-2 rounded-full bg-[#71333e] px-6 py-3 text-sm font-semibold text-white"
                >
                  Make an offering
                  <Heart className="h-4 w-4" />
                </Link>

                <Link
                  href="/account/bookings"
                  className="inline-flex items-center gap-2 rounded-full border border-[#ddd3c7] bg-white px-6 py-3 text-sm font-semibold text-[#66594f]"
                >
                  View bookings
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="border-t border-[#e7dfd4] bg-[#f4ede2]">
        <div className="temple-container py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#fbf7ef]">
            <span className="font-serif text-2xl text-[#9a6b1f]">
              ॐ
            </span>
          </div>

          <h2 className="mt-5 font-serif text-2xl font-semibold text-[#332a25]">
            Your devotion, preserved.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#776b63]">
            Keep your temple records safe and
            accessible through your TempleOS
            account.
          </p>
        </div>
      </section>
    </div>
  );
}
