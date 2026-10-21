"use client";
import { useAdminTemple } from "@/components/admin/AdminWorkspace";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  IndianRupee,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useCreateReceipt,
  useReceipt,
  useReceipts,
} from "@/features/receipts/hooks";

import type {
  ReceiptCreate,
  ReceiptResponse,
} from "@/features/receipts/api";

import { useAuth } from "@/lib/auth/auth-context";
import { apiJson, getAccessToken } from "@/lib/api/client";

type SourceType = "DONATION" | "BOOKING";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function shortId(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return `${value.slice(0, 8)}…`;
}

function getSource(
  receipt: ReceiptResponse,
): SourceType | null {
  if (receipt.donation_id) {
    return "DONATION";
  }

  if (receipt.booking_id) {
    return "BOOKING";
  }

  return null;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof ReceiptText;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading receipts…
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const mounted = !authLoading;
  const [pdfError, setPdfError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);



  const [selectedTempleId] = useAdminTemple();

  const [search, setSearch] =
    useState("");

  const [receiptType, setReceiptType] =
    useState("");

  const [sourceFilter, setSourceFilter] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [
    selectedReceiptId,
    setSelectedReceiptId,
  ] = useState<string | null>(null);

  const [sourceType, setSourceType] =
    useState<SourceType>("DONATION");

  const [sourceId, setSourceId] =
    useState("");

  const [createReceiptType, setCreateReceiptType] =
    useState("DONATION");

  const [notes, setNotes] =
    useState("");

  const [createError, setCreateError] =
    useState("");



  const hasToken =
    mounted &&
    Boolean(getAccessToken());

  const templeId =
    user?.temple_id ??
    (selectedTempleId || undefined);

  const {
    data: receipts = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useReceipts(
    {
      templeId,
      receiptType:
        receiptType || undefined,
      limit: 100,
      offset: 0,
    },
    hasToken && !authLoading && Boolean(templeId),
  );

  const createMutation =
    useCreateReceipt();

  const selectedReceiptQuery =
    useReceipt(
      selectedReceiptId ?? undefined,
      hasToken,
    );

  const selectedReceipt =
    selectedReceiptQuery.data ??
    receipts.find(
      (receipt) =>
        receipt.id ===
        selectedReceiptId,
    ) ??
    null;

  const filteredReceipts =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return receipts.filter(
        (receipt) => {
          const source =
            getSource(receipt);

          if (
            sourceFilter &&
            source !== sourceFilter
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          return (
            receipt.receipt_number
              .toLowerCase()
              .includes(term) ||
            receipt.id
              .toLowerCase()
              .includes(term) ||
            (
              receipt.donation_id
                ?.toLowerCase()
                .includes(term) ??
              false
            ) ||
            (
              receipt.booking_id
                ?.toLowerCase()
                .includes(term) ??
              false
            ) ||
            receipt.receipt_type
              .toLowerCase()
              .includes(term) ||
            (
              receipt.notes
                ?.toLowerCase()
                .includes(term) ??
              false
            )
          );
        },
      );
    }, [
      receipts,
      search,
      sourceFilter,
    ]);

  const totalAmount =
    useMemo(
      () =>
        filteredReceipts.reduce(
          (sum, receipt) => {
            const amount =
              Number(receipt.amount);

            return Number.isFinite(amount)
              ? sum + amount
              : sum;
          },
          0,
        ),
      [filteredReceipts],
    );

  const donationCount =
    filteredReceipts.filter(
      (receipt) =>
        Boolean(receipt.donation_id),
    ).length;

  const bookingCount =
    filteredReceipts.filter(
      (receipt) =>
        Boolean(receipt.booking_id),
    ).length;

  const resetCreateForm =
    () => {
      setSourceType("DONATION");
      setSourceId("");
      setCreateReceiptType(
        "DONATION",
      );
      setNotes("");
      setCreateError("");
    };

  const closeCreate =
    () => {
      if (createMutation.isPending) {
        return;
      }

      setShowCreate(false);
      resetCreateForm();
    };

  const handleCreate =
    async () => {
      setCreateError("");

      if (!templeId) {
        setCreateError(
          "A temple must be selected before generating a receipt.",
        );
        return;
      }

      if (!sourceId.trim()) {
        setCreateError(
          `Enter the ${sourceType.toLowerCase()} ID.`,
        );
        return;
      }

      const payload: ReceiptCreate = {
        donation_id:
          sourceType === "DONATION"
            ? sourceId.trim()
            : null,

        booking_id:
          sourceType === "BOOKING"
            ? sourceId.trim()
            : null,

        receipt_type:
          createReceiptType.trim(),

        notes:
          notes.trim() || null,
      };

      try {
        const receipt =
          await createMutation.mutateAsync({
            templeId,
            data: payload,
          });

        setShowCreate(false);
        resetCreateForm();

        setSelectedReceiptId(
          receipt.id,
        );
      } catch (mutationError) {
        setCreateError(
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to generate the receipt.",
        );
      }
    };

  if (!mounted || authLoading) {
    return <PageLoading />;
  }

  if (!hasToken || !user) {
    return (
      <main className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Authentication required
              </h2>

              <p className="mt-1 text-sm text-amber-800">
                Please sign in to access receipts.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ReceiptText className="h-4 w-4" />
              Finance
              <span>/</span>
              Receipts
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Receipts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage donation and seva booking receipts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setShowCreate(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Generate Receipt
            </button>
          </div>
        </div>

        {/* Context */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Temple Context
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {templeId
                  ? "Receipts belong to the active temple shown above."
                  : "All available temple receipts"}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load receipts
                </h2>

                <p className="mt-1 text-sm text-red-800">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong while loading receipts."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Receipts"
            value={String(
              filteredReceipts.length,
            )}
            description="Receipts in current view"
            icon={ReceiptText}
          />

          <StatCard
            title="Receipt Value"
            value={formatAmount(
              String(totalAmount),
            )}
            description="Total recorded value"
            icon={IndianRupee}
          />

          <StatCard
            title="Donations"
            value={String(
              donationCount,
            )}
            description="Donation receipts"
            icon={FileText}
          />

          <StatCard
            title="Bookings"
            value={String(
              bookingCount,
            )}
            description="Seva booking receipts"
            icon={ClipboardList}
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input aria-label="Search receipt number, ID, donation or booking…"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search receipt number, ID, donation or booking…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="relative">
              <select aria-label="Receipt Type"
                value={receiptType}
                onChange={(event) =>
                  setReceiptType(
                    event.target.value,
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">
                  All receipt types
                </option>

                <option value="DONATION">
                  Donation
                </option>

                <option value="BOOKING">
                  Booking
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select aria-label="Source Filter"
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(
                    event.target.value,
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">
                  All sources
                </option>

                <option value="DONATION">
                  Donations
                </option>

                <option value="BOOKING">
                  Bookings
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />

            <p className="mt-3 text-sm text-slate-500">
              Loading receipts…
            </p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No receipts found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Generate a receipt from a completed donation
              or confirmed/completed booking.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Receipt
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Source
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Issued
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map(
                    (receipt) => {
                      const source =
                        getSource(receipt);

                      return (
                        <tr
                          key={receipt.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReceiptId(
                                  receipt.id,
                                )
                              }
                              className="text-left"
                            >
                              <p className="font-semibold text-slate-900 hover:underline">
                                {
                                  receipt.receipt_number
                                }
                              </p>

                              <p className="mt-1 font-mono text-xs text-slate-400">
                                {shortId(
                                  receipt.id,
                                )}
                              </p>
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  source ===
                                  "DONATION"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {source ===
                                "DONATION"
                                  ? "Donation"
                                  : "Booking"}
                              </span>

                              <span className="font-mono text-xs text-slate-400">
                                {shortId(
                                  receipt.donation_id ??
                                    receipt.booking_id,
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {
                              receipt.receipt_type
                            }
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatAmount(
                              receipt.amount,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarDays className="h-4 w-4 text-slate-400" />

                              {formatDate(
                                receipt.issued_at,
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReceiptId(
                                  receipt.id,
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Receipt Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-950/50 p-4">
            <div className="my-4 flex w-full max-w-md min-w-0 max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Generate Receipt
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Generate a receipt for an eligible source.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreate}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />

                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Receipt eligibility
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-800">
                        Donations must be completed.
                        Bookings must be confirmed or completed.
                        The receipt amount is taken directly from
                        the linked record.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Source
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        "DONATION",
                        "BOOKING",
                      ] as SourceType[]
                    ).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSourceType(
                            type,
                          );

                          setCreateReceiptType(
                            type,
                          );
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                          sourceType === type
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {type ===
                        "DONATION"
                          ? "Donation"
                          : "Booking"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="source-id"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {sourceType ===
                    "DONATION"
                      ? "Donation ID"
                      : "Booking ID"}
                  </label>

                  <input
                    id="source-id"
                    value={sourceId}
                    onChange={(event) =>
                      setSourceId(
                        event.target.value,
                      )
                    }
                    placeholder={`Enter ${sourceType.toLowerCase()} UUID`}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="receipt-type"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Receipt Type
                  </label>

                  <input
                    id="receipt-type"
                    value={createReceiptType}
                    onChange={(event) =>
                      setCreateReceiptType(
                        event.target.value,
                      )
                    }
                    maxLength={30}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="receipt-notes"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Notes
                    <span className="ml-1 font-normal text-slate-400">
                      optional
                    </span>
                  </label>

                  <textarea
                    id="receipt-notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Optional notes…"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />

                      <p className="text-sm text-red-800">
                        {createError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={closeCreate}
                    disabled={
                      createMutation.isPending
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={
                      createMutation.isPending ||
                      !templeId ||
                      !sourceId.trim() ||
                      !createReceiptType.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Generate Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Drawer */}
        {selectedReceiptId && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-x-hidden bg-slate-950/40">
            <div className="h-full w-full max-w-xl min-w-0 overflow-x-hidden overflow-y-auto bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Receipt Details
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {selectedReceipt
                      ?.receipt_number ??
                      "Receipt"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceiptId(
                      null,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedReceiptQuery.isLoading &&
              !selectedReceipt ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : selectedReceipt ? (
                <div className="space-y-6 p-6">
                  <div className="rounded-2xl bg-slate-950 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                          Receipt Number
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {
                            selectedReceipt.receipt_number
                          }
                        </p>
                      </div>

                      <ReceiptText className="h-7 w-7 text-slate-400" />
                    </div>

                    <div className="mt-8">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Amount
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        {formatAmount(
                          selectedReceipt.amount,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Receipt Type
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {
                          selectedReceipt.receipt_type
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Source
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedReceipt.donation_id
                          ? "Donation"
                          : "Booking"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Source Information
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Donation ID
                        </span>

                        <span className="max-w-[280px] truncate font-mono text-xs text-slate-700">
                          {selectedReceipt.donation_id ??
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Booking ID
                        </span>

                        <span className="max-w-[280px] truncate font-mono text-xs text-slate-700">
                          {selectedReceipt.booking_id ??
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Temple ID
                        </span>

                        <span className="max-w-[280px] truncate font-mono text-xs text-slate-700">
                          {
                            selectedReceipt.temple_id
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Issue Information
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          Issued At
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {formatDate(
                            selectedReceipt.issued_at,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-slate-500">
                          PDF
                        </span>

                        {selectedReceipt.pdf_path ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Not generated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedReceipt.notes && (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Notes
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {
                          selectedReceipt.notes
                        }
                      </p>
                    </div>
                  )}

                  {selectedReceipt.status === "VOID" ? <p className="text-red-700">Void receipt · payment refunded</p> : <button disabled={pdfBusy} onClick={async () => {
                    setPdfBusy(true); setPdfError("");
                    try {
                      if(!selectedReceipt.pdf_path) await apiJson(`/api/v1/receipts/${selectedReceipt.id}/pdf`, "POST", {});
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/receipts/${selectedReceipt.id}/pdf`, {headers:{Authorization:`Bearer ${getAccessToken()}`}});
                      if(!response.ok) {const error = await response.json(); throw new Error(error.detail ?? "Unable to open receipt");}
                      const url = URL.createObjectURL(await response.blob()); const a = document.createElement("a"); a.href=url; a.download=`${selectedReceipt.receipt_number}.pdf`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),60000);
                    } catch(error){setPdfError(error instanceof Error ? error.message : "Unable to open receipt");} finally {setPdfBusy(false);}
                  }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowDownToLine className="h-4 w-4"/>{pdfBusy ? "Preparing…" : "Download Receipt PDF"}</button>}
                  {pdfError && <p role="alert" className="text-sm text-red-700">{pdfError}</p>}
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      Unable to load this receipt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}














