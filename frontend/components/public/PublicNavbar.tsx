"use client";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Menu, UserRound, X, LogOut } from "lucide-react";
import { useState } from "react";
import { usePublicAuth } from "@/features/public/PublicAuthContext";
import { MandirMark } from "./MandirMark";
import { mandir } from "@/config/mandir";
import { useTemplePortal } from "@/features/public/TempleContext";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Our Mandir", href: "/#our-mandir" },
  { label: "Seva & Offerings", href: "/sevas" },
  { label: "Utsav & Events", href: "/events" },
  { label: "Panchang", href: "/#panchang" },
];
export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { devotee, isAuthenticated, isLoading, logout } = usePublicAuth();
  const portal = useTemplePortal();
  if(portal.temple && !portal.isPrimary) return <>
    <a href="#main-content" className="mandir-skip">Skip to content</a>
    <div className="mandir-topbar"><div className="mandir-container"><span>Temple portal</span><Link href="/temples">Choose another temple</Link></div></div>
    <header className="mandir-header"><div className="mandir-container mandir-nav flex-wrap gap-3">
      <Link href={portal.home} className="mandir-brand"><span className="mandir-brand-mark"><MandirMark/></span><span><strong>{portal.temple.name}</strong><small>{[portal.temple.city,portal.temple.state].filter(Boolean).join(" · ") || "DEVOTEE PORTAL"}</small></span></Link>
      <nav aria-label="Temple navigation" className="flex flex-wrap items-center gap-4 text-sm"><Link href={portal.home}>Home</Link><Link href={`/temples/${portal.templeId}/sevas`}>Sevas</Link><Link href="/events">Events</Link><Link href="/festivals">Festivals</Link></nav>
      <div className="mandir-nav-actions"><Link href={isAuthenticated?"/account":"/login"}>{isAuthenticated?`${devotee?.first_name}'s account`:"Sign in"}</Link><Link href="/donate" className="mandir-button mandir-button-small">Donate</Link>{isAuthenticated && <button type="button" onClick={logout} className="mandir-logout">Log out</button>}</div>
    </div></header>
  </>;
  return (
    <>
      <a href="#main-content" className="mandir-skip">
        Skip to content
      </a>
      <div className="mandir-topbar">
        <div className="mandir-container">
          <span lang="hi">हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे</span>
          <a href={mandir.directions} target="_blank" rel="noreferrer">
            <MapPin size={12} /> SRMS CET · Bareilly, India
          </a>
        </div>
      </div>
      <header className="mandir-header">
        <div className="mandir-container mandir-nav">
          <Link
            href="/"
            className="mandir-brand"
            onClick={() => setMobileOpen(false)}
            aria-label={`${mandir.name} home`}
          >
            <span className="mandir-brand-mark">
              <MandirMark />
            </span>
            <span>
              <strong>
                Radha Krishna <em>Mandir</em>
              </strong>
              <small>SHRI RAM MURTI SMARAK · BAREILLY</small>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="mandir-desktop-nav">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={pathname === item.href ? "is-active" : ""}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mandir-nav-actions">
            {isAuthenticated && (
              <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="mandir-logout">
                <LogOut size={16} aria-hidden="true" /> Log out
              </button>
            )}
            {isLoading ? (
              <span
                className="mandir-auth-loading"
                aria-label="Loading account"
              />
            ) : (
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="mandir-account"
                aria-label={
                  isAuthenticated
                    ? `${devotee?.first_name || "Devotee"}'s account`
                    : "Sign in"
                }
              >
                <UserRound size={19} />
              </Link>
            )}
            <Link href="/donate" className="mandir-button mandir-button-small">
              <Heart size={14} /> Donate
            </Link>
            <button
              className="mandir-menu-toggle"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mandir-mobile-nav"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav
            className="mandir-mobile-nav"
            id="mandir-mobile-nav"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/#visit" onClick={() => setMobileOpen(false)}>
              Plan your visit
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              onClick={() => setMobileOpen(false)}
            >
              {isAuthenticated ? "My account" : "Sign in / Register"}
            </Link>
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
              >
                <LogOut size={16} /> Log out
              </button>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
