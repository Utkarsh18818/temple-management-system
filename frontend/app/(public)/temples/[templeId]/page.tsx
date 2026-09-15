"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Globe,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

import {
  usePublicEvents,
  usePublicFestivals,
  usePublicSevas,
  usePublicTemple,
} from "@/features/public/hooks";

export default function TempleDetailPage() {
  const params = useParams();
  const templeId = params.templeId as string;

  const {
    data: temple,
    isLoading: templeLoading,
    isError: templeError,
  } = usePublicTemple(templeId);

  const {
    data: sevas,
    isLoading: sevasLoading,
  } = usePublicSevas({
    templeId,
  });

  const {
    data: events,
    isLoading: eventsLoading,
  } = usePublicEvents({
    templeId,
  });

  const {
    data: festivals,
    isLoading: festivalsLoading,
  } = usePublicFestivals({
    templeId,
  });

  if (templeLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-72 rounded-3xl bg-stone-200" />
          <div className="mt-10 h-10 w-1/2 rounded bg-stone-200" />
          <div className="mt-4 h-5 w-2/3 rounded bg-stone-100" />
        </div>
      </div>
    );
  }

  if (templeError || !temple) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <MapPin className="h-7 w-7" />
        </div>

        <h1 className="mt-6 font-display text-4xl font-semibold text-stone-900">
          Temple not found
        </h1>

        <p className="mt-3 text-sm leading-7 text-stone-500">
          This temple may no longer be available or the
          requested temple could not be loaded.
        </p>

        <Link
          href="/temples"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Browse Temples
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Temple Hero */}
      <section className="relative overflow-hidden bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.25),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(180,83,9,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                Temple
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
                {temple.name}
              </h1>

              {temple.description && (
                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
                  {temple.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/temples/${temple.id}/sevas`}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-amber-600 px-7 text-sm font-semibold text-white transition hover:bg-amber-500"
                >
                  <Heart className="h-4 w-4" />
                  Explore Sevas
                </Link>

                <Link
                  href="/events"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-600 px-7 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300"
                >
                  <CalendarDays className="h-4 w-4" />
                  Events
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto flex aspect-square max-w-sm items-center justify-center rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/20 to-transparent">
                <div className="flex h-56 w-56 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
                  <span className="font-display text-[9rem] leading-none text-amber-400/80">
                    ॐ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Temple Information */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-stone-200 p-6 sm:border-r lg:border-b-0">
            <MapPin className="h-5 w-5 text-amber-600" />

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Location
            </p>

            <p className="mt-2 text-sm leading-6 text-stone-700">
              {[
                temple.address,
                temple.city,
                temple.state,
                temple.country,
                temple.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "Location unavailable"}
            </p>
          </div>

          <div className="border-b border-stone-200 p-6 lg:border-b-0 lg:border-r">
            <Phone className="h-5 w-5 text-amber-600" />

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Phone
            </p>

            <p className="mt-2 text-sm text-stone-700">
              {temple.phone || "Not available"}
            </p>
          </div>

          <div className="border-b border-stone-200 p-6 sm:border-r lg:border-b-0">
            <Mail className="h-5 w-5 text-amber-600" />

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Email
            </p>

            <p className="mt-2 break-all text-sm text-stone-700">
              {temple.email || "Not available"}
            </p>
          </div>

          <div className="p-6">
            <Globe className="h-5 w-5 text-amber-600" />

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Website
            </p>

            {temple.website ? (
              <a
                href={temple.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                Visit website
              </a>
            ) : (
              <p className="mt-2 text-sm text-stone-700">
                Not available
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sevas */}
      <section className="bg-stone-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Sacred offerings
              </p>

              <h2 className="mt-2 font-display text-4xl font-semibold text-stone-900">
                Sevas
              </h2>
            </div>

            <Link
              href={`/temples/${temple.id}/sevas`}
              className="hidden items-center gap-2 text-sm font-semibold text-amber-700 sm:inline-flex"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {sevasLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-2xl bg-stone-200"
                />
              ))}
            </div>
          ) : sevas && sevas.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sevas.slice(0, 6).map((seva) => (
                <Link
                  key={seva.id}
                  href={`/sevas/${seva.id}`}
                  className="group rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Heart className="h-5 w-5" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-stone-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900 group-hover:text-amber-700">
                    {seva.name}
                  </h3>

                  {seva.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                      {seva.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                    <span className="text-sm font-semibold text-amber-700">
                      ₹{Number(seva.amount).toLocaleString("en-IN")}
                    </span>

                    {seva.duration_minutes && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="h-3.5 w-3.5" />
                        {seva.duration_minutes} min
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
              No online sevas are currently available.
            </div>
          )}

          <Link
            href={`/temples/${temple.id}/sevas`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 sm:hidden"
          >
            View all sevas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Events */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Stay connected
              </p>

              <h2 className="mt-2 font-display text-4xl font-semibold text-stone-900">
                Upcoming Events
              </h2>
            </div>

            <Link
              href="/events"
              className="hidden items-center gap-2 text-sm font-semibold text-amber-700 sm:inline-flex"
            >
              All events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {eventsLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-2xl bg-stone-100"
                />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                    <CalendarDays className="h-4 w-4" />
                    {event.event_date}
                  </div>

                  <h3 className="mt-4 font-display text-2xl font-semibold text-stone-900">
                    {event.name}
                  </h3>

                  {event.location && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      {event.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
              No upcoming events currently available.
            </div>
          )}
        </div>
      </section>

      {/* Festivals */}
      <section className="bg-amber-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Celebrate together
          </p>

          <h2 className="mt-2 font-display text-4xl font-semibold text-stone-900">
            Festivals
          </h2>

          {festivalsLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl bg-amber-100"
                />
              ))}
            </div>
          ) : festivals && festivals.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {festivals.slice(0, 3).map((festival) => (
                <div
                  key={festival.id}
                  className="rounded-2xl border border-amber-200 bg-white p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">
                    {festival.name}
                  </h3>

                  <p className="mt-2 text-sm font-medium text-amber-700">
                    {festival.start_date}

                    {festival.end_date &&
                      festival.end_date !== festival.start_date &&
                      ` — ${festival.end_date}`}
                  </p>

                  {festival.deity && (
                    <p className="mt-2 text-sm text-stone-500">
                      {festival.deity}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center text-sm text-stone-500">
              No upcoming festivals currently available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}