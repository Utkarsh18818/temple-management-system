"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Heart,
  Search,
  Sparkles,
} from "lucide-react";

import {
  usePublicSevas,
  usePublicTemple,
} from "@/features/public/hooks";

export default function TempleSevasPage() {
  const params = useParams<{ templeId: string }>();
  const templeId = params?.templeId;

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const {
    data: temple,
    isLoading: templeLoading,
  } = usePublicTemple(templeId);

  const {
    data: sevas,
    isLoading: sevasLoading,
    isError,
  } = usePublicSevas({
    templeId: templeId ?? "",
    search: search.trim() || undefined,
    sevaType:
      selectedType === "all"
        ? undefined
        : selectedType,
    limit: 100,
  });

  const sevaTypes = useMemo(() => {
    if (!sevas) {
      return [];
    }

    return Array.from(
      new Set(
        sevas
          .map((seva) => seva.seva_type)
          .filter(Boolean),
      ),
    );
  }, [sevas]);

  const visibleSevas = useMemo(() => {
    if (!sevas) {
      return [];
    }

    return sevas;
  }, [sevas]);

  return (
    <div className="min-h-screen bg-[#fbf7ef]">
      <section className="relative overflow-hidden bg-[#102a43] text-white">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(212,175,55,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#b76e79]/10 blur-3xl" />

        <div className="temple-container relative py-16 sm:py-20">
          <Link
            href={`/temples/${templeId}`}
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#e7c873]"
          >
            ← Back to temple
          </Link>

          <div className="mt-9 max-w-3xl">
            <div className="temple-eyebrow text-[#e7c873]">
              <Heart className="h-4 w-4" />
              Devotional services
            </div>

            <h1 className="temple-heading mt-5 text-5xl text-white sm:text-6xl">
              Sevas
              {temple && (
                <span className="block text-[#e7c873]">
                  at {temple.name}
                </span>
              )}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              Discover the devotional services offered by the temple and
              choose a seva that feels meaningful to your journey.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e7dfd4] bg-white">
        <div className="temple-container py-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a49a92]" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search sevas..."
                className="h-12 w-full rounded-xl border border-[#ddd3c7] bg-[#fbf7ef] pl-12 pr-4 text-sm text-[#332a25] outline-none transition placeholder:text-[#a49a92] focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
              />
            </div>

            {!sevasLoading && sevaTypes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedType("all")}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                    selectedType === "all"
                      ? "bg-[#102a43] text-white"
                      : "border border-[#ddd3c7] bg-white text-[#776b63] hover:border-[#d4af37]"
                  }`}
                >
                  All sevas
                </button>

                {sevaTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold capitalize transition ${
                      selectedType === type
                        ? "bg-[#102a43] text-white"
                        : "border border-[#ddd3c7] bg-white text-[#776b63] hover:border-[#d4af37]"
                  }`}
                >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="temple-section">
        <div className="temple-container">
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="temple-eyebrow text-[#9a6b1f]">
                Offerings
              </p>

              <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
                Choose your seva
              </h2>
            </div>

            {!sevasLoading && sevas && (
              <p className="text-sm text-[#776b63]">
                {visibleSevas.length}{" "}
                {visibleSevas.length === 1
                  ? "seva"
                  : "sevas"}{" "}
                available
              </p>
            )}
          </div>

          {templeLoading || sevasLoading ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#e7dfd4] bg-white"
                >
                  <div className="h-32 animate-pulse bg-[#eee6da]" />

                  <div className="space-y-4 p-7">
                    <div className="h-6 w-2/3 animate-pulse rounded bg-[#eee6da]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#f3eee7]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f3eee7]" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-[#e7c7c7] bg-[#fff7f7] px-6 py-16 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-[#b76e79]" />

              <h2 className="temple-heading mt-5 text-2xl text-[#5d292f]">
                Unable to load sevas
              </h2>

              <p className="mt-3 text-sm text-[#87565d]">
                Please try again shortly.
              </p>
            </div>
          ) : visibleSevas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf4df] text-[#9a6b1f]">
                <Search className="h-7 w-7" />
              </div>

              <h2 className="temple-heading mt-6 text-2xl text-[#332a25]">
                No sevas found
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#776b63]">
                Try another search or select a different seva category.
              </p>

              {(search || selectedType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedType("all");
                  }}
                  className="mt-6 text-sm font-semibold text-[#8a5a16] underline decoration-[#d4af37] underline-offset-4"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {visibleSevas.map((seva) => (
                <article
                  key={seva.id}
                  className="group overflow-hidden rounded-3xl border border-[#e7dfd4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl hover:shadow-[#6b5848]/10"
                >
                  <div className="relative flex h-32 items-center overflow-hidden bg-gradient-to-br from-[#f7ecd1] via-[#fbf7ef] to-[#e8ddd0] px-7">
                    <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(154,107,31,0.15)_1px,transparent_1px)] [background-size:18px_18px]" />

                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#d4af37]/50 bg-white/80 font-serif text-2xl text-[#9a6b1f] shadow-sm">
                      ॐ
                    </div>

                    <span className="relative ml-auto rounded-full border border-[#d4af37]/30 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a6c43]">
                      {seva.seva_type}
                    </span>
                  </div>

                  <div className="p-7">
                    <h3 className="font-serif text-2xl font-semibold leading-tight text-[#332a25] transition group-hover:text-[#8a5a16]">
                      {seva.name}
                    </h3>

                    {seva.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#776b63]">
                        {seva.description}
                      </p>
                    )}

                    <div className="mt-6 space-y-3 border-t border-[#eee7de] pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.14em] text-[#a49a92]">
                          Offering
                        </span>

                        <span className="text-lg font-semibold text-[#8a5a16]">
                          ₹
                          {Number(seva.amount).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>

                      {seva.duration_minutes !== null && (
                        <div className="flex items-center gap-2 text-xs text-[#776b63]">
                          <Clock3 className="h-4 w-4 text-[#9a6b1f]" />
                          {seva.duration_minutes} minutes
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {seva.requires_slot && (
                          <span className="rounded-full bg-[#f4ede2] px-3 py-1 text-[10px] font-semibold text-[#806d5d]">
                            Scheduled slot
                          </span>
                        )}

                        {seva.is_online && (
                          <span className="rounded-full bg-[#e8f0ec] px-3 py-1 text-[10px] font-semibold text-[#46715b]">
                            Online available
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/temples/${templeId}/sevas/${seva.id}/book`}
                      className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#102a43] px-5 text-sm font-semibold text-white transition hover:bg-[#183b5c]"
                    >
                      Continue to booking
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#e7dfd4] bg-[#f4ede2]">
        <div className="temple-container py-16 text-center sm:py-20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#fbf7ef]">
            <span className="font-serif text-2xl text-[#9a6b1f]">
              ॐ
            </span>
          </div>

          <h2 className="temple-heading mt-6 text-3xl text-[#332a25] sm:text-4xl">
            Let your offering become a prayer.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#776b63] sm:text-base">
            Choose a seva and continue your devotional journey.
          </p>
        </div>
      </section>
    </div>
  );
}
