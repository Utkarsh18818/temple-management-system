"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownLeft,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";

import {
  useCreatePayment,
  usePayments,
  useUpdatePayment,
} from "@/features/payments/hooks";
import type {
  PaymentCreate,
  PaymentResponse,
} from "@/features/payments/api";

import { useAuth } from "@/lib/auth/auth-context";

type StatusFilter =
  | ""
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

type SourceType =
  | "donation"
  | "booking";

const STATUS_OPTIONS: StatusFilter[] = [
  "",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
];

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
  "OTHER",
];

const SOURCE_OPTIONS: {
  value: SourceType;
  label: string;
}[] = [
  {
    value: "donation",
    label: "Donation",
  },
  {
    value: "booking",
    label: "Seva Booking",
  },
];

function formatMoney(
  amount: unknown,
  currency = "INR",
) {
  const numeric =
    typeof amount === "number"
      ? amount
      : Number(amount ?? 0);

  if (!Number.isFinite(numeric)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    },
  ).format(numeric);
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function shortId(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  return value.slice(0, 8);
}

function statusClasses(
  status: string,
) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "FAILED":
      return "bg-red-50 text-red-700 ring-red-200";

    case "REFUNDED":
      return "bg-violet-50 text-violet-700 ring-violet-200";

    case "PENDING":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function StatusIcon({
  status,
}: {
  status: string;
}) {
  if (status === "SUCCESS") {
    return (
      <CheckCircle2 className="h-4 w-4" />
    );
  }

  if (status === "FAILED") {
    return (
      <XCircle className="h-4 w-4" />
    );
  }

  if (status === "REFUNDED") {
    return (
      <ArrowDownLeft className="h-4 w-4" />
    );
  }

  return (
    <Clock3 className="h-4 w-4" />
  );
}

function MethodIcon({
  method,
}: {
  method: string;
}) {
  if (method === "UPI") {
    return (
      <Smartphone className="h-4 w-4" />
    );
  }

  if (
    method === "CARD" ||
    method === "BANK_TRANSFER"
  ) {
    return (
      <CreditCard className="h-4 w-4" />
    );
  }

  return (
    <Banknote className="h-4 w-4" />
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading payments…
      </div>
    </div>
  );
}

function EmptyState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <CreditCard className="h-6 w-6 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No payments found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Try changing your filters or create a new
        payment transaction.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Clear filters
      </button>
    </div>
  );
}

export default function PaymentsPage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [mounted, setMounted] =
    useState(false);

  const [templeId, setTempleId] =
    useState("");

  const [status, setStatus] =
    useState<StatusFilter>("");

  const [method, setMethod] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponse | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showStatusModal, setShowStatusModal] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      user?.temple_id &&
      !templeId
    ) {
      setTempleId(
        String(user.temple_id),
      );
    }
  }, [
    user?.temple_id,
    templeId,
  ]);

  const hasToken = useMemo(() => {
    if (!mounted) {
      return false;
    }

    return Boolean(
      window.localStorage.getItem(
        "templeos_access_token",
      ) ||
        window.sessionStorage.getItem(
          "templeos_access_token",
        ),
    );
  }, [mounted]);

  const isSuperAdmin =
    !user?.temple_id;

  const {
    data: payments = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePayments(
    {
      templeId:
        templeId || undefined,
      status:
        status || undefined,
      paymentMethod:
        method || undefined,
      limit: 100,
      offset: 0,
    },
    mounted &&
      hasToken &&
      Boolean(templeId),
  );

  const createMutation =
    useCreatePayment();

  const updateMutation =
    useUpdatePayment();

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return payments;
      }

      return payments.filter(
        (payment) => {
          const haystack = [
            payment.id,
            payment.transaction_id,
            payment.donation_id,
            payment.booking_id,
            payment.gateway,
            payment.gateway_transaction_id,
            payment.payment_method,
            payment.status,
            payment.failure_reason,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query,
          );
        },
      );
    }, [
      payments,
      search,
    ]);

  const metrics =
    useMemo(() => {
      const total = payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount ?? 0),
        0,
      );

      const successful =
        payments.filter(
          (payment) =>
            payment.status ===
            "SUCCESS",
        );

      const successAmount =
        successful.reduce(
          (sum, payment) =>
            sum +
            Number(payment.amount ?? 0),
          0,
        );

      return {
        count: payments.length,
        total,
        successful:
          successful.length,
        successAmount,
        pending:
          payments.filter(
            (payment) =>
              payment.status ===
              "PENDING",
          ).length,
        failed:
          payments.filter(
            (payment) =>
              payment.status ===
              "FAILED",
          ).length,
      };
    }, [payments]);

  function resetFilters() {
    setStatus("");
    setMethod("");
    setSearch("");
  }

  function openDetails(
    payment: PaymentResponse,
  ) {
    setSelectedPayment(payment);
    setShowDetails(true);
  }

  function handleCreate(
    data: PaymentCreate,
  ) {
    if (!templeId) {
      return;
    }

    createMutation.mutate(
      {
        templeId,
        data,
      },
      {
        onSuccess: (
          payment,
        ) => {
          setShowCreate(false);
          setSelectedPayment(
            payment,
          );
          setShowDetails(true);
        },
      },
    );
  }

  function handleStatusUpdate(
    nextStatus: string,
    failureReason?: string,
  ) {
    if (!selectedPayment) {
      return;
    }

    updateMutation.mutate(
      {
        paymentId:
          selectedPayment.id,
        data: {
          status:
            nextStatus,
          failure_reason:
            failureReason ||
            undefined,
        },
      },
      {
        onSuccess: (
          payment,
        ) => {
          setSelectedPayment(
            payment,
          );
          setShowStatusModal(
            false,
        );
        },
      },
    );
  }

  if (
    authLoading ||
    !mounted
  ) {
    return <PageLoading />;
  }

  if (!hasToken || !user) {
    return (
      <main className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Authentication is required
          to view payments.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Finance
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Payments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track donation and seva
              booking payment transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && (
              <input
                value={templeId}
                onChange={(event) =>
                  setTempleId(
                    event.target.value,
                  )
                }
                placeholder="Temple ID"
                className="h-10 w-72 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            )}

            <button
              type="button"
              onClick={() =>
                refetch()
              }
              disabled={
                isFetching
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() =>
                setShowCreate(
                  true,
                )
              }
              disabled={!templeId}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Transactions"
            value={String(
              metrics.count,
            )}
            icon={
              <CreditCard className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Total Value"
            value={formatMoney(
              metrics.total,
            )}
            icon={
              <Banknote className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Successful"
            value={`${metrics.successful} · ${formatMoney(
              metrics.successAmount,
            )}`}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Pending"
            value={String(
              metrics.pending,
            )}
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Failed"
            value={String(
              metrics.failed,
            )}
            icon={
              <XCircle className="h-5 w-5" />
            }
          />
        </div>

        {/* Filters */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search transaction, gateway or ID…"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                All statuses
              </option>

              {STATUS_OPTIONS.filter(
                Boolean,
              ).map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>

            <select
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value,
                )
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                All payment methods
              </option>

              {PAYMENT_METHODS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.replace(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load payments
              </p>

              <p className="mt-1">
                {error instanceof Error
                  ? error.message
                  : "The payment service returned an error."}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Payment Transactions
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {filteredPayments.length}{" "}
                transaction
                {filteredPayments.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            {isFetching &&
              !isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading transactions…
            </div>
          ) : filteredPayments.length ===
            0 ? (
            <div className="p-5">
              <EmptyState
                onReset={
                  resetFilters
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">
                      Transaction
                    </th>
                    <th className="px-5 py-3">
                      Source
                    </th>
                    <th className="px-5 py-3">
                      Amount
                    </th>
                    <th className="px-5 py-3">
                      Method
                    </th>
                    <th className="px-5 py-3">
                      Gateway
                    </th>
                    <th className="px-5 py-3">
                      Status
                    </th>
                    <th className="px-5 py-3">
                      Paid At
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map(
                    (
                      payment,
                    ) => (
                      <tr
                        key={
                          payment.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold text-slate-900">
                            {
                              payment.transaction_id
                            }
                          </div>

                          <div className="mt-1 font-mono text-xs text-slate-400">
                            {shortId(
                              payment.id,
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {payment.donation_id ? (
                            <>
                              <div className="text-sm font-medium text-slate-800">
                                Donation
                              </div>

                              <div className="mt-1 font-mono text-xs text-slate-400">
                                {shortId(
                                  payment.donation_id,
                                )}
                              </div>
                            </>
                          ) : payment.booking_id ? (
                            <>
                              <div className="text-sm font-medium text-slate-800">
                                Seva Booking
                              </div>

                              <div className="mt-1 font-mono text-xs text-slate-400">
                                {shortId(
                                  payment.booking_id,
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Unlinked
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-bold text-slate-900">
                            {formatMoney(
                              payment.amount,
                              payment.currency,
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <MethodIcon
                              method={
                                payment.payment_method
                              }
                            />

                            {payment.payment_method.replace(
                              /_/g,
                              " ",
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm text-slate-700">
                            {payment.gateway ||
                              "—"}
                          </div>

                          <div className="mt-1 max-w-[170px] truncate font-mono text-xs text-slate-400">
                            {payment.gateway_transaction_id ||
                              "No gateway reference"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses(
                              payment.status,
                            )}`}
                          >
                            <StatusIcon
                              status={
                                payment.status
                              }
                            />

                            {
                              payment.status
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            payment.paid_at,
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDetails(
                                payment,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                            View
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreatePaymentModal
          onClose={() =>
            setShowCreate(
              false,
            )
          }
          onSubmit={
            handleCreate
          }
          isSubmitting={
            createMutation.isPending
          }
          error={
            createMutation.error
          }
        />
      )}

      {/* Details drawer */}
      {showDetails &&
        selectedPayment && (
          <PaymentDetailsDrawer
            payment={
              selectedPayment
            }
            onClose={() => {
              setShowDetails(
                false,
              );
              setSelectedPayment(
                null,
              );
            }}
            onStatusChange={() =>
              setShowStatusModal(
                true,
              )
            }
          />
        )}

      {/* Status modal */}
      {showStatusModal &&
        selectedPayment && (
          <StatusUpdateModal
            payment={
              selectedPayment
            }
            onClose={() =>
              setShowStatusModal(
                false,
              )
            }
            onSubmit={
              handleStatusUpdate
            }
            isSubmitting={
              updateMutation.isPending
            }
            error={
              updateMutation.error
            }
          />
        )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function CreatePaymentModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (
    data: PaymentCreate,
  ) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [source, setSource] =
    useState<SourceType>(
      "donation",
    );

  const [sourceId, setSourceId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [method, setMethod] =
    useState("UPI");

  const [currency, setCurrency] =
    useState("INR");

  const [gateway, setGateway] =
    useState("");

  const [
    gatewayTransactionId,
    setGatewayTransactionId,
  ] = useState("");

  const [validationError, setValidationError] =
    useState("");

  function submit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setValidationError("");

    if (!sourceId.trim()) {
      setValidationError(
        `Please enter the ${source} ID.`,
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setValidationError(
        "Please enter a valid payment amount.",
      );
      return;
    }

    const data: PaymentCreate = {
      amount:
        numericAmount.toFixed(2),
      currency:
        currency.trim() ||
        "INR",
      payment_method:
        method,
      gateway:
        gateway.trim() ||
        null,
      gateway_transaction_id:
        gatewayTransactionId.trim() ||
        null,
      ...(source ===
      "donation"
        ? {
            donation_id:
              sourceId.trim(),
            booking_id:
              null,
          }
        : {
            donation_id:
              null,
            booking_id:
              sourceId.trim(),
          }),
    };

    onSubmit(data);
  }

  const apiError =
    error instanceof Error
      ? error.message
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Record Payment
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Link the payment to one donation
              or seva booking.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-6"
        >
          {(validationError ||
            apiError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {validationError ||
                apiError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Payment source
            </label>

            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      setSource(
                        option.value,
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      source ===
                      option.value
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {source ===
              "donation"
                ? "Donation ID"
                : "Seva Booking ID"}
            </label>

            <input
              value={sourceId}
              onChange={(event) =>
                setSourceId(
                  event.target.value,
                )
              }
              placeholder="Enter UUID"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <p className="mt-1 text-xs text-slate-500">
              The backend validates that the
              payment amount exactly matches the
              linked record.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Amount
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                placeholder="501.00"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>

              <input
                value={currency}
                onChange={(event) =>
                  setCurrency(
                    event.target.value.toUpperCase(),
                  )
                }
                maxLength={10}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Payment method
            </label>

            <select
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {PAYMENT_METHODS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.replace(
                      /_/g,
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gateway
                <span className="ml-1 text-slate-400">
                  optional
                </span>
              </label>

              <input
                value={gateway}
                onChange={(event) =>
                  setGateway(
                    event.target.value,
                  )
                }
                placeholder="Razorpay / TEST"
                maxLength={50}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gateway reference
                <span className="ml-1 text-slate-400">
                  optional
                </span>
              </label>

              <input
                value={
                  gatewayTransactionId
                }
                onChange={(event) =>
                  setGatewayTransactionId(
                    event.target.value,
                  )
                }
                placeholder="Gateway transaction ID"
                maxLength={150}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={
                isSubmitting
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentDetailsDrawer({
  payment,
  onClose,
  onStatusChange,
}: {
  payment: PaymentResponse;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30">
      <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment details
            </p>

            <h2 className="mt-1 font-mono text-lg font-bold text-slate-950">
              {
                payment.transaction_id
              }
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-950">
              {formatMoney(
                payment.amount,
                payment.currency,
              )}
            </p>

            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statusClasses(
                  payment.status,
                )}`}
              >
                <StatusIcon
                  status={
                    payment.status
                  }
                />
                {
                  payment.status
                }
              </span>
            </div>
          </div>

          <DetailSection title="Transaction">
            <DetailRow
              label="Payment ID"
              value={
                <span className="font-mono text-xs">
                  {
                    payment.id
                  }
                </span>
              }
            />

            <DetailRow
              label="Transaction ID"
              value={
                <span className="font-mono">
                  {
                    payment.transaction_id
                  }
                </span>
              }
            />

            <DetailRow
              label="Temple ID"
              value={
                <span className="font-mono text-xs">
                  {
                    payment.temple_id
                  }
                </span>
              }
            />

            <DetailRow
              label="Created"
              value={formatDate(
                (
                  payment as PaymentResponse & {
                    created_at?: string;
                  }
                ).created_at,
              )}
            />
          </DetailSection>

          <DetailSection title="Payment source">
            <DetailRow
              label="Donation"
              value={
                payment.donation_id ? (
                  <span className="font-mono text-xs">
                    {
                      payment.donation_id
                    }
                  </span>
                ) : (
                  "—"
                )
              }
            />

            <DetailRow
              label="Seva booking"
              value={
                payment.booking_id ? (
                  <span className="font-mono text-xs">
                    {
                      payment.booking_id
                    }
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </DetailSection>

          <DetailSection title="Payment information">
            <DetailRow
              label="Method"
              value={
                payment.payment_method.replace(
                  /_/g,
                  " ",
                )
              }
            />

            <DetailRow
              label="Currency"
              value={
                payment.currency
              }
            />

            <DetailRow
              label="Gateway"
              value={
                payment.gateway ||
                "—"
              }
            />

            <DetailRow
              label="Gateway reference"
              value={
                payment.gateway_transaction_id ? (
                  <span className="font-mono text-xs">
                    {
                      payment.gateway_transaction_id
                    }
                  </span>
                ) : (
                  "—"
                )
              }
            />

            <DetailRow
              label="Paid at"
              value={formatDate(
                payment.paid_at,
              )}
            />
          </DetailSection>

          {payment.failure_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Failure reason
              </p>

              <p className="mt-1 text-sm text-red-800">
                {
                  payment.failure_reason
                }
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={
              onStatusChange
            }
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Update Payment Status
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-sm font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

function StatusUpdateModal({
  payment,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  payment: PaymentResponse;
  onClose: () => void;
  onSubmit: (
    status: string,
    failureReason?: string,
  ) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [
    nextStatus,
    setNextStatus,
  ] = useState(
    payment.status,
  );

  const [
    failureReason,
    setFailureReason,
  ] = useState(
    payment.failure_reason ||
      "",
  );

  const apiError =
    error instanceof Error
      ? error.message
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Update Payment Status
            </h2>

            <p className="mt-1 font-mono text-xs text-slate-500">
              {
                payment.transaction_id
              }
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {(apiError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={nextStatus}
              onChange={(event) =>
                setNextStatus(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="PENDING">
                PENDING
              </option>

              <option value="SUCCESS">
                SUCCESS
              </option>

              <option value="FAILED">
                FAILED
              </option>

              <option value="REFUNDED">
                REFUNDED
              </option>
            </select>
          </div>

          {nextStatus ===
            "FAILED" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Failure reason
              </label>

              <textarea
                value={
                  failureReason
                }
                onChange={(event) =>
                  setFailureReason(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Explain why the payment failed…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          {nextStatus ===
            "SUCCESS" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Marking this payment successful
              will cause the backend to complete
              the linked donation or confirm the
              linked booking.
            </div>
          )}

          {nextStatus ===
            "REFUNDED" && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
              The backend will mark the payment as
              refunded and clear its paid timestamp.
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={
                isSubmitting
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                onSubmit(
                  nextStatus,
                  failureReason,
                )
              }
              disabled={
                isSubmitting
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

