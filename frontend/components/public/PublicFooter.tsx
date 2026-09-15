import Link from "next/link";
import {
  Heart,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white">
                <span className="font-display text-xl">
                  ॐ
                </span>
              </div>

              <span className="font-display text-2xl font-semibold text-white">
                TempleOS
              </span>
            </Link>

            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-400">
              A modern digital platform connecting
              devotees with temples, sevas, festivals,
              events and meaningful acts of devotion.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-stone-400">
              <Heart className="h-4 w-4 text-amber-500" />
              <span>
                Built to bring temples closer to devotees.
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <Link
                href="/temples"
                className="block transition hover:text-amber-400"
              >
                Temples
              </Link>

              <Link
                href="/sevas"
                className="block transition hover:text-amber-400"
              >
                Sevas
              </Link>

              <Link
                href="/events"
                className="block transition hover:text-amber-400"
              >
                Events
              </Link>

              <Link
                href="/festivals"
                className="block transition hover:text-amber-400"
              >
                Festivals
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Account
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <Link
                href="/login"
                className="block transition hover:text-amber-400"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="block transition hover:text-amber-400"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} TempleOS.
            All rights reserved.
          </p>

          <p>
            Digital infrastructure for modern temples.
          </p>
        </div>
      </div>
    </footer>
  );
}
