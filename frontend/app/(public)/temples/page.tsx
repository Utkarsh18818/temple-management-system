"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { usePublicTemples } from "@/features/public/hooks";

export default function TemplesPage() {
  const [search, setSearch] = useState("");

  const {
    data: temples,
    isLoading,
    isError,
  } = usePublicTemples({
    limit: 100,
  });

  const filteredTemples = useMemo(() => {
    if (!temples) {
      return [];
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return temples;
    }

    return temples.filter((temple) => {
      const searchable = [
        temple.name,
        temple.code,
        temple.description,
        temple.city,
        temple.state,
        temple.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [temples, search]);

  return (
    <div>
      <section className="bg-stone-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              Sacred spaces
            </div>

            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Discover a Temple
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Explore temples, discover their traditions,
              participate in sevas and stay connected with
              upcoming celebrations.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by temple name, city or state..."
              className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-12 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {!isLoading &&
            !isError &&
            temples && (
              <div className="mb-8 flex items-center justify-between">
                <p className="text-sm font-medium text-stone-500">
                  {filteredTemples.length}{" "}
                  {filteredTemples.length === 1
                    ? "temple"
                    : "temples"}{" "}
                  available
                </p>
              </div>
            )}

          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white"
                  >
                    <div className="h-44 bg-stone-200" />

                    <div className="p-6">
                      <div className="h-6 w-3/4 rounded bg-stone-200" />
                      <div className="mt-4 h-4 w-full rounded bg-stone-100" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-stone-100" />
                      <div className="mt-6 h-4 w-1/2 rounded bg-stone-100" />
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <h2 className="font-display text-2xl font-semibold text-red-900">
                Unable to load temples
              </h2>

              <p className="mt-2 text-sm text-red-700">
                Please try again shortly.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredTemples.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
                <Search className="mx-auto h-10 w-10 text-stone-300" />

                <h2 className="mt-5 font-display text-2xl font-semibold text-stone-800">
                  No temples found
                </h2>

                <p className="mt-2 text-sm text-stone-500">
                  Try searching with another temple name
                  or location.
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredTemples.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemples.map((temple) => (
                  <Link
                    key={temple.id}
                    href={`/temples/${temple.id}`}
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-stone-200/60"
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-stone-100">
                      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(180,83,9,0.15)_1px,transparent_1px)] [background-size:18px_18px]" />

                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-300 bg-white/80 shadow-sm backdrop-blur">
                        <span className="font-display text-4xl text-amber-700">
                          ॐ
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="font-display text-2xl font-semibold leading-tight text-stone-900 transition group-hover:text-amber-700">
                          {temple.name}
                        </h2>

                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-stone-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
                      </div>

                      {temple.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-500">
                          {temple.description}
                        </p>
                      )}

                      {(temple.city ||
                        temple.state ||
                        temple.country) && (
                        <div className="mt-5 flex gap-2 text-sm text-stone-500">
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

                      <div className="mt-5 border-t border-stone-100 pt-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
                          {temple.code}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}