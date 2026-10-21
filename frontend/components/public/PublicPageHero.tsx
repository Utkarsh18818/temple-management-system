import { TempleLink as Link } from "@/features/public/TempleContext";
import { ChevronRight } from "lucide-react";
import { Lotus } from "./MandirMark";

export function PublicPageHero({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
}) {
  return (
    <header className="mandir-page-hero">
      <div className="mandir-container">
        <nav aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span>{eyebrow}</span>
        </nav>
        <div className="mandir-page-hero-content">
          <div>
            <span className="mandir-overline">{eyebrow}</span>
            <h1>
              {title} {accent && <em>{accent}</em>}
            </h1>
            <p>{description}</p>
          </div>
          <Lotus />
        </div>
      </div>
    </header>
  );
}
