import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#e6dccd] bg-[#102c4a] text-[#d9d2c8]">

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#b08a45]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#287c72]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link
              href="/"
              className="group inline-flex items-center gap-3"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#d1b06a]/40 bg-[#fffdf8]/10 transition group-hover:border-[#d1b06a]/80">
                <span className="font-devanagari text-2xl text-[#d1b06a]">
                  ॐ
                </span>
              </div>

              <div>
                <div className="font-display text-3xl font-semibold leading-none text-white">
                  TempleOS
                </div>

                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#b9a995]">
                  Temple Management
                </div>
              </div>
            </Link>

            <p className="mt-6 max-w-lg text-sm leading-7 text-[#b9b1a7]">
              A modern digital platform connecting
              devotees with temples, sevas, festivals,
              events and meaningful acts of devotion.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-[#b9b1a7]">
              <Heart className="h-4 w-4 text-[#d1b06a]" />
              <span>
                Built to bring temples closer to devotees.
              </span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d1b06a]">
              Explore
            </h3>

            <div className="mt-5 space-y-3">
              <Link
                href="/temples"
                className="group flex items-center justify-between text-sm text-[#d9d2c8] transition hover:text-white"
              >
                <span>Temples</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>

              <Link
                href="/sevas"
                className="group flex items-center justify-between text-sm text-[#d9d2c8] transition hover:text-white"
              >
                <span>Sevas</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>

              <Link
                href="/events"
                className="group flex items-center justify-between text-sm text-[#d9d2c8] transition hover:text-white"
              >
                <span>Events</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>

              <Link
                href="/festivals"
                className="group flex items-center justify-between text-sm text-[#d9d2c8] transition hover:text-white"
              >
                <span>Festivals</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d1b06a]">
              Account
            </h3>

            <div className="mt-5 space-y-3">
              <Link
                href="/login"
                className="block text-sm text-[#d9d2c8] transition hover:text-white"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="block text-sm text-[#d9d2c8] transition hover:text-white"
              >
                Create Account
              </Link>

              <Link
                href="/donate"
                className="block text-sm text-[#d9d2c8] transition hover:text-white"
              >
                Make a Donation
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 border-t border-white/10 pt-7">

          <div className="flex flex-col gap-4 text-xs text-[#938b82] sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()} TempleOS.
              All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[#d1b06a]" />
              <span>
                Digital infrastructure for modern temples.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
