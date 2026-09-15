"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  usePublicSeva,
  usePublicSevaSlots,
} from "@/features/public/hooks";
import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { apiJson, apiRequest, ApiError } from "@/lib/api/client";

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayCheckoutOptions,
    ) => RazorpayCheckout;
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayPaymentResponse) => void;
};

type RazorpayCheckout = {
  open: () => void;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
  );

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => {
        resolve(Boolean(window.Razorpay));
      });

      existingScript.addEventListener("error", () => {
        resolve(false);
      });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

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

type PublicBookingResponse = {
  id: string;
  booking_number: string;
  temple_id: string;
  devotee_id: string;
  seva_id: string;
  slot_id: string | null;
  booking_date: string;
  quantity: number;
  amount: number | string;
  status: string;
  payment_status: string;
  special_request: string | null;
};

type PaymentOrderResponse = {
  payment_id: string;
  transaction_id: string;
  booking_id: string;
  amount: number | string;
  currency: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
};

type PaymentVerifyResponse = {
  payment_id: string;
  transaction_id: string;
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number | string;
  currency: string;
  payment_status: string;
  booking_status: string;
};

type PaymentReconcileResponse = {
  payment_id: string;
  transaction_id: string;
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number | string;
  currency: string;
  payment_status: string;
  booking_status: string;
  reconciled: boolean;
};

export default function BookingConfirmationPage() {
  const params = useParams<{
    templeId: string;
    sevaId: string;
  }>();

  const searchParams = useSearchParams();
  const router = useRouter();

  const templeId = params.templeId;
  const sevaId = params.sevaId;

  const selectedDate = searchParams.get("date") ?? "";
  const selectedSlotId = searchParams.get("slot") ?? "";

  const parsedQuantity = Number(
    searchParams.get("quantity") ?? "1",
  );

  const quantity =
    Number.isFinite(parsedQuantity) && parsedQuantity >= 1
      ? Math.floor(parsedQuantity)
      : 1;

  const {
    devotee,
    isAuthenticated,
    isLoading: authLoading,
  } = usePublicAuth();

  const [specialRequest, setSpecialRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] =
    useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] =
    useState(false);
  const [isReconcilingPayment, setIsReconcilingPayment] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] =
    useState<PublicBookingResponse | null>(null);

  const [paymentOrder, setPaymentOrder] =
    useState<PaymentOrderResponse | null>(null);

  const [paymentVerified, setPaymentVerified] =
    useState<PaymentVerifyResponse | null>(null);

  const sevaQuery = usePublicSeva(sevaId);

  const slotsQuery = usePublicSevaSlots({
    sevaId,
    slotDate: selectedDate,
  });

  const seva = sevaQuery.data;

  const selectedSlot = useMemo(
    () =>
      (slotsQuery.data ?? []).find(
        (slot) => slot.id === selectedSlotId,
      ),
    [slotsQuery.data, selectedSlotId],
  );

  const amount = useMemo(() => {
    if (!seva) {
      return 0;
    }

    return Number(seva.amount) * quantity;
  }, [seva, quantity]);

  useEffect(() => {
    void loadRazorpayScript();
  }, []);

  async function confirmBooking() {
    if (!seva || !devotee) {
      return;
    }

    if (!selectedDate) {
      setError(
        "Booking date is missing. Please return to slot selection.",
      );
      return;
    }

    if (seva.requires_slot && !selectedSlotId) {
      setError("Please select a valid time slot.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await apiJson<PublicBookingResponse>(
          "/api/v1/public/bookings",
          "POST",
          {
            seva_id: sevaId,
            slot_id: selectedSlotId || null,
            booking_date: selectedDate,
            quantity,
            special_request:
              specialRequest.trim() || null,
          },
        );

      setBooking(response);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to create your booking. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createPaymentOrder() {
    if (!booking) {
      return;
    }

    setError(null);
    setIsCreatingPayment(true);

    try {
      const response =
        await apiRequest<PaymentOrderResponse>(
          `/api/v1/public/payments/booking/${booking.id}/order`,
          {
            method: "POST",
          },
        );

      setPaymentOrder(response);

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection and try again.",
        );
      }

      const checkout = new window.Razorpay({
        key: response.razorpay_key_id,
        amount: Math.round(
          Number(response.amount) * 100,
        ),
        currency: response.currency,
        name: "TempleOS",
        description: `${seva?.name ?? "Temple Seva"} — ${booking.booking_number}`,
        order_id: response.razorpay_order_id,
        prefill: {
          name: `${devotee?.first_name ?? ""} ${
            devotee?.last_name ?? ""
          }`.trim(),
          email: devotee?.email ?? undefined,
          contact: devotee?.phone ?? undefined,
        },
        theme: {
          color: "#292524",
        },
        modal: {
          ondismiss: () => {
            setIsCreatingPayment(false);
            setError(
              "Payment window was closed. Your booking is still pending payment.",
            );
          },
        },
        handler: (paymentResponse: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          void verifyPayment(paymentResponse);
        },
      });

      setIsCreatingPayment(false);
      checkout.open();
    } catch (requestError) {
      setIsCreatingPayment(false);

      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to start the payment. Please try again.",
        );
      }
    }
  }

  async function reconcilePayment() {
    if (!booking) {
      return null;
    }

    setIsReconcilingPayment(true);

    try {
      const response =
        await apiRequest<PaymentReconcileResponse>(
          `/api/v1/public/payments/booking/${booking.id}/reconcile`,
          {
            method: "POST",
          },
        );

      if (response.reconciled) {
        setBooking((currentBooking) =>
          currentBooking
            ? {
                ...currentBooking,
                status: response.booking_status,
                payment_status: response.payment_status,
              }
            : currentBooking,
        );

        setPaymentVerified({
          payment_id: response.payment_id,
          transaction_id: response.transaction_id,
          booking_id: response.booking_id,
          razorpay_order_id:
            response.razorpay_order_id,
          razorpay_payment_id:
            response.razorpay_payment_id,
          amount: response.amount,
          currency: response.currency,
          payment_status: response.payment_status,
          booking_status: response.booking_status,
        });
      }

      return response;
    } catch (requestError) {
      return null;
    } finally {
      setIsReconcilingPayment(false);
    }
  }

  async function verifyPayment(
    paymentResponse: RazorpayPaymentResponse,
  ) {
    if (!booking) {
      return;
    }

    setError(null);
    setIsVerifyingPayment(true);

    try {
      const response =
        await apiJson<PaymentVerifyResponse>(
          "/api/v1/public/payments/verify",
          "POST",
          {
            booking_id: booking.id,
            razorpay_order_id:
              paymentResponse.razorpay_order_id,
            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,
            razorpay_signature:
              paymentResponse.razorpay_signature,
          },
        );

      setPaymentVerified(response);

      setBooking((currentBooking) =>
        currentBooking
          ? {
              ...currentBooking,
              status: response.booking_status,
              payment_status: response.payment_status,
            }
          : currentBooking,
      );
    } catch (requestError) {
      /*
       * The payment may have been captured successfully at
       * Razorpay even when browser-side signature verification
       * fails because of a network/API interruption.
       *
       * Reconcile against Razorpay server-side before showing
       * the user a failure message.
       */
      const reconciliation = await reconcilePayment();

      if (reconciliation?.reconciled) {
        setError(null);
        return;
      }

      if (requestError instanceof ApiError) {
        setError(
          `Payment verification could not be completed automatically: ${requestError.message}`,
        );
      } else {
        setError(
          "Payment verification could not be completed automatically. Your booking remains pending until the payment is confirmed.",
        );
      }
    } finally {
      setIsVerifyingPayment(false);
    }
  }

  if (authLoading || sevaQuery.isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-stone-500"
        />
      </div>
    );
  }

  if (!isAuthenticated || !devotee) {
    const redirect = encodeURIComponent(
      `/temples/${templeId}/sevas/${sevaId}/book/confirm?date=${selectedDate}${
        selectedSlotId
          ? `&slot=${selectedSlotId}`
          : ""
      }&quantity=${quantity}`,
    );

    router.replace(`/login?redirect=${redirect}`);

    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-stone-500"
        />
      </div>
    );
  }

  if (sevaQuery.isError || !seva) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-semibold text-red-900">
            Unable to load this seva
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Please return to the seva directory and try again.
          </p>

          <Link
            href={`/temples/${templeId}/sevas`}
            className="mt-6 inline-flex rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Sevas
          </Link>
        </div>
      </div>
    );
  }

  if (booking) {
    const isPaid =
      paymentVerified?.payment_status === "SUCCESS" ||
      booking.payment_status === "PAID";

    return (
      <div className="min-h-[calc(100vh-140px)] bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                isPaid
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 size={34} />
              ) : (
                <ShieldCheck size={34} />
              )}
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {isPaid
                ? "Payment successful"
                : "Booking created"}
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-stone-900">
              {isPaid
                ? "Your booking is confirmed"
                : "Your booking is ready"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-500">
              {isPaid
                ? "Your payment has been verified and your seva booking is confirmed."
                : "Your booking has been created successfully. Complete the payment to confirm your booking."}
            </p>

            <div className="mt-8 rounded-2xl bg-stone-50 p-5 text-left">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-stone-500">
                  Booking number
                </span>

                <span className="font-semibold text-stone-900">
                  {booking.booking_number}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-sm text-stone-500">
                  Amount
                </span>

                <span className="font-semibold text-stone-900">
                  ₹
                  {Number(
                    booking.amount,
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-sm text-stone-500">
                  Payment status
                </span>

                <span
                  className={`font-medium ${
                    isPaid
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {isPaid
                    ? "PAID"
                    : booking.payment_status}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-sm text-stone-500">
                  Booking status
                </span>

                <span
                  className={`font-medium ${
                    isPaid
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {isPaid
                    ? "CONFIRMED"
                    : booking.status}
                </span>
              </div>

              {paymentVerified?.razorpay_payment_id && (
                <div className="mt-4 flex justify-between gap-4">
                  <span className="text-sm text-stone-500">
                    Payment ID
                  </span>

                  <span className="break-all text-right text-sm font-medium text-stone-700">
                    {paymentVerified.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>

            {!isPaid && (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={
                    isCreatingPayment ||
                    isVerifyingPayment ||
                    isReconcilingPayment
                  }
                  onClick={createPaymentOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingPayment ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Opening secure payment...
                    </>
                  ) : isVerifyingPayment ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Verifying payment...
                    </>
                  ) : isReconcilingPayment ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Checking payment status...
                    </>
                  ) : (
                    `Pay ₹${Number(
                      booking.amount,
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  )}
                </button>

                <p className="mt-3 text-xs text-stone-400">
                  You will be redirected to Razorpay's secure
                  payment window.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            )}

            {paymentOrder && !isPaid && !error && (
              <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-stone-400">
                  Payment reference
                </p>

                <p className="mt-1 break-all text-sm font-medium text-stone-700">
                  {paymentOrder.transaction_id}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/account/bookings"
                className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800"
              >
                View my bookings
              </Link>

              <Link
                href={`/temples/${templeId}/sevas`}
                className="rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:border-stone-400"
              >
                Browse more sevas
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const invalidSlot =
    Boolean(selectedSlotId) &&
    !slotsQuery.isLoading &&
    !selectedSlot;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/temples/${templeId}/sevas/${sevaId}/book?date=${selectedDate}${
            selectedSlotId
              ? `&slot=${selectedSlotId}`
              : ""
          }&quantity=${quantity}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={17} />
          Back to booking
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Final step
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Confirm your booking
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Review your seva, date, time and devotee details
            before creating the booking.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-stone-900">
                    Booking details
                  </h2>

                  <p className="text-sm text-stone-500">
                    Your selected seva appointment.
                  </p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-stone-100 rounded-2xl border border-stone-100">
                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm text-stone-500">
                    Seva
                  </span>

                  <span className="text-right text-sm font-semibold text-stone-900">
                    {seva.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm text-stone-500">
                    Date
                  </span>

                  <span className="text-right text-sm font-semibold text-stone-900">
                    {formatDate(selectedDate)}
                  </span>
                </div>

                {selectedSlot && (
                  <div className="flex items-center justify-between gap-4 p-4">
                    <span className="flex items-center gap-2 text-sm text-stone-500">
                      <Clock3 size={15} />
                      Time
                    </span>

                    <span className="text-sm font-semibold text-stone-900">
                      {formatTime(selectedSlot.start_time)}
                      {selectedSlot.end_time
                        ? ` – ${formatTime(selectedSlot.end_time)}`
                        : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm text-stone-500">
                    Quantity
                  </span>

                  <span className="text-sm font-semibold text-stone-900">
                    {quantity}
                  </span>
                </div>
              </div>

              {invalidSlot && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  The selected slot is no longer available.
                  Please return to the booking page and choose
                  another slot.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <User size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-stone-900">
                    Devotee details
                  </h2>

                  <p className="text-sm text-stone-500">
                    This booking will be associated with your
                    account.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {devotee.first_name}{" "}
                    {devotee.last_name ?? ""}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-stone-800">
                    {devotee.email ?? "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {devotee.phone ?? "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-semibold text-stone-900">
                Special request
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Optional information for the temple team.
              </p>

              <textarea
                value={specialRequest}
                onChange={(event) =>
                  setSpecialRequest(event.target.value)
                }
                rows={4}
                maxLength={1000}
                placeholder="Add any special request..."
                className="mt-5 w-full resize-none rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500"
              />

              <p className="mt-2 text-right text-xs text-stone-400">
                {specialRequest.length}/1000
              </p>
            </section>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Order summary
              </p>

              <h2 className="mt-3 text-xl font-semibold text-stone-900">
                {seva.name}
              </h2>

              <div className="mt-6 space-y-4 border-t border-stone-100 pt-5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    Price
                  </span>

                  <span className="font-medium text-stone-800">
                    ₹
                    {Number(seva.amount).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    Quantity
                  </span>

                  <span className="font-medium text-stone-800">
                    × {quantity}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-stone-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-medium text-stone-500">
                    Total
                  </span>

                  <span className="text-2xl font-semibold text-stone-900">
                    ₹
                    {amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  isSubmitting ||
                  invalidSlot ||
                  (seva.requires_slot && !selectedSlot)
                }
                onClick={confirmBooking}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Creating booking...
                  </>
                ) : (
                  "Confirm booking"
                )}
              </button>

              <div className="mt-5 flex gap-3 rounded-2xl bg-stone-50 p-4">
                <ShieldCheck
                  size={19}
                  className="shrink-0 text-stone-600"
                />

                <p className="text-xs leading-5 text-stone-500">
                  Your devotee identity is securely determined
                  by your authenticated account. The booking
                  amount is validated by the server before
                  payment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

