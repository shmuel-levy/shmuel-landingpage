import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { NEW_TAB } from "@/components/layout/Chrome";
import { SITE } from "@/data/site";
import { waLink } from "@/lib/pricing";
import { useReveal } from "@/hooks/useReveal";
import { EVENT_LINKS } from "@/data/pages";

const stagger = (i: number, step = 80) => ({ "--d": i * step + "ms" }) as CSSProperties;

/** An element that fades in when scrolled into view. */
export function Reveal<T extends keyof HTMLElementTagNameMap = "div">({
  as,
  className = "",
  style,
  children,
  ...rest
}: { as?: T; className?: string; style?: CSSProperties; children?: ReactNode } & Record<string, unknown>) {
  const [ref, cls] = useReveal<HTMLElement>();
  const Tag = (as || "div") as "div";
  return (
    <Tag ref={ref as never} className={`${className} ${cls}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  );
}

export function Kicker({ text }: { text?: string }) {
  return text ? <p className="kicker-pill">{text}</p> : null;
}

export function SectionHead({ kicker, title, subtitle, id }: { kicker?: string; title: string; subtitle?: string; id: string }) {
  return (
    <Reveal as="header" className="section__head">
      <Kicker text={kicker} />
      <h2 className="section__title" id={id}><span>{title}</span></h2>
      {subtitle && <p className="section__subtitle">{subtitle}</p>}
    </Reveal>
  );
}

/* ---------- a running strip of occasions ---------- */
const MQ_ICONS = ["heart", "sparkle", "star", "envelope"];
export function Marquee() {
  const [paused, setPaused] = useState(false);
  const group = SITE.occasions.flatMap((o, i) => [<span key={"t" + i}>{o}</span>, <Icon key={"i" + i} name={MQ_ICONS[i % MQ_ICONS.length]} className="marquee__ico" />]);
  return (
    <div className="marquee-wrap">
      <div className={"marquee" + (paused ? " is-paused" : "")} role="region" aria-label="אירועים שמתאימים להפתעה">
        <div className="marquee__track" id="marquee">
          <div className="marquee__group">{group}</div>
          <div className="marquee__group" aria-hidden="true">{group}</div>
        </div>
      </div>
      <button
        type="button"
        className="marquee__pause"
        id="marqueePause"
        aria-pressed={paused}
        aria-label={paused ? "הפעלת הרצועה הנעה" : "עצירת הרצועה הנעה"}
        onClick={() => setPaused((p) => !p)}
      >
        <span data-icon={paused ? "play" : "pause"}><Icon name={paused ? "play" : "pause"} /></span>
      </button>
    </div>
  );
}

/* ---------- how it works ---------- */
export function HowItWorks() {
  const S = SITE.steps;
  return (
    <section className="section" id="how" aria-labelledby="howTitle">
      <div className="container">
        <SectionHead kicker={S.kicker} title={S.title} subtitle={S.subtitle} id="howTitle" />
        <Reveal className="steps-wrap">
          <svg className="steps__path" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 30C180 -10 320 70 500 30S820 -10 980 30" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 10" strokeLinecap="round" />
          </svg>
          <ol className="steps" id="steps">
            {S.items.map((s, i) => (
              <Reveal as="li" key={i} className="step" style={stagger(i, 140)}>
                <span className="step__num" aria-hidden="true" data-n={"0" + (i + 1)} />
                <span className={`tile tile--${i + 1}`} aria-hidden="true"><Icon name={s.icon} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- everything that can go inside a surprise ---------- */
export function Toolbox() {
  const T = SITE.toolbox;
  const [all, setAll] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  return (
    <section className="section" id="toolbox" aria-labelledby="tbTitle">
      <div className="container">
        <SectionHead kicker={T.kicker} title={T.title} subtitle={T.subtitle} id="tbTitle" />
        <ul className={"toolbox" + (all ? " is-all" : "")} id="toolboxList" ref={list}>
          {T.items.map((t, i) => (
            <Reveal as="li" key={i} className="tool" style={stagger(i, 45)}>
              <span className={`tile tile--${(i % 6) + 1}`} aria-hidden="true"><Icon name={t.icon} /></span>
              {t.title}
            </Reveal>
          ))}
        </ul>
        {/* phones see 8, the rest on demand */}
        {T.items.length > 8 && !all && (
          <button
            type="button"
            className="btn btn--ghost more-btn"
            id="toolMore"
            aria-expanded="false"
            aria-controls="toolboxList"
            onClick={() => {
              setAll(true);
              const li = list.current?.children[8] as HTMLElement | undefined;
              if (li) {
                li.setAttribute("tabindex", "-1");
                li.focus({ preventScroll: true });
              }
            }}
          >
            <Icon name="plus" />
            לכל {T.items.length} החלקים
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- why a surprise by link ---------- */
export function Why() {
  const W = SITE.why;
  return (
    <section className="section" id="why" aria-labelledby="whyTitle">
      <div className="container">
        <SectionHead kicker={W.kicker} title={W.title} id="whyTitle" />
        <ul className="why" id="whyList">
          {W.items.map((w, i) => (
            <Reveal as="li" key={i} className="why__item" style={stagger(i)}>
              <span className={`tile tile--${i + 2}`} aria-hidden="true"><Icon name={w.icon} /></span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq" id="faqList">
      {items.map((f, i) => (
        <Reveal as="details" key={i} className="faq__item" style={stagger(i, 50)}>
          <summary>
            {f.q}
            <span className="faq__plus" aria-hidden="true"><Icon name="plus" /></span>
          </summary>
          <p>{f.a}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function Faq() {
  const F = SITE.faq;
  return (
    <section className="section section--tint" id="faq" aria-labelledby="fTitle">
      <div className="container container--narrow">
        <SectionHead kicker={F.kicker} title={F.title} id="fTitle" />
        <FaqList items={F.items} />
      </div>
    </section>
  );
}

/* ---------- final call to action ---------- */
export function FinalCta() {
  const F = SITE.finalCta;
  return (
    <section className="final-cta" aria-labelledby="ctaTitle">
      <div className="container final-cta__grid">
        <img className="final-cta__doodle" src="images/doodle-jump.jpg" width="900" height="729" loading="lazy" decoding="async" alt="איור של שמואל קופץ מהתרגשות" />
        <Reveal className="final-cta__text">
          <h2 id="ctaTitle">{F.title}</h2>
          <p>{F.text}</p>
          <div className="final-cta__buttons">
            <a className="btn btn--primary btn--lg btn--magnetic" href="order.html">
              <span>{F.cta}</span>
              <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
            </a>
            <a className="btn btn--ghost btn--lg" id="callBtn" href={`tel:+${SITE.contact.phoneIntl}`}>
              <span data-icon="call"><Icon name="call" /></span>
              <span id="callText" dir="ltr">{SITE.contact.phoneDisplay}</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
export function LegalLinks() {
  return (
    <nav className="footer__links" aria-label="מידע משפטי">
      <a href="negishut.html">הצהרת נגישות</a>
      <a href="privacy.html">מדיניות פרטיות</a>
      <a href="terms.html">תנאי שירות</a>
    </nav>
  );
}

export function HomeFooter() {
  const C = SITE.contact;
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <img className="footer__logo" src="images/logo.jpg" width="640" height="575" loading="lazy" alt="הלוגו של Matanot: איור של שמואל רוקד עם מעטפה" />
        <p>{SITE.footer.text}</p>
        <ul className="footer__contact" id="footerContact">
          <li><a href={`tel:+${C.phoneIntl}`}><Icon name="call" />{C.phoneDisplay}</a></li>
          <li>
            <a className="footer__wa" href={waLink()} target="_blank" rel="noopener">
              <span className="wa-icon" aria-hidden="true"><Icon name="whatsapp" /></span>ווטסאפ{NEW_TAB}
            </a>
          </li>
          <li><a href="order.html"><Icon name="wand" />טופס הזמנה</a></li>
          {C.email && <li><a href={`mailto:${C.email}`}><Icon name="envelope" />{C.email}</a></li>}
        </ul>
        <p className="ev-more__title">רעיונות לפי אירוע</p>
        <nav className="ev-more" aria-label="רעיונות לפי אירוע">
          {EVENT_LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <LegalLinks />
        <p className="footer__copy">© <span id="year">{new Date().getFullYear()}</span> <span lang="en">Matanot</span> · שמואל לוי</p>
      </div>
    </footer>
  );
}
