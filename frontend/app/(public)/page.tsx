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

const devotionalServices = [
  {
    title: "Explore Temples",
    description:
      "Discover sacred spaces, traditions, facilities and services.",
    href: "/temples",
    icon: "ॐ",
    tone: "blue",
  },
  {
    title: "Book a Seva",
    description:
      "Participate in sacred services and reserve available slots.",
    href: "/sevas",
    icon: "🪔",
    tone: "gold",
  },
  {
    title: "Make an Offering",
    description:
      "Support temples and contribute towards meaningful seva.",
    href: "/donate",
    icon: "♥",
    tone: "rose",
  },
  {
    title: "Upcoming Events",
    description:
      "Stay connected with temple celebrations and gatherings.",
    href: "/events",
    icon: "✦",
    tone: "green",
  },
  {
    title: "Festivals",
    description:
      "Discover upcoming festivals and sacred occasions.",
    href: "/festivals",
    icon: "✺",
    tone: "gold",
  },
  {
    title: "Your Devotion",
    description:
      "Manage your bookings, donations and receipts in one place.",
    href: "/account",
    icon: "🙏",
    tone: "blue",
  },
];

const visitPoints = [
  "Temple timings and important information",
  "Seva and festival details",
  "Location and contact information",
  "Devotee bookings and digital receipts",
];

export default function PublicHomePage() {
  const {
    data: temples,
    isLoading,
    isError,
  } = usePublicTemples({
    limit: 6,
  });

  const templeCount = temples?.length ?? 0;

  return (
    <div className="overflow-hidden">

      {/* ============================================================
          HERO — SACRED ENTRANCE
          ============================================================ */}

      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#102c4a] sm:min-h-[720px]">

        {/* Ambient light */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-[#b08a45]/15 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-[620px] w-[620px] rounded-full bg-[#b85c73]/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d1b06a]/10" />
          <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d1b06a]/10" />
        </div>

        {/* Subtle temple-inspired pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #d1b06a 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
        </div>

        {/* Decorative arch */}
        <div className="pointer-events-none absolute bottom-[-250px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-t-[360px] border border-[#d1b06a]/15 bg-[#fffdf8]/[0.025] sm:h-[620px] sm:w-[900px]" />

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:min-h-[720px] sm:px-6 lg:px-8">

          <div className="w-full max-w-4xl text-center">

            <div className="mx-auto mb-7 flex items-center justify-center gap-3 text-[#d1b06a]">
              <span className="h-px w-12 bg-[#d1b06a]/50" />
              <span className="font-devanagari text-lg">ॐ</span>
              <span className="h-px w-12 bg-[#d1b06a]/50" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d1b06a] sm:text-xs">
              A digital gateway to sacred experiences
            </p>

            <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.92] tracking-[-0.035em] text-[#fffdf8] sm:text-7xl lg:text-[100px]">
              Your Journey
              <br />
              <span className="text-[#d1b06a]">
                of Devotion
              </span>
              <br />
              Begins Here
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#d9d2c8] sm:text-base sm:leading-8">
              Discover temples, participate in sacred sevas,
              explore festivals and stay connected with the
              places where faith and tradition come alive.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                href="/temples"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#d1b06a] px-8 text-sm font-bold text-[#332a25] shadow-[0_10px_35px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e0c27e]"
              >
                Explore Temples
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/sevas"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#d1b06a]/45 bg-white/[0.04] px-8 text-sm font-semibold text-white backdrop-blur transition duration-300 hover:border-[#d1b06a] hover:bg-white/[0.08]"
              >
                Discover Sevas
              </Link>

            </div>

            {/* Hero trust strip */}
            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 border-y border-white/10 py-5">

              <div className="px-3">
                <p className="font-display text-2xl font-semibold text-white">
                  {isLoading ? "—" : templeCount || "—"}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9e968c]">
                  Temples
                </p>
              </div>

              <div className="border-x border-white/10 px-3">
                <p className="font-display text-2xl font-semibold text-white">
                  Sacred
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9e968c]">
                  Experiences
                </p>
              </div>

              <div className="px-3">
                <p className="font-display text-2xl font-semibold text-white">
                  Digital
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9e968c]">
                  Seva Access
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[#9e968c] sm:flex">
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em]">
            Explore
          </span>
          <span className="h-8 w-px bg-gradient-to-b from-[#d1b06a] to-transparent" />
        </div>
      </section>

      {/* ============================================================
          DEVOTEE SERVICES
          ============================================================ */}

      <section className="relative bg-[#fbf7ef] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">

        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <span className="temple-eyebrow">
              Begin your journey
            </span>

            <h2 className="temple-heading mt-4 text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Everything you need,
              <br />
              <span className="text-[#183b63]">
                in one sacred space.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#74685f] sm:text-base">
              Explore temples, discover services, participate
              in celebrations and manage your devotional
              journey from one place.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {devotionalServices.map((service) => {

              const toneClasses = {
                blue: {
                  icon: "bg-[#183b63] text-white",
                  hover: "hover:border-[#183b63]/30",
                },
                gold: {
                  icon: "bg-[#f3e7c9] text-[#8b692e]",
                  hover: "hover:border-[#b08a45]/45",
                },
                rose: {
                  icon: "bg-[#f6e4e9] text-[#a64f68]",
                  hover: "hover:border-[#b85c73]/35",
                },
                green: {
                  icon: "bg-[#dff0ec] text-[#246b63]",
                  hover: "hover:border-[#287c72]/35",
                },
              };

              const tone =
                toneClasses[
                  service.tone as keyof typeof toneClasses
                ];

              return (
                <Link
                  key={service.href}
                  href={service.href}
                  className={`group relative overflow-hidden rounded-2xl border border-[#e6dccd] bg-[#fffdf8] p-7 shadow-[0_4px_20px_rgba(89,72,61,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(89,72,61,0.10)] ${tone.hover}`}
                >

                  <div className="flex items-start justify-between">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg shadow-sm ${tone.icon}`}
                    >
                      <span className="font-devanagari">
                        {service.icon}
                      </span>
                    </div>

                    <ArrowRight className="h-5 w-5 text-[#b8aa9d] transition duration-300 group-hover:translate-x-1 group-hover:text-[#b08a45]" />
                  </div>

                  <h3 className="mt-6 font-display text-2xl font-semibold text-[#332a25]">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#74685f]">
                    {service.description}
                  </p>

                  <div className="mt-6 h-px w-10 bg-[#d1b06a] transition-all duration-300 group-hover:w-20" />

                </Link>
              );
            })}

          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED TEMPLES
          ============================================================ */}

      <section className="relative bg-[#fffdf8] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <span className="temple-eyebrow">
                Sacred spaces
              </span>

              <h2 className="temple-heading mt-4 text-4xl font-semibold sm:text-5xl lg:text-6xl">
                Discover Temples
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74685f] sm:text-base">
                Find temples on TempleOS and explore their
                sacred services, events, festivals and
                devotee experiences.
              </p>
            </div>

            <Link
              href="/temples"
              className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#183b63]"
            >
              View all temples
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

          </div>

          {isLoading && (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#e6dccd] bg-[#fbf7ef]"
                >
                  <div className="h-52 animate-pulse bg-[#f3ecdf]" />
                  <div className="space-y-3 p-6">
                    <div className="h-6 w-2/3 animate-pulse rounded bg-[#e8dfd1]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#eee7dc]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#eee7dc]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-12 rounded-2xl border border-[#e7c4cb] bg-[#fff4f6] p-8 text-center">
              <p className="font-display text-2xl font-semibold text-[#8f3f55]">
                The sacred spaces could not be loaded.
              </p>

              <p className="mt-2 text-sm text-[#a85d70]">
                Please try again in a moment.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            temples &&
            temples.length === 0 && (
              <div className="mt-12 rounded-3xl border border-dashed border-[#d9cebe] bg-[#fbf7ef] p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d1b06a]/40 bg-[#fffdf8] font-devanagari text-2xl text-[#b08a45]">
                  ॐ
                </div>

                <p className="mt-5 font-display text-3xl font-semibold text-[#332a25]">
                  Our temple directory is growing.
                </p>

                <p className="mt-2 text-sm text-[#74685f]">
                  Please check back soon.
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            temples &&
            temples.length > 0 && (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {temples.map((temple) => (
                  <Link
                    key={temple.id}
                    href={`/temples/${temple.id}`}
                    className="group relative overflow-hidden rounded-3xl border border-[#e6dccd] bg-[#fbf7ef] transition duration-300 hover:-translate-y-1 hover:border-[#b08a45]/45 hover:shadow-[0_20px_45px_rgba(89,72,61,0.12)]"
                  >

                    {/* Temple visual */}
                    <div className="relative flex h-52 items-end overflow-hidden bg-[#183b63]">

                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(209,176,106,0.28),transparent_42%)]" />

                      <div className="absolute left-1/2 top-10 -translate-x-1/2">

                        <div className="relative flex h-28 w-48 items-end justify-center">

                          <div className="absolute bottom-0 h-16 w-36 rounded-t-[90px] border-x border-t border-[#d1b06a]/35 bg-[#d1b06a]/[0.06]" />

                          <div className="absolute bottom-0 h-20 w-28 border-x border-t border-[#d1b06a]/25 bg-[#d1b06a]/[0.05]" />

                          <div className="absolute bottom-0 h-24 w-20 border-x border-t border-[#d1b06a]/20 bg-[#d1b06a]/[0.04]" />

                          <span className="relative z-10 mb-3 font-devanagari text-4xl text-[#d1b06a]">
                            ॐ
                          </span>

                        </div>

                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#102c4a] to-transparent" />

                      <div className="relative z-10 flex w-full items-center justify-between px-6 pb-5">

                        <span className="rounded-full border border-[#d1b06a]/30 bg-[#102c4a]/60 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#d1b06a] backdrop-blur">
                          Sacred space
                        </span>

                        <span className="text-xs font-medium text-[#d9d2c8]">
                          {temple.code}
                        </span>

                      </div>
                    </div>

                    {/* Temple information */}
                    <div className="p-6">

                      <h3 className="font-display text-3xl font-semibold leading-tight text-[#332a25] transition group-hover:text-[#183b63]">
                        {temple.name}
                      </h3>

                      {temple.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#74685f]">
                          {temple.description}
                        </p>
                      )}

                      {(temple.city ||
                        temple.state) && (
                        <div className="mt-5 flex items-start gap-2 text-sm text-[#74685f]">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#b08a45]" />

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

                      <div className="mt-6 flex items-center justify-between border-t border-[#e6dccd] pt-4">

                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a08f82]">
                          Discover temple
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#183b63]">
                          Enter
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

      {/* ============================================================
          SACRED RHYTHM / VISIT EXPERIENCE
          ============================================================ */}

      <section className="relative overflow-hidden bg-[#102c4a] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">

        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#b08a45]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

          <div>

            <span className="temple-eyebrow text-[#d1b06a]">
              The sacred rhythm
            </span>

            <h2 className="mt-5 font-display text-5xl font-semibold leading-tight text-[#fffdf8] sm:text-6xl">
              Every temple has
              <br />
              <span className="text-[#d1b06a]">
                a story to tell.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-8 text-[#bdb5aa] sm:text-base">
              Discover the history, traditions, deities,
              services and celebrations that make every
              temple unique.
            </p>

            <Link
              href="/temples"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#d1b06a]/40 px-6 py-3 text-sm font-semibold text-[#fffdf8] transition hover:border-[#d1b06a] hover:bg-white/[0.05]"
            >
              Discover a temple
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            {[
              ["01", "History", "Understand the heritage behind every sacred space."],
              ["02", "Sevas", "Participate in meaningful temple services."],
              ["03", "Festivals", "Stay connected with sacred celebrations."],
              ["04", "Visit", "Find information to plan your temple visit."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-[#d1b06a]/30 hover:bg-white/[0.07]"
              >
                <span className="font-display text-3xl text-[#d1b06a]/70">
                  {number}
                </span>

                <h3 className="mt-5 font-display text-2xl font-semibold text-white">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#a9a198]">
                  {description}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ============================================================
          FESTIVALS / EVENTS
          ============================================================ */}

      <section className="bg-[#fbf7ef] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <span className="temple-eyebrow">
              Sacred celebrations
            </span>

            <h2 className="temple-heading mt-4 text-4xl font-semibold sm:text-5xl">
              Celebrate together
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#74685f] sm:text-base">
              Stay connected with upcoming temple events,
              festivals and special occasions.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">

            <Link
              href="/festivals"
              className="group relative min-h-[300px] overflow-hidden rounded-[28px] bg-[#183b63] p-8 sm:p-10"
            >
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-[#d1b06a]/20" />
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-[#d1b06a]/20" />

              <div className="relative flex h-full flex-col justify-between">

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d1b06a]">
                    Festivals
                  </span>

                  <h3 className="mt-5 max-w-md font-display text-4xl font-semibold text-white sm:text-5xl">
                    Sacred occasions,
                    <br />
                    shared together.
                  </h3>

                  <p className="mt-4 max-w-md text-sm leading-7 text-[#bdb5aa]">
                    Discover festivals and the traditions
                    that bring devotees together.
                  </p>
                </div>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#d1b06a]">
                  Explore festivals
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>

              </div>
            </Link>

            <Link
              href="/events"
              className="group relative min-h-[300px] overflow-hidden rounded-[28px] border border-[#e6dccd] bg-[#fffdf8] p-8 sm:p-10"
            >
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#dff0ec] blur-2xl" />

              <div className="relative flex h-full flex-col justify-between">

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#287c72]">
                    Temple events
                  </span>

                  <h3 className="mt-5 max-w-md font-display text-4xl font-semibold text-[#332a25] sm:text-5xl">
                    There is always
                    <br />
                    something sacred.
                  </h3>

                  <p className="mt-4 max-w-md text-sm leading-7 text-[#74685f]">
                    Find upcoming gatherings, special
                    programmes and temple activities.
                  </p>
                </div>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#183b63]">
                  View events
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>

              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ============================================================
          DONATION
          ============================================================ */}

      <section className="relative overflow-hidden bg-[#b08a45] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">

        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border border-white/50" />
          <div className="absolute -left-4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/40" />
          <div className="absolute -left-[-30px] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-white/30" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div className="max-w-3xl">

            <div className="flex items-center gap-3 text-white/80">
              <span className="font-devanagari text-xl">
                ॐ
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                Seva through giving
              </span>
            </div>

            <h2 className="mt-5 font-display text-5xl font-semibold leading-tight text-white sm:text-6xl">
              An offering is more
              <br />
              than a contribution.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#fff7e8] sm:text-base">
              Support temple services, sacred traditions
              and the spaces that bring communities
              together.
            </p>

          </div>

          <Link
            href="/donate"
            className="group inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#fffdf8] px-8 text-sm font-bold text-[#59483d] shadow-[0_12px_30px_rgba(51,42,37,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-white"
          >
            Make an Offering
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>

        </div>
      </section>

      {/* ============================================================
          PLAN YOUR VISIT
          ============================================================ */}

      <section className="bg-[#fffdf8] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">

          <div>

            <span className="temple-eyebrow">
              Plan your visit
            </span>

            <h2 className="temple-heading mt-4 text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Come with faith.
              <br />
              <span className="text-[#183b63]">
                Leave with memories.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#74685f] sm:text-base">
              Before visiting a temple, discover the
              information and services available through
              TempleOS.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              {visitPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f3e7c9] text-xs text-[#8b692e]">
                    ✓
                  </span>

                  <span className="text-sm leading-6 text-[#59483d]">
                    {point}
                  </span>
                </div>
              ))}

            </div>

            <Link
              href="/temples"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#183b63] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(24,59,99,0.18)] transition hover:bg-[#102c4a]"
            >
              Find a Temple
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          {/* Visit card */}
          <div className="relative">

            <div className="absolute -inset-3 rounded-[36px] border border-[#d1b06a]/20" />

            <div className="relative overflow-hidden rounded-[30px] bg-[#102c4a] p-8 shadow-[0_25px_60px_rgba(51,42,37,0.14)] sm:p-10">

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d1b06a]/35 bg-[#d1b06a]/10">
                  <MapPin className="h-5 w-5 text-[#d1b06a]" />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9e968c]">
                  TempleOS
                </span>

              </div>

              <div className="mt-12">
                <span className="font-devanagari text-5xl text-[#d1b06a]">
                  ॐ
                </span>

                <h3 className="mt-5 font-display text-4xl font-semibold text-white">
                  Find your
                  <br />
                  sacred space.
                </h3>

                <p className="mt-4 text-sm leading-7 text-[#bdb5aa]">
                  Explore temples and discover the
                  experiences waiting for you.
                </p>
              </div>

              <div className="mt-10 border-t border-white/10 pt-6">
                <Link
                  href="/temples"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-[#d1b06a]"
                >
                  Explore temple directory
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
          FINAL DEVOTIONAL CTA
          ============================================================ */}

      <section className="border-t border-[#e6dccd] bg-[#fbf7ef] px-4 py-20 text-center sm:px-6 lg:px-8">

        <div className="mx-auto max-w-3xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#b08a45]/35 bg-[#fffdf8] shadow-sm">
            <span className="font-devanagari text-2xl text-[#183b63]">
              ॐ
            </span>
          </div>

          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#b08a45]">
            TempleOS
          </p>

          <h2 className="mt-4 font-display text-4xl font-semibold text-[#332a25] sm:text-5xl">
            May every journey lead
            <br />
            <span className="text-[#183b63]">
              closer to devotion.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#74685f]">
            Discover sacred places, participate in seva and
            stay connected with the temples that inspire you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/temples"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#183b63] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#102c4a]"
            >
              Explore Temples
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/donate"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cebe] bg-[#fffdf8] px-7 py-3.5 text-sm font-semibold text-[#59483d] transition hover:border-[#b08a45]/50 hover:bg-white"
            >
              Make an Offering
              <Heart className="h-4 w-4" />
            </Link>

          </div>

        </div>
      </section>

    </div>
  );
}
