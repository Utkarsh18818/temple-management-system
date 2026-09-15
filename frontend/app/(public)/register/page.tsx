"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Globe,
} from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { usePublicTemples } from "@/features/public/hooks";
import type {
  PublicDevoteeRegisterRequest,
} from "@/features/public/auth";

export default function PublicRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirect") || "/";

  const { register } = usePublicAuth();

  const {
    data: temples,
    isLoading: templesLoading,
    isError: templesError,
  } = usePublicTemples({
    limit: 100,
  });

  const [templeId, setTempleId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!templeId) {
      setError("Please select your preferred temple.");
      return;
    }

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!country.trim()) {
      setError("Please enter your country.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const payload: PublicDevoteeRegisterRequest = {
      temple_id: templeId,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim(),
      phone: phone.trim() || null,
      password,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim(),
      date_of_birth: dateOfBirth || null,
    };

    try {
      await register(payload);
      router.replace(redirectTo);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(
          "Unable to create your account right now. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">

          <div className="hidden bg-stone-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                ॐ
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                TempleOS
              </p>

              <h1 className="text-4xl font-semibold leading-tight">
                Begin your temple journey.
              </h1>

              <p className="mt-6 leading-7 text-stone-300">
                Create your devotee account to discover
                sevas, reserve slots, make donations and
                keep your spiritual records together.
              </p>
            </div>

            <div className="space-y-2 text-sm text-stone-400">
              <p>✓ Seva bookings</p>
              <p>✓ Donation history</p>
              <p>✓ Digital receipts</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-xl">

              <div className="mb-8 lg:hidden">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-2xl text-white">
                  ॐ
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                  TempleOS
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Join TempleOS as a devotee and manage
                  your temple activities from one place.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-7"
              >

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-700">
                    Temple
                  </h3>

                  <label
                    htmlFor="temple"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Preferred temple
                  </label>

                  <select
                    id="temple"
                    value={templeId}
                    onChange={(event) =>
                      setTempleId(event.target.value)
                    }
                    disabled={
                      templesLoading ||
                      isSubmitting
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100"
                  >
                    <option value="">
                      {templesLoading
                        ? "Loading temples..."
                        : "Select a temple"}
                    </option>

                    {temples?.map((temple) => (
                      <option
                        key={temple.id}
                        value={temple.id}
                      >
                        {temple.name}
                        {temple.city
                          ? ` — ${temple.city}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {templesError && (
                    <p className="mt-2 text-xs text-red-600">
                      Unable to load temples. Please
                      refresh and try again.
                    </p>
                  )}
                </section>

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-700">
                    Personal information
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        First name
                      </label>

                      <div className="relative">
                        <User
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />

                        <input
                          id="firstName"
                          value={firstName}
                          onChange={(event) =>
                            setFirstName(event.target.value)
                          }
                          placeholder="First name"
                          autoComplete="given-name"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Last name
                      </label>

                      <input
                        id="lastName"
                        value={lastName}
                        onChange={(event) =>
                          setLastName(event.target.value)
                        }
                        placeholder="Last name"
                        autoComplete="family-name"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Date of birth
                        <span className="ml-1 font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>

                      <input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(event) =>
                          setDateOfBirth(event.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                      />
                    </div>

                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-700">
                    Contact information
                  </h3>

                  <div className="space-y-5">

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Email address
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />

                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Phone number
                        <span className="ml-1 font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>

                      <div className="relative">
                        <Phone
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />

                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(event) =>
                            setPhone(event.target.value)
                          }
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>
                    </div>

                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-700">
                    Address
                  </h3>

                  <div className="space-y-5">

                    <div>
                      <label
                        htmlFor="address"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Address
                        <span className="ml-1 font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>

                      <div className="relative">
                        <MapPin
                          size={18}
                          className="pointer-events-none absolute left-3 top-3 text-stone-400"
                        />

                        <textarea
                          id="address"
                          value={address}
                          onChange={(event) =>
                            setAddress(event.target.value)
                          }
                          placeholder="Street address"
                          rows={3}
                          disabled={isSubmitting}
                          className="w-full resize-none rounded-xl border border-stone-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">

                      <div>
                        <label
                          htmlFor="city"
                          className="mb-2 block text-sm font-medium text-stone-700"
                        >
                          City
                        </label>

                        <input
                          id="city"
                          value={city}
                          onChange={(event) =>
                            setCity(event.target.value)
                          }
                          placeholder="City"
                          autoComplete="address-level2"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="state"
                          className="mb-2 block text-sm font-medium text-stone-700"
                        >
                          State
                        </label>

                        <input
                          id="state"
                          value={state}
                          onChange={(event) =>
                            setState(event.target.value)
                          }
                          placeholder="State"
                          autoComplete="address-level1"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="country"
                          className="mb-2 block text-sm font-medium text-stone-700"
                        >
                          Country
                        </label>

                        <div className="relative">
                          <Globe
                            size={18}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          />

                          <input
                            id="country"
                            value={country}
                            onChange={(event) =>
                              setCountry(event.target.value)
                            }
                            placeholder="Country"
                            autoComplete="country-name"
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-700">
                    Security
                  </h3>

                  <div className="space-y-5">

                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <Lock
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />

                        <input
                          id="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-12 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) => !value,
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-medium text-stone-700"
                      >
                        Confirm password
                      </label>

                      <div className="relative">
                        <Lock
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />

                        <input
                          id="confirmPassword"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target.value,
                            )
                          }
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-12 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) => !value,
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </section>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    templesLoading ||
                    templesError
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create devotee account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-stone-200 pt-6 text-center">
                <p className="text-sm text-stone-500">
                  Already have an account?
                </p>

                <Link
                  href={`/login${
                    redirectTo !== "/"
                      ? `?redirect=${encodeURIComponent(
                          redirectTo,
                        )}`
                      : ""
                  }`}
                  className="mt-2 inline-block text-sm font-semibold text-stone-900 underline underline-offset-4 hover:text-amber-700"
                >
                  Sign in
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}