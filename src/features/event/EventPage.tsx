/* =========================================================
   Event landing pages (Google + ads): michtav-ahava.html, yom-huledet.html, ...
   Pre-rendered to static HTML at build time (scripts/gen-pages.tsx) so search
   engines read the full text, then hydrated in the browser for the menu,
   the live promo price, WhatsApp links and the sticky CTA.
   Must stay SSR-safe: no window/document access during render.
   ========================================================= */
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useStickyCta } from "@/hooks/useStickyCta";
import { A11yWidget } from "@/components/layout/A11yWidget";
import { NEW_TAB, SiteHeader, SkipLink, WaIcon } from "@/components/layout/Chrome";
import { SITE } from "@/data/site";
import { EVENT_PAGES } from "@/data/pages";
import { activePromo, minPrice } from "@/lib/pricing";
import { LegalLinks } from "@/features/home/sections";
import { fillEventText } from "./text";
import type { EventPage as EventPageData } from "@/types/content";

/** Price line: the static text is pre-rendered; an active promo is shown after hydration. */
function Price() {
  const min = minPrice();
  const [promo, setPromo] = useState<ReturnType<typeof activePromo>>(null);
  useEffect(() => setPromo(activePromo()), []);
  return (
    <p className="ev-price" id="evPrice">
      {promo ? (
        <>
          <span className="ev-price__tag">{`${promo.title} עד ${promo.endsLabel}`}</span>
          {` החל מ-${Math.round(min * (1 - promo.percent / 100))} ₪ `}
          <del><span className="sr-only">במקום </span>{`${min} ₪`}</del>
        </>
      ) : (
        `החל מ-${min} ₪ · סקיצה מיד, משלמים רק אחרי שאהבתם`
      )}
    </p>
  );
}

const STEPS: [string, string][] = [
  ["ממלאים טופס קצר", "מספרים על מי שמקבל: שמות, זיכרונות, בדיחות פנימיות. אפשר גם להקליט."],
  ["רואים סקיצה מיד", "המעטפה בצבעים שבחרתם, עם השם, והתחלה של המסע."],
  ["מקבלים תוך 24 שעות", "אני מעצב את הגרסה הסופית. אוהבים? משלמים ושולחים בווטסאפ."],
];

export function EventPage({ page: P }: { page: EventPageData }) {
  useStickyCta("top", 0.6, 220);
  const order = `order.html?type=${P.type}&src=page-${P.slug}`;
  const waMsg = `${SITE.whatsappMessage} (${P.title.split("|")[0].trim()})`;
  const others = EVENT_PAGES.filter((o) => o.slug !== P.slug);
  return (
    <>
      <SkipLink />
      <SiteHeader
        scrolled
        brandLabel="Matanot, לעמוד הבית"
        actions={
          <>
            <WaIcon message={waMsg} />
            <a className="btn btn--primary btn--sm" href={order}>הזמנה</a>
          </>
        }
      />
      <main id="main">
        <section className="ev-hero" id="top" aria-labelledby="evTitle">
          <div className="container ev-hero__grid">
            <div>
              <p className="kicker-pill"><span data-icon="sparkle"><Icon name="sparkle" /></span>{P.kicker}</p>
              <h1 id="evTitle">{P.h1}</h1>
              <p className="ev-hero__lead">{P.lead}</p>
              <div className="ev-hero__ctas">
                <a className="btn btn--primary btn--lg" href={order}>
                  <span>{P.cta}</span>
                  <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
                </a>
                <a className="btn btn--ghost btn--lg" href={`demos/${P.demo}.html`}>
                  <span data-icon="eye"><Icon name="eye" /></span>לראות דוגמה
                </a>
              </div>
              <Price />
            </div>
            <a className="ev-shot" href={`demos/${P.demo}.html`} aria-label={`לפתוח את הדוגמה: ${P.label}`}>
              <img src={`images/examples/${P.shot}.webp`} alt="" width="780" height="1520" decoding="async" fetchPriority="high" />
              <span className="ev-shot__tag" aria-hidden="true"><span data-icon="tap"><Icon name="tap" /></span>לנסות בעצמכם</span>
            </a>
          </div>
        </section>

        <section className="section section--tint" aria-labelledby="ideasTitle">
          <div className="container">
            <header className="section__head"><h2 className="section__title" id="ideasTitle">{P.ideasTitle}</h2></header>
            <ul className="ev-ideas">
              {P.ideas.map((it, i) => (
                <li className="ev-idea" key={i}>
                  <span className={`tile tile--${(i % 6) + 1}`} aria-hidden="true"><span data-icon={it.icon}><Icon name={it.icon} /></span></span>
                  <div><h3>{it.title}</h3><p>{it.text}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="howTitle">
          <div className="container">
            <header className="section__head"><h2 className="section__title" id="howTitle">איך זה עובד?</h2></header>
            <ol className="ev-steps">
              {STEPS.map(([b, s]) => (
                <li key={b}><b>{b}</b><span>{s}</span></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--tint" aria-labelledby="faqTitle">
          <div className="container container--narrow">
            <header className="section__head"><h2 className="section__title" id="faqTitle">שאלות נפוצות</h2></header>
            <div className="faq">
              {P.faq.map((f) => (
                <details className="faq__item" key={f.q}>
                  <summary>{f.q}<span className="faq__plus" aria-hidden="true"><span data-icon="plus"><Icon name="plus" /></span></span></summary>
                  <p>{fillEventText(f.a)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ev-final" aria-labelledby="finalTitle">
          <div className="container">
            <h2 id="finalTitle">3 דקות של טופס, וסקיצה מיד</h2>
            <p className="section__subtitle">בלי התחייבות. משלמים רק אחרי שרואים את הגרסה הסופית.</p>
            <div className="ev-hero__ctas ev-final__ctas">
              <a className="btn btn--primary btn--lg" href={order}>
                <span>{P.cta}</span>
                <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
              </a>
              <a className="btn btn--ghost btn--lg" data-wa="" href={`https://wa.me/${SITE.contact.phoneIntl}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener">
                <span data-icon="whatsapp"><Icon name="whatsapp" /></span>שאלה בווטסאפ{NEW_TAB}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p className="ev-more__title">עוד רעיונות לפי אירוע</p>
          <nav className="ev-more" aria-label="עוד רעיונות לפי אירוע">
            {others.map((o) => (
              <a key={o.slug} href={`${o.slug}.html`}>{o.label}</a>
            ))}
            <a href="index.html#examples">כל הדוגמאות</a>
          </nav>
          <LegalLinks />
          <p className="footer__copy">© 2026 <span lang="en">Matanot</span> · שמואל לוי</p>
        </div>
      </footer>

      <aside aria-label="יצירת קשר ונגישות">
        <div className="cta-bar" id="ctaBar">
          <a className="btn btn--primary cta-bar__main" href={order}>
            <span data-icon="wand"><Icon name="wand" /></span>לבנות סקיצה, 3 דקות
          </a>
          <WaIcon className="wa-icon cta-bar__wa" message={waMsg} />
        </div>
        <A11yWidget />
      </aside>
    </>
  );
}
