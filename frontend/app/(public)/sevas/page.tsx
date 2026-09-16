"use client";

import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { usePublicSevas, usePublicTemples } from "@/features/public/hooks";

export default function SevasPage() {
  const [templeId, setTempleId] = useState("");
  const [search, setSearch] = useState("");

  const templesQuery = usePublicTemples({ limit: 100 });

  const effectiveTempleId =
    templeId || templesQuery.data?.[0]?.id || "";

  const sevasQuery = usePublicSevas(
    { templeId: effectiveTempleId, search: search || undefined, limit: 100 },
  );

  const sevas = useMemo(
    () => sevasQuery.data ?? [],
    [sevasQuery.data],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[var(--krishna-blue)] px-6 py-10 text-white sm:px-10">
        <p className="font-devanagari text-sm text-white/60">
          श्री सेवा
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Sevas
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Discover sacred sevas offered by our temples and choose
          a seva that you would like to perform.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[280px_1fr]">
        <select
          value={effectiveTempleId}
          onChange={(e) => setTempleId(e.target.value)}
          className="h-12 rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-[var(--antique-gold)]"
        >
          {templesQuery.data?.map((temple) => (
            <option key={temple.id} value={temple.id}>
              {temple.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sevas..."
            className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--antique-gold)]"
          />
        </div>
      </div>

      {sevasQuery.isLoading ? (
        <div className="py-16 text-center text-sm text-stone-500">
          Loading sevas...
        </div>
      ) : sevasQuery.isError ? (
        <div className="py-16 text-center text-sm text-red-600">
          Unable to load sevas. Please try again.
        </div>
      ) : sevas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
          <Sparkles className="mx-auto text-[var(--antique-gold)]" size={28} />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            No sevas found
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Try another temple or search term.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sevas.map((seva) => (
            <article
              key={seva.id}
              className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--antique-gold)]/10 text-[var(--antique-gold)]">
                <Sparkles size={21} />
              </div>

              <h2 className="mt-5 font-display text-2xl font-semibold text-stone-900">
                {seva.name}
              </h2>

              {seva.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-500">
                  {seva.description}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between">
                <span className="text-lg font-semibold text-stone-900">
                  ₹{Number(seva.amount).toLocaleString("en-IN")}
                </span>

                <Link
                  href={`/sevas/${seva.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View Seva
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
