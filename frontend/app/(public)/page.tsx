"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { usePublicTemples } from "@/features/public/hooks";

export default function PublicHomePage() {
  const {
    data: temples,
    isLoading,
    isError,
  } = usePublicTemples({
    limit: 6,
  });

  return (
    <div>
      {/* ------------------------------------------------ */}
      {/* Hero                                             */}
      {/* ------------------------------------------------ */}

      <section className="relative overflow-hidden bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.22),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(180,83,9,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              A digital home for devotion
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-8xl">
              Discover.
              <br />
              <span className="text-amber-400">
                Connect.
              </span>
              <br />
              Worship.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Explore temples, discover sacred sevas,
              join upcoming festivals and events, and
              stay connected with the places that matter
              to you.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/temples"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-600 px-7 text-sm font-semibold text-white shadow-lg shadow-amber-950/30 transition hover:bg-amber-500"
              >
                Explore Temples
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/sevas"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-600 px-7 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300"
              >
                Discover Sevas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* Quick Actions                                    */}
      {/* ------------------------------------------------ */}

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-stone-200 sm:grid-cols-3">
          <Link
            href="/temples"
            className="group bg-white p-7 transition hover:bg-amber-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Search className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-display text-2xl font-semibold text-stone-900">
              Find a Temple
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Discover temples and their sacred
              offerings.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
              Explore
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/sevas"
            className="group bg-white p-7 transition hover:bg-amber-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Heart className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-display text-2xl font-semibold text-stone-900">
              Book a Seva
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Participate in sacred services and
              reserve available slots.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
              Browse Sevas
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/events"
            className="group bg-white p-7 transition hover:bg-amber-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CalendarDays className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-display text-2xl font-semibold text-stone-900">
              Upcoming Events
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Stay informed about celebrations and
              temple gatherings.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
              View Events
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* Temples                                          */}
      {/* ------------------------------------------------ */}

      <section className="bg-stone-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Sacred spaces
              </p>

              <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Discover Temples
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500 sm:text-base">
                Explore temples available on TempleOS and
                discover their services, events and
                festivals.
              </p>
            </div>

            <Link
              href="/temples"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              View all temples
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading && (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({
                length: 3,
              }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6"
                >
                  <div className="h-12 w-12 rounded-full bg-stone-200" />
                  <div className="mt-5 h-6 w-2/3 rounded bg-stone-200" />
                  <div className="mt-3 h-4 w-full rounded bg-stone-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-stone-100" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              We couldn't load the temples right now.
              Please try again in a moment.
            </div>
          )}

          {!isLoading &&
            !isError &&
            temples &&
            temples.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
                <p className="font-display text-2xl font-semibold text-stone-800">
                  No temples available yet
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Please check back soon.
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            temples &&
            temples.length > 0 && (
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {temples.map((temple) => (
                  <Link
                    key={temple.id}
                    href={`/temples/${temple.id}`}
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-stone-200/50"
                  >
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-stone-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300 bg-white/80 shadow-sm">
                        <span className="font-display text-3xl text-amber-700">
                          ॐ
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-display text-2xl font-semibold text-stone-900 group-hover:text-amber-700">
                        {temple.name}
                      </h3>

                      {temple.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                          {temple.description}
                        </p>
                      )}

                      {(temple.city ||
                        temple.state) && (
                        <div className="mt-5 flex items-start gap-2 text-sm text-stone-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                          <span>
                            {[
                              temple.city,
                              temple.state,
                              temple.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                        <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          {temple.code}
                        </span>

                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                          Visit
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* Donation CTA                                     */}
      {/* ------------------------------------------------ */}

      <section className="bg-amber-700 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
              Seva through giving
            </p>

            <h2 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
              Every offering carries a purpose.
            </h2>

            <p className="mt-4 text-sm leading-7 text-amber-100 sm:text-base">
              Support temples and contribute towards
              preserving sacred spaces and traditions.
            </p>
          </div>

          <Link
            href="/temples"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-amber-800 shadow-lg transition hover:bg-amber-50"
          >
            Explore Temples
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
