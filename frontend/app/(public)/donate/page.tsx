"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { useTemplePortal } from "@/features/public/TempleContext";
import { Heart, Loader2, ShieldCheck } from "lucide-react";

import {
  createPublicDonation,
  verifyPublicDonation,
} from "@/features/public/donations";
import { usePublicTemples } from "@/features/public/hooks";

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

const QUICK_AMOUNTS = [101, 501, 1001, 5001];

function DonateForm() {
  const router = useRouter();
  const portal = useTemplePortal();
  const { data: temples, isLoading: templesLoading } = usePublicTemples();

  const templeId = portal.templeId;
  const setTempleId = (id:string) => { if(id) router.replace(`/donate?temple_id=${id}`); };
  const [amount, setAmount] = useState("101");
  const [donationType, setDonationType] = useState("GENERAL");
  const [purpose, setPurpose] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeTemple = useMemo(
    () => temples?.find((temple) => temple.id === templeId),
    [temples, templeId],
  );


  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!templeId) {
      setError("Please select a temple.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    if (!donorName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection and try again.",
        );
      }

      const response = await createPublicDonation({
        temple_id: templeId,
        amount: numericAmount,
        donation_type: donationType,
        purpose: purpose.trim() || undefined,
        donor_name: donorName.trim(),
        donor_phone: donorPhone.trim() || undefined,
        donor_email: donorEmail.trim() || undefined,
        pan_number: panNumber.trim() || undefined,
        donated_at: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      const razorpay = new window.Razorpay({
        key: response.razorpay_key_id,
        amount: Math.round(Number(response.amount) * 100),
        currency: response.currency,
        name: activeTemple?.name || "TempleOS",
        description: `${donationType} Donation`,
        order_id: response.razorpay_order_id,

        prefill: {
          name: donorName.trim(),
          email: donorEmail.trim() || undefined,
          contact: donorPhone.trim() || undefined,
        },

        theme: {
          color: "#92400e",
        },

        handler: async (paymentResponse: RazorpayPaymentResponse) => {
          try {
            setError("");

            const verification = await verifyPublicDonation({
              donation_id: response.donation_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (
              verification.status !== "success" ||
              verification.donation_status !== "COMPLETED" ||
              verification.payment_status !== "SUCCESS"
            ) {
              throw new Error(
                "Payment was received, but verification could not be completed.",
              );
            }

            router.push(
              `/donate/success?donation_id=${encodeURIComponent(
                response.donation_id,
              )}&donation_number=${encodeURIComponent(
                response.donation_number,
              )}&payment_id=${encodeURIComponent(
                paymentResponse.razorpay_payment_id,
              )}`,
            );
          } catch (verificationError) {
            console.error(
              "Donation verification failed:",
              verificationError,
            );

            setError(
              verificationError instanceof Error
                ? verificationError.message
                : "Payment verification failed. Please contact the temple.",
            );

            setIsSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      });

      razorpay.open();
    } catch (submitError) {
      console.error("Donation submission failed:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to start the donation. Please try again.",
      );

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50">
      <PublicPageHero eyebrow="SEVA THROUGH GIVING" title="A grateful heart." accent="A meaningful offering." description="Choose the temple you wish to support and make your offering through our secure donation portal." />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="temple"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Temple
              </label>

              <select
                id="temple"
                value={templeId}
                onChange={(event) => setTempleId(event.target.value)}
                disabled={templesLoading || isSubmitting}
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">
                  {templesLoading ? "Loading temples..." : "Select a temple"}
                </option>

                {temples?.map((temple) => (
                  <option key={temple.id} value={temple.id}>
                    {temple.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Donation Amount
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => handleQuickAmount(quickAmount)}
                    disabled={isSubmitting}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      amount === String(quickAmount)
                        ? "border-amber-700 bg-amber-700 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-amber-600 hover:text-amber-700"
                    }`}
                  >
                    ₹{quickAmount.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="donationType"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Donation Type
              </label>

              <select
                id="donationType"
                value={donationType}
                onChange={(event) => setDonationType(event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              >
                <option value="GENERAL">General Donation</option>
                <option value="ANNADAN">Annadan</option>
                <option value="TEMPLE_MAINTENANCE">
                  Temple Maintenance
                </option>
                <option value="FESTIVAL">Festival</option>
                <option value="DEITY">Deity / Puja</option>
                <option value="EDUCATION">Education</option>
                <option value="COMMUNITY">Community Service</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="purpose"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Purpose{" "}
                <span className="font-normal text-stone-400">
                  (Optional)
                </span>
              </label>

              <input
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. Temple renovation"
                className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="border-t border-stone-200 pt-6">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Donor Details
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="donorName"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Full Name *
                  </label>

                  <input
                    id="donorName"
                    required
                    value={donorName}
                    onChange={(event) => setDonorName(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="donorPhone"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Phone
                  </label>

                  <input
                    id="donorPhone"
                    type="tel"
                    value={donorPhone}
                    onChange={(event) => setDonorPhone(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="donorEmail"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Email
                  </label>

                  <input
                    id="donorEmail"
                    type="email"
                    value={donorEmail}
                    onChange={(event) => setDonorEmail(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Email address"
                    className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="panNumber"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    PAN
                  </label>

                  <input
                    id="panNumber"
                    value={panNumber}
                    onChange={(event) =>
                      setPanNumber(event.target.value.toUpperCase())
                    }
                    disabled={isSubmitting}
                    placeholder="PAN number"
                    maxLength={10}
                    className="w-full rounded-lg border border-stone-300 px-4 py-3 uppercase outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Notes{" "}
                <span className="font-normal text-stone-400">
                  (Optional)
                </span>
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                placeholder="Any additional information"
                className="w-full resize-none rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-lg bg-stone-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

                <div className="text-sm text-stone-600">
                  <p className="font-medium text-stone-800">
                    Secure online payment
                  </p>

                  <p className="mt-1">
                    You will be redirected to Razorpay Checkout to complete
                    your donation securely.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || templesLoading || !templeId}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-6 py-3.5 font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5" />
                  Donate ₹{Number(amount || 0).toLocaleString("en-IN")}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function DonatePage() {
  return <Suspense fallback={<p className="p-8" role="status">Opening donation form…</p>}><DonateForm/></Suspense>;
}
