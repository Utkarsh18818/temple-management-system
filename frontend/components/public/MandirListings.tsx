"use client";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Flower2,
  MapPin,
  Search,
  Video,
} from "lucide-react";
import {
  usePublicEvents,
  usePublicFestivals,
  usePublicSevas,
  usePublicTemples,
} from "@/features/public/hooks";
import { mandir } from "@/config/mandir";
import { PublicPageHero } from "./PublicPageHero";
import { useTemplePortal } from "@/features/public/TempleContext";
import { useRouter } from "next/navigation";

const content = {
  sevas: {
    eyebrow: "SEVA & OFFERINGS",
    title: "An offering of",
    accent: "the heart.",
    description:
      "Find a meaningful way to express your devotion. Explore seva offerings and reserve your place in worship.",
  },
  events: {
    eyebrow: "UTSAV & EVENTS",
    title: "Shared moments.",
    accent: "Sacred memories.",
    description:
      "Join in prayer, celebration, and the joy of community. Discover the programmes published by your temple.",
  },
  festivals: {
    eyebrow: "FESTIVALS & CELEBRATIONS",
    title: "Traditions that",
    accent: "bring us together.",
    description:
      "Celebrate the sacred occasions that fill our lives with colour, gratitude, and devotion.",
  },
};
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: mandir.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00+05:30`));
}
function timeLabel(value: string) {
  const [hour, minute] = value.split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? "pm" : "am"}`;
}
export function MandirListings({ type }: { type: keyof typeof content }) {
  const portal = useTemplePortal();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const temples = usePublicTemples({ limit: 100 });
  const templeId = portal.templeId;
  const sevas = usePublicSevas({
    templeId: type === "sevas" ? templeId : "",
    limit: 100,
  });
  const events = usePublicEvents({
    templeId: type === "events" ? templeId : "",
    limit: 100,
  });
  const festivals = usePublicFestivals({
    templeId: type === "festivals" ? templeId : "",
    limit: 100,
  });
  const current =
    type === "sevas" ? sevas : type === "events" ? events : festivals;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: mandir.timezone,
  }).format(new Date());
  const query = search.trim().toLowerCase();
  const sevaItems =
    sevas.data?.filter((item) =>
      `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query),
    ) ?? [];
  const eventItems =
    events.data
      ?.filter(
        (item) =>
          (showPast || item.event_date >= today) &&
          `${item.name} ${item.description ?? ""}`
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) => a.event_date.localeCompare(b.event_date)) ?? [];
  const festivalItems =
    festivals.data
      ?.filter(
        (item) =>
          (showPast || (item.end_date ?? item.start_date) >= today) &&
          `${item.name} ${item.description ?? ""}`
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date)) ?? [];
  const count =
    type === "sevas"
      ? sevaItems.length
      : type === "events"
        ? eventItems.length
        : festivalItems.length;
  return (
    <div className="mandir-listing-page">
      <PublicPageHero {...content[type]} />
      <div className="mandir-container mandir-listing-body">
        {type !== "sevas" && (
          <nav className="mandir-calendar-tabs" aria-label="Temple calendar">
            <Link
              href="/events"
              aria-current={type === "events" ? "page" : undefined}
            >
              Events & programmes
            </Link>
            <Link
              href="/festivals"
              aria-current={type === "festivals" ? "page" : undefined}
            >
              Festivals
            </Link>
            {portal.isPrimary && <Link href="/#panchang">
              Daily Panchang <ArrowRight size={13} />
            </Link>}
          </nav>
        )}
        <div className="mandir-listing-filters">
          <label>
            <span>Temple</span>
            <select
              aria-label="Temple"
              value={templeId}
              onChange={(event) => { if(event.target.value) router.push(`/${type}?temple_id=${event.target.value}`); }}
              disabled={temples.isLoading}
            >
              <option value="">
                {temples.isLoading
                  ? "Loading temples…"
                  : "Choose a listed temple"}
              </option>
              {temples.data?.map((temple) => (
                <option key={temple.id} value={temple.id}>
                  {temple.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Find {type}</span>
            <span className="mandir-search-field">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${type}…`}
                aria-label={`Search ${type}`}
              />
            </span>
          </label>
          {type !== "sevas" && (
            <label className="mandir-past-toggle">
              <input
                type="checkbox"
                checked={showPast}
                onChange={(event) => setShowPast(event.target.checked)}
              />{" "}
              Include past dates
            </label>
          )}
        </div>
        {temples.isError || (templeId && current.isError) ? (
          <div className="mandir-empty">
            <Flower2 />
            <h2>We couldn’t load the listings.</h2>
            <p>Please try again in a moment.</p>
            <button
              className="mandir-text-link"
              onClick={() =>
                temples.isError ? temples.refetch() : current.refetch()
              }
            >
              Try again <ArrowRight size={14} />
            </button>
          </div>
        ) : temples.isLoading || (templeId && current.isLoading) ? (
          <div className="mandir-empty" role="status">
            <Flower2 />
            <p>Preparing the {type} listings…</p>
          </div>
        ) : !templeId ? (
          <div className="mandir-empty">
            <Flower2 />
            <h2>
              {type === "sevas"
                ? "A little patience. A heartfelt offering."
                : "New celebrations will find a place here."}
            </h2>
            <p>
              The SRMS mandir’s online{" "}
              {type === "sevas" ? "seva offerings" : "calendar"} will appear
              when its profile is published. You can also choose another listed
              temple above.
            </p>
            <Link className="mandir-text-link" href="/#visit">
              Plan a visit to the mandir <ArrowRight size={14} />
            </Link>
          </div>
        ) : count === 0 ? (
          <div className="mandir-empty">
            <CalendarDays />
            <h2>
              {query
                ? "No matching listings"
                : `No ${type === "sevas" ? "sevas available" : `upcoming ${type}`} just yet.`}
            </h2>
            <p>
              {query
                ? "Try a different search term."
                : "Please check back for new announcements from the temple office."}
            </p>
            {query && (
              <button
                className="mandir-text-link"
                onClick={() => setSearch("")}
              >
                Clear search <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mandir-listing-count">
              {count}{" "}
              {type === "sevas" ? "devotional offerings" : "published listings"}
            </div>
            <div className="mandir-service-grid">
              {type === "sevas" &&
                sevaItems.map((item, index) => (
                  <article className="mandir-service-card" key={item.id}>
                    <div className="mandir-offering-top">
                      <Flower2 strokeWidth={1.2} />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <span className="mandir-overline">
                      {item.seva_type.replaceAll("_", " ")}
                    </span>
                    <h2>{item.name}</h2>
                    {item.description && <p>{item.description}</p>}
                    <div className="mandir-service-bottom">
                      <strong>
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </strong>
                      <Link
                        className="mandir-text-link"
                        href={`/sevas/${item.id}`}
                      >
                        View seva <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                ))}
              {type === "events" &&
                eventItems.map((item) => (
                  <article className="mandir-service-card" key={item.id}>
                    <span className="mandir-overline">
                      <CalendarDays size={13} />
                      {dateLabel(item.event_date)}
                    </span>
                    <h2>{item.name}</h2>
                    {item.description && <p>{item.description}</p>}
                    <div className="mandir-event-meta">
                      <span>
                        <Clock3 size={14} /> {timeLabel(item.start_time)}
                        {item.end_time ? ` – ${timeLabel(item.end_time)}` : ""}
                      </span>
                      {item.location && (
                        <span>
                          <MapPin size={14} /> {item.location}
                        </span>
                      )}
                      {item.is_online && (
                        <span>
                          <Video size={14} /> Online
                        </span>
                      )}
                      {item.organizer && (
                        <span>Organised by {item.organizer}</span>
                      )}
                    </div>
                  </article>
                ))}
              {type === "festivals" &&
                festivalItems.map((item) => (
                  <article className="mandir-service-card" key={item.id}>
                    <Flower2
                      strokeWidth={1.2}
                      className="mandir-festival-icon"
                    />
                    <h2>{item.name}</h2>
                    {item.description && <p>{item.description}</p>}
                    <div className="mandir-event-meta">
                      <span>
                        <CalendarDays size={14} />
                        {dateLabel(item.start_date)}
                        {item.end_date && item.end_date !== item.start_date
                          ? ` – ${dateLabel(item.end_date)}`
                          : ""}
                      </span>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
