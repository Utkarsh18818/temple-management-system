"use client";

import { TempleLink as Link } from "@/features/public/TempleContext";
import {
  CalendarCheck,
  ChevronRight,
  FileText,
  Heart,
  Loader2,
  User,
} from "lucide-react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";

export default function AccountPage() {
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          <User size={28} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-stone-900">
          Sign in required
        </h1>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          Please sign in to access your devotee account.
        </p>

        <Link
          href="/login?redirect=/account"
          className="mt-6 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800"
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

  const initial =
    devotee.first_name
      ?.charAt(0)
      .toUpperCase() || "D";

  const cards = [
    {
      title: "My Profile",
      description:
        "View and manage your devotee information.",
      href: "/account/profile",
      icon: User,
    },
    {
      title: "My Bookings",
      description:
        "View your seva bookings and booking status.",
      href: "/account/bookings",
      icon: CalendarCheck,
    },
    {
      title: "My Donations",
      description:
        "View your donation history and details.",
      href: "/account/donations",
      icon: Heart,
    },
    {
      title: "My Receipts",
      description:
        "Access your donation and seva receipts.",
      href: "/account/receipts",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="rounded-3xl bg-stone-900 p-7 text-white shadow-lg sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-stone-900">
              {initial}
            </div>

            <div>
              <p className="text-sm font-medium text-stone-400">
                Welcome back
              </p>

              <h1 className="mt-1 text-3xl font-semibold">
                {fullName || "Devotee"}
              </h1>

              {devotee.email && (
                <p className="mt-1 text-sm text-stone-400">
                  {devotee.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-stone-900">
            Your account
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Manage your temple activities and devotee
            information.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                    <Icon size={21} />
                  </div>

                  <ChevronRight
                    size={19}
                    className="text-stone-400 transition group-hover:translate-x-1 group-hover:text-stone-700"
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
