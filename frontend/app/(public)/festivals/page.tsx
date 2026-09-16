"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import {
  usePublicFestivals,
  usePublicTemples,
} from "@/features/public/hooks";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function FestivalsPage() {
  const [templeId, setTempleId] = useState("");

  const templesQuery = usePublicTemples({ limit: 100 });
  const effectiveTempleId =
    templeId || templesQuery.data?.[0]?.id || "";

  const festivalsQuery = usePublicFestivals({
    templeId: effectiveTempleId,
    limit: 100,
  });

  const festivals = useMemo(
    () =>
      [...(festivalsQuery.data ?? [])].sort((a, b) =>
        a.start_date.localeCompare(b.start_date),
      ),
    [festivalsQuery.data],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[var(--krishna-blue)] px-6 py-10 text-white sm:px-10">
        <p className="font-devanagari text-sm text-white/60">
          उत्सव और पर्व
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Festivals
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Explore sacred festivals and important celebrations
          happening at the temple.
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

      {festivalsQuery.isLoading ? (
        <div className="py-16 text-center text-sm text-stone-500">
          Loading festivals...
        </div>
      ) : festivalsQuery.isError ? (
        <div className="py-16 text-center text-sm text-red-600">
          Unable to load festivals. Please try again.
        </div>
      ) : festivals.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
          <Sparkles className="mx-auto text-[var(--antique-gold)]" size={30} />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            No festivals listed
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Festival information will appear here when available.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {festivals.map((festival) => (
            <article
              key={festival.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--antique-gold)]/10 text-[var(--antique-gold)]">
                <Sparkles size={22} />
              </div>

              <h2 className="mt-5 font-display text-2xl font-semibold">
                {festival.name}
              </h2>

              {festival.description && (
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {festival.description}
                </p>
              )}

              <div className="mt-5 flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays size={16} />
                <span>
                  {formatDate(festival.start_date)}
                  {festival.end_date &&
                    festival.end_date !== festival.start_date
                    ? ` – ${formatDate(festival.end_date)}`
                    : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
