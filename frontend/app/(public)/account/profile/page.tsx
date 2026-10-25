"use client";
import { TransactionIdentity } from "@/components/public/TransactionIdentity";

import { TempleLink as Link } from "@/features/public/TempleContext";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";

export default function ProfilePage() {
  const {
    devotee,
    isAuthenticated,
    isLoading,
  } = usePublicAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-stone-500"
        />
      </div>
    );
  }

  if (!isAuthenticated || !devotee) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
          <User size={28} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold">
          Sign in required
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Please sign in to view your profile.
        </p>

        <Link
          href="/login?redirect=/account/profile"
          className="mt-6 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const fullName = [
    devotee.first_name,
    devotee.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const initials =
    devotee.first_name
      ?.charAt(0)
      .toUpperCase() || "D";

  return (
    <div className="min-h-[calc(100vh-140px)] bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={17} />
          Back to account
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">

          <div className="bg-stone-900 px-7 py-8 text-white sm:px-10">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-stone-900">
                {initials}
              </div>

              <div>
                <p className="text-sm text-stone-400">
                  Devotee Profile
                </p>

                <h1 className="mt-1 text-2xl font-semibold">
                  {fullName || "Devotee"}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <TransactionIdentity />

            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Personal information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-500">
                    <User size={18} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Name
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-stone-900">
                    {fullName || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-500">
                    <Mail size={18} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Email
                    </span>
                  </div>

                  <p className="mt-3 break-all text-sm font-semibold text-stone-900">
                    {devotee.email || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-500">
                    <Phone size={18} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Phone
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-stone-900">
                    {devotee.phone || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-500">
                    <MapPin size={18} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Address
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-stone-900">
                    {devotee.address || "Not provided"}
                  </p>
                </div>

              </div>
            </div>

            <div className="mt-8 border-t border-stone-200 pt-8">
              <h2 className="text-lg font-semibold text-stone-900">
                Account information
              </h2>

              <div className="mt-5 rounded-2xl border border-stone-200 p-5">
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      Devotee ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-stone-700">
                      {devotee.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      Temple ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-stone-700">
                      {devotee.temple_id}
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
