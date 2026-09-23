"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Compass,
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
    <div className="min-h-screen bg-[#fbf7ef]">
      {/* Sacred Hero */}
      <section className="relative overflow-hidden bg-[#102a43] text-white">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.35)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#b76e79]/10 blur-3xl" />

        <div className="temple-container relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl">
            <div className="temple-eyebrow text-[#e7c873]">
              <Compass className="h-4 w-4" />
              Temple Directory
            </div>

            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block text-white">
                Find a sacred place
              </span>

              <span className="mt-2 block text-[#e7c873]">
                to begin your journey.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
              Explore temples, learn about their traditions, discover sevas,
              and plan your visit through one simple devotional experience.
            </p>
          </div>

          <div className="mt-10 max-w-3xl">
            <label
              htmlFor="temple-search"
              className="sr-only"
            >
              Search temples
            </label>

            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a7d72]" />

              <input
                id="temple-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search temple, city or state..."
                className="h-16 w-full rounded-2xl border border-white/10 bg-white px-14 pr-5 text-sm text-[#332a25] shadow-2xl shadow-black/20 outline-none transition placeholder:text-[#9a8f87] focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="temple-section">
        <div className="temple-container">
          {!isLoading && !isError && temples && (
            <div className="mb-10 flex flex-col gap-3 border-b border-[#e7dfd4] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="temple-eyebrow text-[#9a6b1f]">
                  Sacred destinations
                </p>

                <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
                  Temples to explore
                </h2>
              </div>

              <p className="text-sm text-[#776b63]">
                {filteredTemples.length}{" "}
                {filteredTemples.length === 1 ? "temple" : "temples"} available
              </p>
            </div>
          )}

          {isLoading && (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#e7dfd4] bg-white"
                >
                  <div className="h-52 animate-pulse bg-[#eee6da]" />

                  <div className="space-y-4 p-7">
                    <div className="h-7 w-3/4 animate-pulse rounded bg-[#eee6da]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#f3eee7]" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#f3eee7]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[#f3eee7]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-3xl border border-[#e7c7c7] bg-[#fff7f7] px-6 py-16 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-[#b76e79]" />

              <h2 className="temple-heading mt-5 text-2xl text-[#5d292f]">
                The temple directory is temporarily unavailable
              </h2>

              <p className="mt-3 text-sm text-[#87565d]">
                Please try again shortly.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredTemples.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#fbf4df]">
                  <Search className="h-7 w-7 text-[#9a6b1f]" />
                </div>

                <h2 className="temple-heading mt-6 text-2xl text-[#332a25]">
                  No temples found
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#776b63]">
                  Try another temple name, city, state, or location.
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-6 text-sm font-semibold text-[#8a5a16] underline decoration-[#d4af37] underline-offset-4"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredTemples.length > 0 && (
              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemples.map((temple) => (
                  <Link
                    key={temple.id}
                    href={`/temples/${temple.id}`}
                    className="group overflow-hidden rounded-3xl border border-[#e7dfd4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl hover:shadow-[#6b5848]/10"
                  >
                    {/* Sacred visual */}
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7ecd1] via-[#f9f5ed] to-[#e8ddd0]">
                      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(154,107,31,0.16)_1px,transparent_1px)] [background-size:20px_20px]" />

                      <div className="absolute -top-16 h-44 w-44 rounded-full border border-[#d4af37]/30" />
                      <div className="absolute -top-8 h-32 w-32 rounded-full border border-[#d4af37]/25" />

                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/50 bg-white/80 shadow-lg backdrop-blur">
                        <span className="font-serif text-5xl text-[#9a6b1f]">
                          ॐ
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-[#d4af37]" />
                    </div>

                    <div className="p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a07c45]">
                            Sacred destination
                          </p>

                          <h2 className="font-serif text-2xl font-semibold leading-tight text-[#332a25] transition group-hover:text-[#8a5a16]">
                            {temple.name}
                          </h2>
                        </div>

                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e7dfd4] transition group-hover:border-[#d4af37] group-hover:bg-[#fbf4df]">
                          <ArrowRight className="h-4 w-4 text-[#9a8d82] transition group-hover:translate-x-0.5 group-hover:text-[#9a6b1f]" />
                        </div>
                      </div>

                      {temple.description && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#776b63]">
                          {temple.description}
                        </p>
                      )}

                      {(temple.city ||
                        temple.state ||
                        temple.country) && (
                        <div className="mt-6 flex gap-3 border-t border-[#eee7de] pt-5 text-sm text-[#776b63]">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6b1f]" />

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

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a49a92]">
                          {temple.code}
                        </span>

                        <span className="text-xs font-semibold text-[#8a5a16] opacity-0 transition group-hover:opacity-100">
                          Explore temple →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </section>

      {/* Closing devotional section */}
      <section className="border-t border-[#e7dfd4] bg-[#f4ede2]">
        <div className="temple-container py-16 text-center sm:py-20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#fbf7ef]">
            <span className="font-serif text-2xl text-[#9a6b1f]">ॐ</span>
          </div>

          <h2 className="temple-heading mt-6 text-3xl text-[#332a25] sm:text-4xl">
            Every temple has a story.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#776b63] sm:text-base">
            Discover its traditions, services and celebrations before you
            begin your visit.
          </p>
        </div>
      </section>
    </div>
  );
}
