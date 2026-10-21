"use client";
import Image from "next/image";
import { TempleLink as Link } from "@/features/public/TempleContext";
import { useState } from "react";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { usePublicTemples } from "@/features/public/hooks";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { MandirMark } from "@/components/public/MandirMark";
import { isMandirTemple, mandir } from "@/config/mandir";

export default function TemplesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = usePublicTemples({
    limit: 100,
  });
  const query = search.trim().toLowerCase();
  const temples =
    data?.filter((temple) =>
      [temple.name, temple.description, temple.city, temple.state]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    ) ?? [];
  return (
    <div>
      <PublicPageHero
        eyebrow="TEMPLE DIRECTORY"
        title="Find a place"
        accent="for your devotion."
        description="Explore the temples listed on our platform, discover their seva offerings, and find the information you need for a visit."
      />
      <div className="mandir-container mandir-listing-body">
        <div className="mandir-listing-filters">
          <label>
            <span>Discover a temple</span>
            <span className="mandir-search-field">
              <Search size={16} />
              <input
                type="search"
                aria-label="Search temples"
                placeholder="Search by temple, city or state…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
        </div>
        {isLoading ? (
          <div className="mandir-empty" role="status">
            <p>Finding sacred spaces…</p>
          </div>
        ) : isError ? (
          <div className="mandir-empty">
            <h2>The directory is temporarily unavailable.</h2>
            <button className="mandir-text-link" onClick={() => refetch()}>
              Try again <ArrowUpRight size={14} />
            </button>
          </div>
        ) : temples.length === 0 ? (
          <div className="mandir-empty">
            <MandirMark />
            <h2>No temples found.</h2>
            <p>Try another name, city, or state.</p>
            {search && (
              <button
                className="mandir-text-link"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mandir-listing-count">
              {temples.length} {temples.length === 1 ? "temple" : "temples"} in
              the directory
            </p>
            <div className="mandir-directory-grid">
              {temples.map((temple) => (
                <Link
                  key={temple.id}
                  href={`/temples/${temple.id}`}
                  className="mandir-directory-card"
                >
                  <div className="mandir-directory-visual">
                    {isMandirTemple(temple) ? (
                      <Image
                        src={mandir.images.entrance}
                        alt="SRMS Radha Krishna Mandir entrance"
                        fill
                        sizes="(max-width:767px) 90vw, 33vw"
                        className="mandir-photo"
                      />
                    ) : (
                      <MandirMark />
                    )}
                  </div>
                  <div className="mandir-directory-copy">
                    <span className="mandir-overline">
                      {temple.city || "SACRED DESTINATION"}
                    </span>
                    <h2>{temple.name}</h2>
                    {temple.description && <p>{temple.description}</p>}
                    <span className="mandir-directory-location">
                      <MapPin size={13} />
                      {[temple.city, temple.state].filter(Boolean).join(", ") ||
                        "Location to be announced"}
                    </span>
                    <span className="mandir-text-link">
                      Explore the temple <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
