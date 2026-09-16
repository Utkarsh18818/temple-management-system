"use client";

import { CalendarDays, MapPin, Video } from "lucide-react";
import { useMemo, useState } from "react";

import { usePublicEvents, usePublicTemples } from "@/features/public/hooks";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

export default function EventsPage() {
  const [templeId, setTempleId] = useState("");

  const templesQuery = usePublicTemples({ limit: 100 });
  const effectiveTempleId =
    templeId || templesQuery.data?.[0]?.id || "";

  const eventsQuery = usePublicEvents(
    {
      templeId: effectiveTempleId,
      limit: 100,
    },
  );

  const events = useMemo(
    () =>
      [...(eventsQuery.data ?? [])].sort((a, b) =>
        a.event_date.localeCompare(b.event_date),
      ),
    [eventsQuery.data],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[var(--krishna-blue)] px-6 py-10 text-white sm:px-10">
        <p className="font-devanagari text-sm text-white/60">
          मंदिर कार्यक्रम
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Temple Events
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Stay connected with upcoming spiritual, cultural and
          community events.
        </p>
      </div>

      <div className="mt-6">
        <select
          value={effectiveTempleId}
          onChange={(e) => setTempleId(e.target.value)}
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-[var(--antique-gold)] sm:w-[360px]"
        >
          {templesQuery.data?.map((temple) => (
            <option key={temple.id} value={temple.id}>
              {temple.name}
            </option>
          ))}
        </select>
      </div>

      {eventsQuery.isLoading ? (
        <div className="py-16 text-center text-sm text-stone-500">
          Loading events...
        </div>
      ) : eventsQuery.isError ? (
        <div className="py-16 text-center text-sm text-red-600">
          Unable to load events. Please try again.
        </div>
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
          <CalendarDays className="mx-auto text-[var(--antique-gold)]" size={30} />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            No upcoming events
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Please check back for new temple programs.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--antique-gold)]">
                    <CalendarDays size={15} />
                    {formatDate(event.event_date)}
                  </div>

                  <h2 className="mt-2 font-display text-2xl font-semibold">
                    {event.name}
                  </h2>

                  {event.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
                    <span>{formatTime(event.start_time)}</span>

                    {event.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {event.location}
                      </span>
                    )}

                    {event.is_online && (
                      <span className="inline-flex items-center gap-1">
                        <Video size={14} />
                        Online
                      </span>
                    )}
                  </div>
                </div>

                {event.organizer && (
                  <div className="shrink-0 rounded-xl bg-stone-50 px-4 py-3 text-sm">
                    <p className="text-xs text-stone-400">Organized by</p>
                    <p className="mt-1 font-semibold text-stone-800">
                      {event.organizer}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
