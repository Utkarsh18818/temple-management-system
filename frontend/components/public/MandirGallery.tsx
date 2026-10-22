"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

const INTERVAL_MS = 3000;
const photos = [
  { title: "A welcome wrapped in flowers.", description: "Marigold garlands welcome devotees to the Radha Krishna Mandir at SRMS CET, Bareilly.", alt: "The decorated SRMS Radha Krishna Mandir entrance and garden walkway" },
  { title: "The path to a little peace.", description: "A quiet view of the mandir, dressed for the Deepdan Mahotsav celebrations.", alt: "A low view along the walkway towards the flower-decorated SRMS mandir" },
  { title: "Small lamps. Sacred wishes.", description: "Clay diyas and flower petals await the evening celebration outside the mandir.", alt: "Clay lamps and marigold petals with the SRMS mandir in the background" },
  { title: "Devotion, one diya at a time.", description: "Rows of earthen lamps line the garden railings for Deepdan Mahotsav.", alt: "A row of clay diyas leading towards the SRMS temple entrance" },
  { title: "Gathered in the spirit of seva.", description: "Members of the SRMS community come together at the mandir for the festival of lamps.", alt: "The SRMS community gathering outside the mandir behind a row of diyas" },
  { title: "A moment before the divine.", description: "A glimpse inside the mandir, with Radha Krishna adorned in the decorated shrine.", alt: "Radha Krishna shrine inside the SRMS mandir during Deepdan Mahotsav" },
  { title: "An evening shared in faith.", description: "Devotees gather in the mandir gardens as festive lights brighten the evening.", alt: "Devotees in the SRMS mandir garden with colourful evening lights" },
].map((photo, index) => ({ ...photo, src: `/images/gallery-deepdan-${index + 1}.jpg` }));

export function MandirGallery() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setActive(index => (index + 1) % photos.length), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused]);

  function select(index: number) {
    setActive((index + photos.length) % photos.length);
  }

  return (
    <section id="our-mandir" className="mandir-event-gallery mandir-container" aria-labelledby="mandir-gallery-heading"
      aria-roledescription="carousel">
      <header className="mandir-gallery-heading">
        <span className="mandir-overline">OUR MANDIR, THROUGH THE LENS</span>
        <h2 id="mandir-gallery-heading">Gallery <span lang="hi">भक्ति के रंग</span></h2>
        <p>Little glimpses of worship, celebration and the community that makes our mandir a home.</p>
      </header>
      <div className="mandir-gallery-stage">
        <div className="mandir-gallery-frame">
          {photos.map((photo, index) => (
            <div className={`mandir-gallery-slide${active === index ? " is-active" : ""}`} key={photo.src}
              aria-hidden={active !== index}>
              <Image src={photo.src} alt={active === index ? photo.alt : ""} fill
                sizes="(max-width: 767px) 92vw, (max-width: 1050px) 88vw, 900px" loading="eager" className="mandir-photo" />
            </div>
          ))}
          <div className="mandir-gallery-photo-label"><span>DEEPDAN MAHOTSAV</span><span>SRMS CET · 2022</span></div>
        </div>
        <div className="mandir-gallery-stage-foot"><span>THE SRMS MANDIR ARCHIVES</span><span>{String(active + 1).padStart(2, "0")} / 07</span></div>
      </div>

      <div className="mandir-gallery-copy">
        <div className="mandir-gallery-caption" aria-live={paused ? "polite" : "off"} aria-atomic="true">
          <h3>{photos[active].title}</h3>
          <p>{photos[active].description}</p>
        </div>
        <div className="mandir-gallery-thumbnails" role="group" aria-label="Choose a gallery photo">
          {photos.map((photo, index) => (
            <button type="button" key={photo.src} onClick={() => select(index)} aria-label={`Show photo ${index + 1}: ${photo.title}`}
              aria-pressed={active === index} className={active === index ? "is-active" : ""}>
              <Image src={photo.src} alt="" fill sizes="70px" />
            </button>
          ))}
        </div>
        <div className="mandir-gallery-controls">
          <div className="mandir-gallery-arrows">
            <button type="button" onClick={() => select(active - 1)} aria-label="Previous gallery photo"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => select(active + 1)} aria-label="Next gallery photo"><ArrowRight size={18} /></button>
          </div>
          <span className="mandir-gallery-play-label">{paused ? "Slideshow paused" : "A new moment every 3 seconds"}</span>
          <button type="button" className="mandir-gallery-pause" onClick={() => setPaused(value => !value)}
            aria-label={paused ? "Play gallery slideshow" : "Pause gallery slideshow"}>
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>
    </section>
  );
}
