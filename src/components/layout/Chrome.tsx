/* Page chrome shared by all pages: skip link, scroll progress, header, sticky CTA, WhatsApp float. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { SITE } from "@/data/site";
import { waLink } from "@/lib/pricing";
import { motionOff } from "@/lib/motion";
import { SiteMenu } from "./SiteMenu";

export const NEW_TAB = <span className="sr-only"> (נפתח בחלון חדש)</span>;

export function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      דילוג לתוכן הראשי
    </a>
  );
}

interface HeaderProps {
  onHome?: boolean;
  /** start in the compact "scrolled" look (inner pages) */
  scrolled?: boolean;
  brandHref?: string;
  brandLabel?: string;
  /** right side of the header (buttons) */
  actions: ReactNode;
  children?: ReactNode;
}

export function SiteHeader({ onHome = false, scrolled = false, brandHref = "index.html", brandLabel = "Matanot, חזרה לעמוד הבית", actions, children }: HeaderProps) {
  const [isScrolled, setScrolled] = useState(scrolled);
  useEffect(() => {
    if (scrolled) return;
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [scrolled]);
  return (
    <header className={"header" + (isScrolled ? " is-scrolled" : "")} id={onHome ? "header" : undefined}>
      <div className="container header__inner">
        <a href={brandHref} className="brand" aria-label={brandLabel}>
          <img className="brand__mark" src="images/favicon.png" alt="" width="44" height="44" />
          <span className="brand__text">
            <b lang="en">{SITE.brand.latin}</b>
            <small>{SITE.brand.tagline}</small>
          </span>
        </a>
        {onHome && (
          <nav className="nav" aria-label="ניווט ראשי">
            <ul id="nav">
              {SITE.nav.map((n) => (
                <li key={n.href}><a href={n.href}>{n.label}</a></li>
              ))}
            </ul>
          </nav>
        )}
        <div className="header__actions">
          {actions}
          <SiteMenu onHome={onHome} />
        </div>
      </div>
      {children}
    </header>
  );
}

export function WaIcon({ label = "שליחת הודעה בווטסאפ (נפתח בחלון חדש)", message, className = "wa-icon" }: { label?: string; message?: string; className?: string }) {
  return (
    <a className={className} href={waLink(message)} target="_blank" rel="noopener" aria-label={label} data-wa="">
      <span data-icon="whatsapp"><Icon name="whatsapp" /></span>
    </a>
  );
}

/** Thin bar at the top that fills as you scroll (and the hero parallax variable). */
export function ScrollProgress() {
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${(max > 0 ? Math.min(1, y / max) : 0).toFixed(4)})`;
      if (!motionOff()) document.documentElement.style.setProperty("--hero-y", Math.min(y, 900).toFixed(0));
    };
    const on = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <b id="scrollBar" ref={bar} />
    </div>
  );
}

