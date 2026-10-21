"use client";

import { TempleLink as Link } from "@/features/public/TempleContext";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  Heart,
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

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function TempleDetailPage() {
  const params = useParams<{ templeId: string }>();
  const templeId = params?.templeId;

  const {
    data: temple,
    isLoading: templeLoading,
    isError: templeError,
  } = usePublicTemple(templeId);

  const {
    data: sevas,
    isLoading: sevasLoading,
  } = usePublicSevas({
    templeId: templeId ?? "",
    limit: 6,
  });

  const {
    data: events,
    isLoading: eventsLoading,
  } = usePublicEvents({
    templeId: templeId ?? "",
    limit: 4,
  });

  const {
    data: festivals,
    isLoading: festivalsLoading,
  } = usePublicFestivals({
    templeId: templeId ?? "",
    limit: 4,
  });

  if (templeLoading) {
    return (
      <div className="min-h-screen bg-[#fbf7ef]">
        <section className="bg-[#762d36]">
          <div className="temple-container py-24">
            <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
            <div className="mt-6 h-14 max-w-2xl animate-pulse rounded bg-white/10" />
            <div className="mt-5 h-5 max-w-xl animate-pulse rounded bg-white/10" />
          </div>
        </section>

        <section className="temple-section">
          <div className="temple-container">
            <div className="grid gap-7 lg:grid-cols-3">
              <div className="h-72 animate-pulse rounded-3xl bg-[#eee6da] lg:col-span-2" />
              <div className="h-72 animate-pulse rounded-3xl bg-[#eee6da]" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (templeError || !temple) {
    return (
      <div className="min-h-screen bg-[#fbf7ef]">
        <section className="temple-section">
          <div className="temple-container py-24 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-[#b76e79]" />

            <h1 className="temple-heading mt-6 text-3xl text-[#332a25]">
              Temple not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#776b63]">
              We could not load this temple right now. Please return to the
              temple directory and try again.
            </p>

            <Link
              href="/temples"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#762d36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5b242d]"
            >
              Explore temples
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const location = [
    temple.city,
    temple.state,
    temple.country,
  ]
    .filter(Boolean)
    .join(", ");

  const address = [
    temple.address,
    temple.city,
    temple.state,
    temple.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#fbf7ef]">
      <PublicPageHero eyebrow={location || "TEMPLE DIRECTORY"} title={temple.name} description={temple.description || "Discover worship, devotional services, and celebrations at this temple."} />

      <section className="border-b border-[#e7dfd4] bg-white">
        <div className="temple-container">
          <div className="grid divide-y divide-[#e7dfd4] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Link
              href={`/temples/${temple.id}/sevas`}
              className="group flex items-center justify-between px-2 py-6 sm:px-7"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf4df] text-[#9a6b1f]">
                  <Heart className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-[#332a25]">
                    Explore Sevas
                  </p>
                  <p className="mt-1 text-xs text-[#8b8077]">
                    Discover devotional services
                  </p>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-[#aaa097] transition group-hover:translate-x-1 group-hover:text-[#9a6b1f]" />
            </Link>

            <a
              href="#events"
              className="group flex items-center justify-between px-2 py-6 sm:px-7"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8e9ec] text-[#a85e69]">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-[#332a25]">
                    Events & Festivals
                  </p>
                  <p className="mt-1 text-xs text-[#8b8077]">
                    See upcoming temple activities
                  </p>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-[#aaa097] transition group-hover:translate-x-1 group-hover:text-[#9a6b1f]" />
            </a>

            <a
              href="#visit"
              className="group flex items-center justify-between px-2 py-6 sm:px-7"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0ec] text-[#46715b]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-[#332a25]">
                    Plan Your Visit
                  </p>
                  <p className="mt-1 text-xs text-[#8b8077]">
                    Temple contact and location
                  </p>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-[#aaa097] transition group-hover:translate-x-1 group-hover:text-[#9a6b1f]" />
            </a>
          </div>
        </div>
      </section>

      <section className="temple-section">
        <div className="temple-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="temple-eyebrow text-[#9a6b1f]">
                Devotional services
              </p>

              <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
                Sevas at this temple
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#776b63]">
                Participate in the devotional services currently offered by
                this temple.
              </p>
            </div>

            <Link
              href={`/temples/${temple.id}/sevas`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a5a16]"
            >
              View all sevas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {sevasLoading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl bg-[#eee6da]"
                />
              ))}
            </div>
          ) : sevas && sevas.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sevas.map((seva) => (
                <Link
                  key={seva.id}
                  href={`/temples/${temple.id}/sevas/${seva.id}/book`}
                  className="group rounded-3xl border border-[#e7dfd4] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-xl hover:shadow-[#6b5848]/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf4df] font-serif text-xl text-[#9a6b1f]">
                      ॐ
                    </div>

                    <span className="rounded-full bg-[#f4ede2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7665]">
                      {seva.seva_type}
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-2xl font-semibold text-[#332a25] transition group-hover:text-[#8a5a16]">
                    {seva.name}
                  </h3>

                  {seva.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#776b63]">
                      {seva.description}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-[#eee7de] pt-5">
                    <span className="font-semibold text-[#8a5a16]">
                      ₹{Number(seva.amount).toLocaleString("en-IN")}
                    </span>

                    <span className="flex items-center gap-1 text-xs font-semibold text-[#8a5a16]">
                      Book
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-14 text-center">
              <Heart className="mx-auto h-8 w-8 text-[#c5b49f]" />
              <p className="mt-4 text-sm text-[#776b63]">
                No sevas are currently available at this temple.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        id="events"
        className="border-y border-[#e7dfd4] bg-[#f4ede2]"
      >
        <div className="temple-container py-16 sm:py-20">
          <div>
            <p className="temple-eyebrow text-[#9a6b1f]">
              Temple calendar
            </p>

            <h2 className="temple-heading mt-2 text-3xl text-[#332a25] sm:text-4xl">
              Events & festivals
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#776b63]">
              Stay connected with celebrations and activities published by
              this temple.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {eventsLoading || festivalsLoading ? (
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-3xl bg-white"
                  />
                ))}
              </>
            ) : (
              <>
                {events?.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm"
                  >
                    <div className="flex gap-5">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#762d36] text-white">
                        <CalendarDays className="h-5 w-5 text-[#e7c873]" />
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">
                          Event
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-xl font-semibold text-[#332a25]">
                          {event.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#776b63]">
                          <span>{formatDate(event.event_date)}</span>

                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTime(event.start_time)}
                            {event.end_time
                              ? ` – ${formatTime(event.end_time)}`
                              : ""}
                          </span>

                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#776b63]">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {festivals?.map((festival) => (
                  <div
                    key={festival.id}
                    className="rounded-3xl border border-[#e7dfd4] bg-white p-6 shadow-sm"
                  >
                    <div className="flex gap-5">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#8a5a16] text-white">
                        <Sparkles className="h-5 w-5 text-[#f7df93]" />
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">
                          Festival
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-xl font-semibold text-[#332a25]">
                          {festival.name}
                        </h3>

                        <p className="mt-2 text-xs text-[#776b63]">
                          {formatDate(festival.start_date)}
                          {" – "}
                          {formatDate(festival.end_date)}
                        </p>

                        {(festival.location || festival.deity) && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#776b63]">
                            {festival.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {festival.location}
                              </span>
                            )}

                            {festival.deity && (
                              <span>Deity: {festival.deity}</span>
                            )}
                          </div>
                        )}

                        {festival.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#776b63]">
                            {festival.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(!events || events.length === 0) &&
                  (!festivals || festivals.length === 0) && (
                    <div className="rounded-3xl border border-dashed border-[#d9cec0] bg-white px-6 py-14 text-center lg:col-span-2">
                      <CalendarDays className="mx-auto h-8 w-8 text-[#c5b49f]" />
                      <p className="mt-4 text-sm text-[#776b63]">
                        No upcoming events or festivals are currently
                        published for this temple.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </section>

      <section id="visit" className="temple-section">
        <div className="temple-container">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl bg-[#762d36] p-8 text-white sm:p-10">
              <p className="temple-eyebrow text-[#e7c873]">
                Plan your visit
              </p>

              <h2 className="temple-heading mt-4 text-3xl text-white sm:text-4xl">
                Come with devotion.
                <span className="block text-[#e7c873]">
                  Leave with memories.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
                Find the temple location and official contact information
                before beginning your journey.
              </p>

              <div className="mt-8 space-y-5">
                {address && (
                  <div className="flex gap-4">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#e7c873]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                        Address
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/80">
                        {address}
                      </p>
                    </div>
                  </div>
                )}

                {temple.phone && (
                  <div className="flex gap-4">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[#e7c873]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                        Phone
                      </p>
                      <a
                        href={`tel:${temple.phone}`}
                        className="mt-1 block text-sm text-white/80 transition hover:text-[#e7c873]"
                      >
                        {temple.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e7dfd4] bg-white p-8 shadow-sm sm:p-10">
              <p className="temple-eyebrow text-[#9a6b1f]">
                Temple information
              </p>

              <div className="mt-7 space-y-5">
                {temple.email && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                      Email
                    </p>
                    <a
                      href={`mailto:${temple.email}`}
                      className="mt-1 block break-all text-sm font-medium text-[#332a25] hover:text-[#8a5a16]"
                    >
                      {temple.email}
                    </a>
                  </div>
                )}

                {temple.website && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                      Website
                    </p>
                    <a
                      href={temple.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[#8a5a16]"
                    >
                      Visit official website
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                    Temple code
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#332a25]">
                    {temple.code}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a49a92]">
                    Timezone
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#332a25]">
                    {temple.timezone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e7dfd4] bg-[#f4ede2]">
        <div className="temple-container py-16 text-center sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#fbf7ef]">
            <Heart className="h-6 w-6 text-[#9a6b1f]" />
          </div>

          <h2 className="temple-heading mt-6 text-3xl text-[#332a25] sm:text-4xl">
            Support the temple
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#776b63] sm:text-base">
            Offer your contribution and become part of the temple&apos;s
            journey of service.
          </p>

          <Link
            href={`/donate?temple_id=${temple.id}`}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#762d36] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#762d36]/15 transition hover:bg-[#5b242d]"
          >
            Make a donation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
