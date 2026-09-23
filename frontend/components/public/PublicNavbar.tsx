"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";

import { usePublicAuth } from "@/features/public/PublicAuthContext";

const navigation = [
  {
    label: "Temples",
    href: "/temples",
  },
  {
    label: "Sevas",
    href: "/sevas",
  },
  {
    label: "Events",
    href: "/events",
  },
  {
    label: "Festivals",
    href: "/festivals",
  },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    devotee,
    isAuthenticated,
    isLoading,
    logout,
  } = usePublicAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const displayName = devotee?.first_name || "Devotee";

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    setAccountOpen(false);
    closeMobileMenu();

    router.replace("/");
  }

  function isActive(href: string) {
    if (href === "/temples") {
      return (
        pathname === "/temples" ||
        pathname.startsWith("/temples/")
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6dccd]/80 bg-[#fbf7ef]/95 shadow-[0_1px_0_rgba(176,138,69,0.08)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex h-[76px] items-center justify-between">

          {/* Brand */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#b08a45]/35 bg-[#fffdf8] shadow-[0_4px_16px_rgba(89,72,61,0.10)] transition duration-300 group-hover:border-[#b08a45]/70 group-hover:shadow-[0_6px_20px_rgba(176,138,69,0.18)]">
              <span className="font-devanagari text-xl text-[#183b63]">
                ॐ
              </span>

              <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b08a45]" />
            </div>

            <div className="hidden sm:block">
              <div className="font-display text-[25px] font-semibold leading-none tracking-tight text-[#332a25]">
                TempleOS
              </div>

              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8b7a6d]">
                Temple Management
              </div>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-[#183b63]"
                      : "text-[#74685f] hover:text-[#183b63]"
                  }`}
                >
                  {item.label}

                  <span
                    className={`absolute inset-x-4 bottom-1 h-px origin-center bg-[#b08a45] transition-transform duration-200 ${
                      active
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop account actions */}
          <div className="hidden items-center gap-2 lg:flex">

            {isLoading ? (
              <div className="h-10 w-28 animate-pulse rounded-xl bg-[#f3ecdf]" />
            ) : isAuthenticated ? (
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setAccountOpen((value) => !value)
                  }
                  className="flex items-center gap-2 rounded-xl border border-[#e6dccd] bg-[#fffdf8] px-2.5 py-2 text-sm font-medium text-[#59483d] shadow-sm transition-all duration-200 hover:border-[#b08a45]/45 hover:shadow-md"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#183b63] font-semibold text-sm text-white">
                    {displayName
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="max-w-28 truncate">
                    {displayName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-[#8b7a6d] transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-[#e6dccd] bg-[#fffdf8] py-2 shadow-[0_18px_50px_rgba(51,42,37,0.14)]"
                    role="menu"
                  >
                    <div className="border-b border-[#eee5d8] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a08f82]">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate font-display text-lg font-semibold text-[#332a25]">
                        {devotee?.first_name}{" "}
                        {devotee?.last_name || ""}
                      </p>

                      {devotee?.email && (
                        <p className="mt-0.5 truncate text-xs text-[#74685f]">
                          {devotee.email}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#59483d] transition hover:bg-[#f7f0e5] hover:text-[#183b63]"
                      role="menuitem"
                    >
                      <User size={17} />
                      My Account
                    </Link>

                    <Link
                      href="/account/bookings"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#59483d] transition hover:bg-[#f7f0e5] hover:text-[#183b63]"
                      role="menuitem"
                    >
                      My Bookings
                    </Link>

                    <Link
                      href="/account/donations"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#59483d] transition hover:bg-[#f7f0e5] hover:text-[#183b63]"
                      role="menuitem"
                    >
                      My Donations
                    </Link>

                    <Link
                      href="/account/receipts"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#59483d] transition hover:bg-[#f7f0e5] hover:text-[#183b63]"
                      role="menuitem"
                    >
                      My Receipts
                    </Link>

                    <div className="my-1 border-t border-[#eee5d8]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#a9445d] transition hover:bg-[#fff1f3]"
                      role="menuitem"
                    >
                      <LogOut size={17} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#59483d] transition hover:bg-[#f3ecdf] hover:text-[#183b63]"
                >
                  <LogIn size={17} />
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-xl bg-[#183b63] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(24,59,99,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#102c4a] hover:shadow-[0_8px_20px_rgba(24,59,99,0.24)]"
                >
                  <UserPlus size={17} />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() =>
              setMobileOpen((value) => !value)
            }
            className="rounded-xl border border-[#e6dccd] bg-[#fffdf8] p-2.5 text-[#59483d] shadow-sm transition hover:border-[#b08a45]/50 hover:text-[#183b63] lg:hidden"
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-[#e6dccd] py-4 lg:hidden">

            <nav className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#f3ecdf] text-[#183b63]"
                        : "text-[#59483d] hover:bg-[#f7f0e5]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-[#e6dccd] pt-4">

              {isLoading ? (
                <div className="h-11 animate-pulse rounded-xl bg-[#f3ecdf]" />
              ) : isAuthenticated ? (
                <div className="space-y-1">

                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#e6dccd] bg-[#fffdf8] px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#183b63] text-sm font-semibold text-white">
                      {displayName
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#332a25]">
                        {devotee?.first_name}{" "}
                        {devotee?.last_name || ""}
                      </p>

                      <p className="truncate text-xs text-[#74685f]">
                        {devotee?.email || ""}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-[#59483d] transition hover:bg-[#f7f0e5]"
                  >
                    My Account
                  </Link>

                  <Link
                    href="/account/bookings"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-[#59483d] transition hover:bg-[#f7f0e5]"
                  >
                    My Bookings
                  </Link>

                  <Link
                    href="/account/donations"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-[#59483d] transition hover:bg-[#f7f0e5]"
                  >
                    My Donations
                  </Link>

                  <Link
                    href="/account/receipts"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-[#59483d] transition hover:bg-[#f7f0e5]"
                  >
                    My Receipts
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-[#a9445d] transition hover:bg-[#fff1f3]"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">

                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#d9cebe] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#59483d] transition hover:border-[#b08a45]/50"
                  >
                    <LogIn size={17} />
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#183b63] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#102c4a]"
                  >
                    <UserPlus size={17} />
                    Register
                  </Link>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
