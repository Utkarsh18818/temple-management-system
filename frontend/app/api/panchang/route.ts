import {
  calculatePanchang,
  indiaDateKey,
  isValidPanchangDate,
} from "@/lib/panchang";
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? indiaDateKey();
  if (!isValidPanchangDate(date))
    return Response.json(
      { detail: "Choose a valid date between 1900 and 2100." },
      { status: 400 },
    );
  try {
    return Response.json(calculatePanchang(date), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { detail: "The Panchang could not be calculated. Please try again." },
      { status: 503 },
    );
  }
}
