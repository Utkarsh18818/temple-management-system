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

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(false);

  const displayName =
    devotee?.first_name ||
    "Devotee";

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
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex h-20 items-center justify-between">

          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-2xl text-white shadow-sm">
              ॐ
            </div>

            <div className="hidden sm:block">
              <div className="text-lg font-semibold tracking-tight text-stone-900">
                TempleOS
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">
                Temple Management
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">

            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-stone-100" />
            ) : isAuthenticated ? (
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setAccountOpen(
                      (value) => !value,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-sm text-white">
                    {displayName
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="max-w-28 truncate">
                    {displayName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      accountOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white py-2 shadow-xl"
                    role="menu"
                  >
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="text-xs text-stone-400">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-stone-900">
                        {devotee?.first_name}{" "}
                        {devotee?.last_name || ""}
                      </p>

                      {devotee?.email && (
                        <p className="mt-0.5 truncate text-xs text-stone-500">
                          {devotee.email}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/account"
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                      role="menuitem"
                    >
                      <User size={17} />
                      My Account
                    </Link>

                    <Link
                      href="/account/bookings"
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                      role="menuitem"
                    >
                      My Bookings
                    </Link>

                    <Link
                      href="/account/donations"
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                      role="menuitem"
                    >
                      My Donations
                    </Link>

                    <Link
                      href="/account/receipts"
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                      role="menuitem"
                    >
                      My Receipts
                    </Link>

                    <div className="my-1 border-t border-stone-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
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
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  <LogIn size={17} />
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  <UserPlus size={17} />
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (value) => !value,
              )
            }
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-stone-100 py-4 lg:hidden">

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-stone-100 pt-4">

              {isLoading ? (
                <div className="h-11 animate-pulse rounded-xl bg-stone-100" />
              ) : isAuthenticated ? (
                <div className="space-y-1">

                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 text-sm text-white">
                      {displayName
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {devotee?.first_name}{" "}
                        {devotee?.last_name || ""}
                      </p>

                      <p className="truncate text-xs text-stone-500">
                        {devotee?.email || ""}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    My Account
                  </Link>

                  <Link
                    href="/account/bookings"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    My Bookings
                  </Link>

                  <Link
                    href="/account/donations"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    My Donations
                  </Link>

                  <Link
                    href="/account/receipts"
                    onClick={closeMobileMenu}
                    className="block rounded-xl px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    My Receipts
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
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
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700"
                  >
                    <LogIn size={17} />
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
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