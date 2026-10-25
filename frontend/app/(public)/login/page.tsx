"use client";
import { Suspense } from "react";
import { PanInput } from "@/components/public/PanInput";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { useTemplePortal, portalReturnPath } from "@/features/public/TempleContext";
import { usePublicTemples } from "@/features/public/hooks";

function PublicLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = usePublicAuth();
  const portal = useTemplePortal();
  const { data: temples } = usePublicTemples({ limit: 100 });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo =
    searchParams.get("redirect") || "/";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    if(!portal.templeId) { setError("Choose an active temple portal first."); return; }

    if (!username.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(
        username.trim(),
        password,
        portal.templeId,
        panNumber,
      );

      router.replace(portalReturnPath(redirectTo, portal.templeId, portal.home));
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(
          "Unable to sign in right now. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-stone-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ॐ
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
              {portal.temple?.name ?? "Temple portal"}
            </p>

            <h1 className="max-w-md text-4xl font-semibold leading-tight">
              Your temple journey, all in one place.
            </h1>

            <p className="mt-6 max-w-md leading-7 text-stone-300">
              Sign in to manage your seva bookings,
              donations, receipts and devotee profile.
            </p>
          </div>

          <p className="text-sm text-stone-400">
            Devotion made simple.
          </p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-2xl text-white">
                ॐ
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                {portal.temple?.name ?? "Temple portal"}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Sign in to {portal.temple?.name ?? "this temple"}. Accounts and records are separate for every temple.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="login-temple" className="mb-2 block text-sm font-medium text-stone-700">
                Choose your temple portal
              </label>
              <select id="login-temple" value={portal.templeId} disabled={isSubmitting}
                onChange={event => {
                  setUsername("");
                  setPassword("");
                  setShowPassword(false);
                  setError("");
                  router.replace(`/login?temple_id=${encodeURIComponent(event.target.value)}`);
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900 outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200">
                {(!temples?.length && portal.temple) && <option value={portal.templeId}>{portal.temple.name}</option>}
                {temples?.map(temple => <option key={temple.id} value={temple.id}>{temple.name}{temple.city ? ` · ${temple.city}` : ""}</option>)}
              </select>
              <p className="mt-2 text-xs leading-5 text-stone-500">Use the account registered with your selected temple.</p>
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
              autoComplete="off"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Email or phone
                </label>

                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={18}
                  />

                  <input
                    id="username"
                    type="text"
                    autoComplete="off"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={18}
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <PanInput value={panNumber} onChange={setPanNumber} disabled={isSubmitting}
                help="Leave blank to use your saved PAN. Enter a PAN here only to save or replace it after a successful sign-in." />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-stone-200 pt-6 text-center">
              <p className="text-sm text-stone-500">
                Don&apos;t have a devotee account?
              </p>

              <Link
                href={`/register${
                  redirectTo !== "/"
                    ? `?redirect=${encodeURIComponent(redirectTo)}`
                    : ""
                }`}
                className="mt-2 inline-block text-sm font-semibold text-stone-900 underline underline-offset-4 hover:text-amber-700"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-stone-500">Loading...</div>
        </div>
      }
    >
      <PublicLoginPage />
    </Suspense>
  );
}
