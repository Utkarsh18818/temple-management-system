"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flower2,
  HandHeart,
  Heart,
  MapPin,
} from "lucide-react";
import { mandir, isMandirTemple } from "@/config/mandir";
import { Lotus } from "@/components/public/MandirMark";
import { Panchang } from "@/components/public/Panchang";
import { MandirGallery } from "@/components/public/MandirGallery";
import {
  usePublicEvents,
  usePublicSevas,
  usePublicTemples,
} from "@/features/public/hooks";

const offerings = [
  {
    number: "01",
    icon: Flower2,
    title: "Seva & worship",
    description:
      "Make an offering with a grateful heart. Explore the devotional services available at the mandir.",
    href: "/sevas",
    action: "Explore sevas",
  },
  {
    number: "02",
    icon: HandHeart,
    title: "An act of kindness",
    description:
      "Let your devotion become service. Contribute to the temple through the donation portal.",
    href: "/donate",
    action: "Make an offering",
  },
  {
    number: "03",
    icon: CalendarDays,
    title: "Celebrate together",
    description:
      "Find moments of joy in our shared traditions, festivals, and gatherings of the mandir community.",
    href: "/festivals",
    action: "Explore festivals",
  },
];
const memories = [
  {
    image: mandir.images.darshan,
    title: "In the presence of the divine",
    tag: "WORSHIP & AARTI",
    alt: "Devotees offering prayers before Radha Krishna at the SRMS temple",
  },
  {
    image: mandir.images.community,
    title: "A thousand lights. One community.",
    tag: "DEEPDAN MAHOTSAV · 2022",
    alt: "SRMS students gathering around rows of diyas during Deepdan Mahotsav",
  },
  {
    image: mandir.images.celebration,
    title: "The joy of Janmashtami",
    tag: "FROM THE SRMS ARCHIVES · 2018",
    alt: "Students performing during SRMS Radha Krishna temple Janmashtami celebrations",
  },
];
export default function PublicHomePage() {
  const { data: temples, isError: templeError } = usePublicTemples({
    limit: 100,
  });
  const temple = temples?.find(isMandirTemple);
  const { data: sevas } = usePublicSevas({
    templeId: temple?.id ?? "",
    limit: 3,
  });
  const { data: events } = usePublicEvents({
    templeId: temple?.id ?? "",
    limit: 3,
  });
  const upcomingEvents = events?.filter(
    (event) =>
      event.event_date >=
      new Intl.DateTimeFormat("en-CA", { timeZone: mandir.timezone }).format(
        new Date(),
      ),
  );

  return (
    <div className="mandir-home">
      <section className="mandir-hero" aria-labelledby="home-heading">
        <div className="mandir-container mandir-hero-grid">
          <div className="mandir-hero-copy">
            <span className="mandir-overline">
              <span className="mandir-small-rule" /> A SACRED SPACE AT SRMS,
              BAREILLY
            </span>
            <p className="mandir-hero-hindi" lang="hi">
              श्री राधा कृष्णाय नमः
            </p>
            <h1 id="home-heading">
              Where the heart
              <br />
              finds its <em>peace.</em>
            </h1>
            <p className="mandir-hero-name">Shri Radha Krishna Mandir</p>
            <p className="mandir-hero-description">
              Step away from the everyday. Come closer to the divine.
              <br className="mandir-desktop-break" /> A place of faith,
              belonging, and quiet reflection at
              <br className="mandir-desktop-break" /> Shri Ram Murti Smarak,
              Bareilly.
            </p>
            <div className="mandir-hero-actions">
              <a href="#visit" className="mandir-button">
                Plan your visit <ArrowUpRight size={17} />
              </a>
              <Link href="/sevas" className="mandir-text-link">
                Offer a seva <ArrowRight size={17} />
              </Link>
            </div>
            <a className="mandir-hero-scroll" href="#our-mandir">
              <span>
                <ArrowDown size={15} />
              </span>{" "}
              DISCOVER THE MANDIR
            </a>
          </div>
          <div className="mandir-hero-visual">
            <div className="mandir-arch-outline" />
            <div className="mandir-hero-photo">
              <Image
                src={mandir.images.entrance}
                alt="The real Radha Krishna Mandir entrance at SRMS, with marigold decorations, diyas, and a garden walkway"
                fill
                priority
                sizes="(max-width: 767px) 95vw, 52vw"
                className="mandir-photo"
              />
              <div className="mandir-photo-shade" />
              <div className="mandir-photo-label">
                <MapPin size={13} />
                <span>SRMS campus, Bareilly</span>
                <span lang="hi">राधे राधे</span>
              </div>
            </div>
            <div className="mandir-blessing-seal">
              <Lotus />
              <span lang="hi">राधे</span>
              <small>FAITH · PEACE · SEVA</small>
            </div>
            <span className="mandir-hero-side-text">
              A LITTLE STILLNESS. A DEEPER CONNECTION.
            </span>
          </div>
        </div>
      </section>

      <div className="mandir-quicklinks">
        <div className="mandir-container">
          {[
            {
              icon: Flower2,
              title: "Darshan & aarti",
              sub: "A moment with the divine",
              href: "#visit",
            },
            {
              icon: Heart,
              title: "Seva & offerings",
              sub: "Devotion through service",
              href: "/sevas",
            },
            {
              icon: CalendarDays,
              title: "Daily Panchang",
              sub: "Begin your day with intention",
              href: "#panchang",
            },
            {
              icon: MapPin,
              title: "Find your way",
              sub: "Visit our campus mandir",
              href: "#visit",
            },
          ].map(({ icon: Icon, title, sub, href }) => (
            <Link href={href} key={title}>
              <Icon />
              <span>
                <strong>{title}</strong>
                <small>{sub}</small>
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      </div>

      <Panchang />

      <MandirGallery />

      <section className="mandir-offerings-section">
        <div className="mandir-container">
          <div className="mandir-section-heading">
            <div>
              <span className="mandir-overline">
                SMALL OFFERINGS. MEANINGFUL CONNECTIONS.
              </span>
              <h2>
                Let devotion become <em>seva.</em>
              </h2>
            </div>
            <Link href="/sevas" className="mandir-text-link">
              All devotional services <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mandir-offerings">
            {offerings.map(
              ({ number, icon: Icon, title, description, href, action }) => (
                <Link className="mandir-offering" key={number} href={href}>
                  <div className="mandir-offering-top">
                    <Icon strokeWidth={1.2} />
                    <span>{number}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="mandir-text-link">
                    {action}
                    <ArrowUpRight size={17} />
                  </span>
                </Link>
              ),
            )}
          </div>
          {sevas && sevas.length > 0 && (
            <div className="mandir-published-sevas">
              <h3>Available at our mandir</h3>
              {sevas.map((seva) => (
                <Link
                  key={seva.id}
                  href={`/temples/${temple!.id}/sevas/${seva.id}/book`}
                >
                  <span>{seva.name}</span>
                  <strong>
                    ₹{Number(seva.amount).toLocaleString("en-IN")}
                  </strong>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          )}
          {!temple && (
            <p className="mandir-publishing-note">
              {templeError
                ? "Online listings are temporarily unavailable. Please try again shortly."
                : "Online seva and event listings for this mandir will appear here when published by the temple office."}
            </p>
          )}
        </div>
      </section>

      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="mandir-container mandir-upcoming">
          <div className="mandir-section-heading">
            <div>
              <span className="mandir-overline">THE MANDIR CALENDAR</span>
              <h2>
                Come, <em>celebrate with us.</em>
              </h2>
            </div>
            <Link className="mandir-text-link" href="/events">
              All events <ArrowRight size={16} />
            </Link>
          </div>
          {upcomingEvents.map((event) => (
            <div className="mandir-event-row" key={event.id}>
              <CalendarDays />
              <span>
                {new Intl.DateTimeFormat("en-IN", {
                  month: "long",
                  day: "numeric",
                }).format(new Date(`${event.event_date}T12:00:00`))}
              </span>
              <h3>{event.name}</h3>
              <span>{event.location}</span>
            </div>
          ))}
        </section>
      )}

      <section className="mandir-memories mandir-container" id="gallery">
        <div className="mandir-section-heading">
          <div>
            <span className="mandir-overline">GLIMPSES OF FAITH</span>
            <h2>
              Moments that bring us <em>together.</em>
            </h2>
          </div>
          <span className="mandir-gallery-note">
            From the SRMS temple archives
          </span>
        </div>
        <div className="mandir-memory-grid">
          {memories.map((memory) => (
            <figure key={memory.title}>
              <div>
                <Image
                  src={memory.image}
                  alt={memory.alt}
                  fill
                  sizes="(max-width: 767px) 90vw, 33vw"
                  className="mandir-photo"
                />
              </div>
              <figcaption>
                <span className="mandir-overline">{memory.tag}</span>
                <h3>{memory.title}</h3>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="visit" className="mandir-visit-section">
        <div className="mandir-container mandir-visit-grid">
          <div>
            <span className="mandir-overline">
              YOU ARE ALWAYS WELCOME IN DEVOTION
            </span>
            <h2>
              Leave the rush behind.
              <br />
              <em>Find your way here.</em>
            </h2>
            <p>
              Visit the Radha Krishna Mandir at SRMS CET. Come with a prayer, a
              grateful heart, or simply a wish for a quieter moment.
            </p>
            <a
              href={mandir.directions}
              target="_blank"
              rel="noreferrer"
              className="mandir-button"
            >
              Get directions <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="mandir-visit-info">
            <div>
              <MapPin />
              <span>
                <h3>Our location</h3>
                <p>{mandir.address}</p>
              </span>
            </div>
            <div>
              <Clock3 />
              <span>
                <h3>Darshan & aarti timings</h3>
                <p>
                  Morning: 6:00 am–12:00 pm · Evening: 4:00 pm–8:00 pm.
                  Initial schedule; please confirm timings and campus visitor
                  access with the mandir office before your visit.
                </p>
              </span>
            </div>
            <div>
              <Flower2 />
              <span>
                <h3>A mindful visit</h3>
                <p>
                  Dress respectfully, leave footwear outside the shrine, and
                  help keep this shared sacred space peaceful.
                </p>
              </span>
            </div>
            <a
              href={mandir.website}
              target="_blank"
              rel="noreferrer"
              className="mandir-text-link"
            >
              Visit the SRMS CET website <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="mandir-closing">
        <Lotus />
        <p lang="hi">सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः</p>
        <span>May all be happy. May all be free from suffering.</span>
      </section>
    </div>
  );
}
