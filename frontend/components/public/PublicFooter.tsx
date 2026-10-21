"use client";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { useTemplePortal } from "@/features/public/TempleContext";
import { ArrowUpRight, MapPin } from "lucide-react";
import { mandir } from "@/config/mandir";
import { Lotus, MandirMark } from "./MandirMark";
export function PublicFooter() {
  const portal = useTemplePortal();
  if(portal.temple && !portal.isPrimary) return <footer className="mandir-footer"><div className="mandir-container py-10"><h2 className="font-display text-3xl text-white">{portal.temple.name}</h2><p className="mt-3">{[portal.temple.address,portal.temple.city,portal.temple.state].filter(Boolean).join(", ")}</p><nav className="mt-6 flex flex-wrap gap-5" aria-label="Temple footer"><Link href={portal.home}>Temple home</Link><Link href="/login">Sign in</Link><Link href="/register">Register with this temple</Link><Link href="/account/bookings">My bookings</Link><Link href="/account/receipts">My receipts</Link><Link href="/temples">Choose another temple</Link></nav><p className="mt-6 text-xs">Accounts, bookings, donations and receipts belong to this temple only.</p></div></footer>;
  return (
    <footer className="mandir-footer">
      <div className="mandir-container">
        <div className="mandir-footer-main">
          <div>
            <Link href="/" className="mandir-brand">
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
            <p>
              A space for prayer, a moment of peace, and a community brought
              together by devotion.
            </p>
            <span className="mandir-footer-mantra" lang="hi">
              राधे राधे
            </span>
          </div>
          <div>
            <h3>The Mandir</h3>
            <Link href="/#our-mandir">Our story</Link>
            <Link href="/#visit">Plan your visit</Link>
            <Link href="/#panchang">Daily Panchang</Link>
            <Link href="/festivals">Festivals</Link>
          </div>
          <div>
            <h3>Your devotion</h3>
            <Link href="/sevas">Seva & offerings</Link>
            <Link href="/donate">Make a donation</Link>
            <Link href="/account/bookings">My bookings</Link>
            <Link href="/account/receipts">My receipts</Link>
          </div>
          <div>
            <h3>Come find your peace</h3>
            <p>
              <MapPin size={16} /> {mandir.address}
            </p>
            <a
              href={mandir.directions}
              target="_blank"
              rel="noreferrer"
              className="mandir-footer-direction"
            >
              Get directions <ArrowUpRight size={15} />
            </a>
            <a href={mandir.website} target="_blank" rel="noreferrer">
              SRMS CET website <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div className="mandir-footer-bottom">
          <span>
            © {new Date().getFullYear()} {mandir.name} · SRMS CET
          </span>
          <Lotus />
          <a href={mandir.photoSource} target="_blank" rel="noreferrer">
            Temple photography courtesy of SRMS Institutions
          </a>
        </div>
      </div>
    </footer>
  );
}
