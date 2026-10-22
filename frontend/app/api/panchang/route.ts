import {
  calculatePanchang,
  indiaDateKey,
  isValidPanchangDate,
} from "@/lib/panchang";
const days = new Map<string, ReturnType<typeof calculatePanchang>>();
export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("date");
  const date = requestedDate ?? indiaDateKey();
  if (!isValidPanchangDate(date))
    return Response.json(
      { detail: "Choose a valid date between 1900 and 2100." },
      { status: 400 },
    );
  try {
    if (!days.has(date)) {
      if (days.size >= 64) days.delete(days.keys().next().value!);
      days.set(date, calculatePanchang(date));
    }
    return Response.json(days.get(date), {
      headers: { "Cache-Control": requestedDate
        ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
        : "public, max-age=60, s-maxage=60" },
    });
  } catch {
    return Response.json(
      { detail: "The Panchang could not be calculated. Please try again." },
      { status: 503 },
    );
  }
}
