"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useLogin } from "@/features/auth/hooks";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas";

export default function LoginPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (
    values: LoginFormValues,
  ) => {
    try {
      await loginMutation.mutateAsync(values);

      router.replace("/admin/dashboard");
    } catch {
      // Error is displayed through loginMutation.error.
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-[var(--krishna-blue)] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(176,138,69,0.20),transparent_38%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <p className="font-devanagari text-sm tracking-[0.25em] text-white/70">
                राधे राधे
              </p>

              <div className="mt-6 h-px w-16 bg-[var(--antique-gold)]" />
            </div>

            <div className="max-w-xl">
              <p className="font-display text-xl italic text-white/70">
                A digital doorway to the temple.
              </p>

              <h1 className="mt-4 font-display text-6xl font-semibold leading-none text-white xl:text-7xl">
                Radha-Krishna
                <br />
                Mandir
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/70">
                Manage devotees, sevas, bookings,
                donations and temple activities
                with grace and simplicity.
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-[var(--antique-gold)]" />
              TempleOS
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <p className="font-devanagari text-sm tracking-[0.2em] text-[var(--radha-rose)]">
                राधे राधे
              </p>

              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--krishna-blue)]">
                TempleOS
              </h1>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--antique-gold)]/40 bg-white text-[var(--krishna-blue)]">
                <LockKeyhole
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <h2 className="font-display text-4xl font-semibold text-[var(--earth-brown-deep)]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Sign in to continue to your temple
                workspace.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-[var(--earth-brown)]"
                >
                  Username
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  />

                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    {...register("username")}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[var(--peacock-green)] focus:ring-4 focus:ring-[var(--peacock-green)]/10"
                  />
                </div>

                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[var(--earth-brown)]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register("password")}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-12 text-sm outline-none transition focus:border-[var(--peacock-green)] focus:ring-4 focus:ring-[var(--peacock-green)]/10"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--ivory)] hover:text-[var(--krishna-blue)]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {loginMutation.isError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {loginMutation.error instanceof
                  Error
                    ? loginMutation.error.message
                    : "Unable to sign in. Please try again."}
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="h-12 w-full rounded-xl bg-[var(--krishna-blue)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--krishna-blue-deep)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginMutation.isPending
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
              <p className="font-devanagari text-sm text-[var(--muted-foreground)]">
                राधे राधे • हरे कृष्ण
              </p>

              <div className="mt-3 flex justify-center gap-4 text-xs text-[var(--muted-foreground)]">
                <span>English</span>
                <span>हिन्दी</span>
                <span>मराठी</span>
                <span>संस्कृत</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}