import { panchangAtSunrise } from "@grahan/vedic";
import { mandir } from "../config/mandir";

export function indiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: mandir.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function isValidPanchangDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00+05:30`);
  return (
    !Number.isNaN(date.getTime()) &&
    indiaDateKey(date) === value &&
    date.getUTCFullYear() >= 1900 &&
    date.getUTCFullYear() <= 2100
  );
}
export function calculatePanchang(date: string) {
  if (!isValidPanchangDate(date))
    throw new Error("Choose a valid date between 1900 and 2100.");
  const [year, month, day] = date.split("-").map(Number);
  const result = panchangAtSunrise({
    year,
    month,
    day,
    latitude: mandir.latitude,
    longitude: mandir.longitude,
    timezone: mandir.timezone,
  });
  const spans = (items: { name: string; endsAt: Date }[]) =>
    items.map(({ name, endsAt }) => ({ name, endsAt: endsAt.toISOString() }));
  return {
    date,
    location: "Bareilly, Uttar Pradesh",
    timezone: mandir.timezone,
    method: "Sunrise Panchang · Lahiri ayanamsa",
    weekday: result.vaar.name,
    paksha:
      result.tithi[0].paksha === "shukla" ? "Shukla Paksha" : "Krishna Paksha",
    tithi: spans(result.tithi),
    nakshatra: spans(result.nakshatra),
    yoga: spans(result.yoga),
    karana: spans(result.karana),
    sunrise: result.sunrise?.toISOString() ?? null,
    sunset: result.sunset?.toISOString() ?? null,
    rahuKaal: result.rahuKaal
      ? {
          start: result.rahuKaal.start.toISOString(),
          end: result.rahuKaal.end.toISOString(),
        }
      : null,
  };
}
export type DailyPanchang = ReturnType<typeof calculatePanchang>;
