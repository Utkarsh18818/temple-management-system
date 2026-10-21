"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MoonStar,
  RotateCcw,
  Sunrise,
  Sunset,
} from "lucide-react";
import type { DailyPanchang } from "@/lib/panchang";
import { mandir } from "@/config/mandir";
import { Lotus } from "./MandirMark";

function dateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: mandir.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
function time(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: mandir.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(value))
    : "Unavailable";
}
export function Panchang() {
  const [date, setDate] = useState(() => dateKey());
  const [followToday, setFollowToday] = useState(true);
  useEffect(() => {
    if (!followToday) return;
    const timer = setInterval(() => setDate(dateKey()), 60_000);
    return () => clearInterval(timer);
  }, [followToday]);
  const { data, isPending, isError, refetch } = useQuery<DailyPanchang>({
    queryKey: ["mandir-panchang", date],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/panchang?date=${encodeURIComponent(date)}`,
        { signal },
      );
      if (!response.ok) throw new Error("Unable to load Panchang");
      return response.json();
    },
    staleTime: 60_000,
    retry: 1,
  });
  function shiftDate(offset: number) {
    const next = new Date(`${date}T12:00:00+05:30`);
    next.setUTCDate(next.getUTCDate() + offset);
    const key = dateKey(next);
    if (key >= "1900-01-01" && key <= "2100-12-31") {
      setDate(key);
      setFollowToday(false);
    }
  }
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: mandir.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+05:30`));
  const elements = data
    ? [
        {
          label: "Tithi",
          hindi: "तिथि",
          value: data.tithi[0],
          detail: data.paksha,
        },
        { label: "Nakshatra", hindi: "नक्षत्र", value: data.nakshatra[0] },
        { label: "Yoga", hindi: "योग", value: data.yoga[0] },
        { label: "Karana", hindi: "करण", value: data.karana[0] },
      ]
    : [];
  return (
    <section
      id="panchang"
      className="mandir-panchang-section"
      aria-labelledby="panchang-heading"
    >
      <div className="mandir-container">
        <div className="mandir-section-intro">
          <span className="mandir-overline">
            IN HARMONY WITH THE SACRED DAY
          </span>
          <h2 id="panchang-heading">
            Aaj ka <em>Panchang</em>
          </h2>
          <p>The rhythms of the sun, the moon, and your day.</p>
        </div>
        <div className="mandir-panchang">
          <div className="mandir-panchang-date">
            <Lotus />
            <span className="mandir-overline">
              {date === dateKey() ? "TODAY’S PANCHANG" : "DAILY PANCHANG"}
            </span>
            <h3>
              {data?.weekday ??
                new Intl.DateTimeFormat("en-IN", {
                  weekday: "long",
                  timeZone: mandir.timezone,
                }).format(new Date(`${date}T12:00:00+05:30`))}
            </h3>
            <p>{dateLabel}</p>
            <span className="mandir-panchang-location">
              <MapPin size={13} /> Bareilly, Uttar Pradesh · IST
            </span>
            <div className="mandir-date-controls">
              <button
                onClick={() => shiftDate(-1)}
                disabled={date === "1900-01-01"}
                aria-label="Previous day"
              >
                <ChevronLeft size={16} />
              </button>
              <label className="mandir-date-input">
                <CalendarDays size={14} />
                <span>Choose date</span>
                <input
                  type="date"
                  aria-label="Panchang date"
                  value={date}
                  min="1900-01-01"
                  max="2100-12-31"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (
                      value &&
                      value >= "1900-01-01" &&
                      value <= "2100-12-31"
                    ) {
                      setDate(value);
                      setFollowToday(false);
                    }
                  }}
                />
              </label>
              <button
                onClick={() => shiftDate(1)}
                disabled={date === "2100-12-31"}
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {!followToday && (
              <button
                className="mandir-today"
                onClick={() => {
                  setDate(dateKey());
                  setFollowToday(true);
                }}
              >
                <RotateCcw size={11} /> Back to today
              </button>
            )}
          </div>
          <div
            className="mandir-panchang-body"
            aria-live="polite"
            aria-busy={isPending}
          >
            {isPending ? (
              <div className="mandir-panchang-loading">
                <MoonStar size={26} />
                <p>Preparing your daily Panchang…</p>
              </div>
            ) : isError ? (
              <div className="mandir-panchang-loading">
                <p>We couldn’t load the Panchang just now.</p>
                <button className="mandir-text-link" onClick={() => refetch()}>
                  Try again <RotateCcw size={14} />
                </button>
              </div>
            ) : (
              data && (
                <>
                  <div className="mandir-panchang-elements">
                    {elements.map(({ label, hindi, value, detail }) => (
                      <div key={label}>
                        <span className="mandir-panchang-label">
                          {label} <span lang="hi">{hindi}</span>
                        </span>
                        <h4>{value.name}</h4>
                        <p>
                          {detail && `${detail} · `}
                          {`Until ${time(value.endsAt)}${dateKey(new Date(value.endsAt)) !== date ? " (+1 day)" : ""}`}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mandir-sun-times">
                    <div>
                      <Sunrise />
                      <span>
                        Sunrise<strong>{time(data.sunrise)}</strong>
                      </span>
                    </div>
                    <div>
                      <Sunset />
                      <span>
                        Sunset<strong>{time(data.sunset)}</strong>
                      </span>
                    </div>
                    <div>
                      <MoonStar />
                      <span>
                        Rahu Kaal
                        <strong>
                          {data.rahuKaal
                            ? `${time(data.rahuKaal.start)} – ${time(data.rahuKaal.end)}`
                            : "Unavailable"}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <p className="mandir-panchang-note">
                    Calculated at sunrise for Bareilly · Lahiri ayanamsa. For
                    ritual observances, please consult the mandir priest.
                  </p>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
