"use client";
import { Suspense } from "react";
import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import { getPublicSeva } from "@/features/public/api";

function LegacySevaBookingPage() {
  const router = useRouter();
  const params = useParams<{ sevaId: string }>();
  const searchParams = useSearchParams();

  const sevaId = params?.sevaId;
  const slotId = searchParams.get("slotId");

  useEffect(() => {
    let cancelled = false;

    async function redirectToCanonicalBooking() {
      if (!sevaId) {
        router.replace("/sevas");
        return;
      }

      try {
        const seva = await getPublicSeva(sevaId);

        if (cancelled) {
          return;
        }

        const target = `/temples/${seva.temple_id}/sevas/${seva.id}/book${
          slotId ? `?slotId=${encodeURIComponent(slotId)}` : ""
        }`;

        router.replace(target);
      } catch {
        if (!cancelled) {
          router.replace("/sevas");
        }
      }
    }

    redirectToCanonicalBooking();

    return () => {
      cancelled = true;
    };
  }, [router, sevaId, slotId]);

  return (
    <main className="min-h-[60vh] bg-stone-50">
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-orange-600" />
          <p className="text-sm text-stone-500">
            Preparing your booking...
          </p>
        </div>
      </div>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-stone-500">Loading...</div>
        </div>
      }
    >
      <LegacySevaBookingPage />
    </Suspense>
  );
}
