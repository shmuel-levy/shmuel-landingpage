import { useEffect, useRef, useState } from "react";
import { Envelope } from "@/components/Envelope";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { PALETTES, getPalette } from "@/lib/envelope/palettes";
import { motionOff, replayClass } from "@/lib/motion";
import { useInView, useReveal } from "@/hooks/useReveal";
import { Kicker, Reveal } from "./sections";

/* ---------- "for him": writing to her, plus an idea generator ---------- */
export function Him() {
  const M = SITE.him, I = SITE.ideas;
  const ideas = I.items;
  const [n, setN] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  // a random first idea (after mount, so a pre-rendered page and the browser agree)
  useEffect(() => setN(Math.floor(Math.random() * ideas.length)), [ideas.length]);
  const it = ideas[n % ideas.length];
  return (
    <section className="section section--him" id="him" aria-labelledby="himTitle">
      <div className="container him">
        <Reveal className="him__text">
          <Kicker text={M.kicker} />
          <h2 className="section__title him__title" id="himTitle">{M.title}</h2>
          <p className="him__lead">{M.text}</p>
          <ul className="him__points" id="himPoints">
            {M.points.map((p, i) => (
              <li key={i}>
                <span className={`tile tile--${[1, 6, 2][i % 3]}`} aria-hidden="true"><Icon name={p.icon} /></span>
                <span><b>{p.title}</b><small>{p.text}</small></span>
              </li>
            ))}
          </ul>
          <div className="him__ctas">
            <a className="btn btn--primary btn--lg" href="order.html?type=partner">
              <span>{M.cta}</span>
              <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
            </a>
            <a className="link-btn" href="demos/love.html">
              <span data-icon="eye"><Icon name="eye" /></span>
              <span>{M.demo}</span>
            </a>
          </div>
        </Reveal>
        <Reveal className="idea" id="idea">
          <p className="idea__label">
            <span data-icon="wand"><Icon name="wand" /></span>
            <span>{I.title}</span>
          </p>
          <div className="idea__card" id="ideaCard" aria-live="polite" aria-atomic="true" ref={card}>
            <span className={`tile tile--${(n % 6) + 1}`} aria-hidden="true"><Icon name={it.icon} /></span>
            <div>
              <p className="idea__n">רעיון {(n % ideas.length) + 1} מתוך {ideas.length}</p>
              <h3 className="idea__title">{it.title}</h3>
              <p>{it.text}</p>
            </div>
          </div>
          <div className="idea__actions">
            <button
              type="button"
              className="btn btn--ghost"
              id="ideaNext"
              onClick={() => {
                setN((x) => x + 1);
                if (!motionOff()) replayClass(card.current, "is-new");
              }}
            >
              <span data-icon="replay"><Icon name="replay" /></span>
              <span>{I.button}</span>
            </button>
            <a className="btn btn--primary" id="ideaWant" href={`order.html?type=${it.type}`}>
              <span>{I.want}</span>
              <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- the sketch builder: a looping mock-up of form → envelope ---------- */
const PRESETS = [
  { to: "נועה", kind: "בן / בת זוג", pal: "blush", liner: "hearts", mark: "נ", icon: "hearts", title: "שאלה קטנה" },
  { to: "אמא", kind: "הורים ומשפחה", pal: "ink", liner: "stripes", mark: "א", icon: "home", title: "מכל הלב" },
  { to: "שירה", kind: "יום הולדת", pal: "gold", liner: "confetti", mark: "ש", icon: "cake", title: "מזל טוב!" },
  { to: "מירי הגננת", kind: "תודה והוקרה", pal: "mint", liner: "dots", mark: "מ", icon: "hand-heart", title: "תודה!" },
  { to: "דניאל", kind: "הצעת נישואין", pal: "lilac", liner: "dots", mark: "ד", icon: "ring", title: "יש לי שאלה" },
];

export function Builder() {
  const B = SITE.builder;
  const [mock, revealCls] = useReveal<HTMLDivElement>();
  const inView = useInView(mock, 0.3);
  const [n, setN] = useState(0);
  const [typed, setTyped] = useState(PRESETS[0].to);
  const p = PRESETS[n % PRESETS.length];

  // next preset every 3.4s while the mock-up is on screen
  useEffect(() => {
    if (!inView || motionOff()) return;
    const t = setInterval(() => setN((x) => x + 1), 3400);
    return () => clearInterval(t);
  }, [inView]);

  // type the name letter by letter
  useEffect(() => {
    if (n === 0) return;
    replayClass(mock.current, "is-swap");
    let k = 0, t = 0;
    const type = () => {
      setTyped(p.to.slice(0, ++k));
      if (k < p.to.length) t = window.setTimeout(type, 90);
    };
    type();
    return () => clearTimeout(t);
  }, [n, p.to, mock]);

  return (
    <section className="section section--builder" id="builder" aria-labelledby="builderTitle">
      <div className="container builder">
        <Reveal className="builder__text">
          <Kicker text={B.kicker} />
          <h2 className="section__title builder__title" id="builderTitle">{B.title}</h2>
          <p>{B.text}</p>
          <ul className="builder__points" id="builderPoints">
            {B.points.map((x) => (
              <li key={x}><Icon name="check" />{x}</li>
            ))}
          </ul>
          <a className="btn btn--primary btn--lg btn--magnetic" href="order.html">
            <span>{B.cta}</span>
            <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
          </a>
        </Reveal>
        {/* "is-swap" is replayed imperatively on each preset; React keeps it in the class list */}
        <div className={`mock ${revealCls}${n ? " is-swap" : ""}`} id="mock" aria-hidden="true" ref={mock}>
            <div className="mock__form">
              <div className="mock__bar"><i /><i /><i /><em>order.html</em></div>
              <div className="mock__row"><span>סוג ההפתעה</span><b id="mockKind">{p.kind}</b></div>
              <div className="mock__row"><span>למי?</span><b className="mock__typing"><span id="mockTo">{typed}</span><i className="caret" /></b></div>
              <div className="mock__row">
                <span>פלטה</span>
                <span className="mock__sw" id="mockSw">
                  {Object.keys(PALETTES).map((k) => (
                    <i key={k} data-pal={k} className={k === p.pal ? "is-on" : undefined} style={{ background: getPalette(k).swatch[1] }} />
                  ))}
                </span>
              </div>
              <div className="mock__cta"><span data-icon="eye"><Icon name="eye" /></span>לראות את הסקיצה</div>
            </div>
            <svg className="mock__arrow"><use href="#d-arrow" /></svg>
            <div className="mock__phone">
              <div className="mock__screen" id="mockScreen" style={{ background: getPalette(p.pal).theme.bg }}>
                <p className="mock__to hand" id="mockTo2">ל{p.to}</p>
                <div className="mock__env" id="mockEnv">
                  <Envelope key={n} decorative mark={p.mark} liner={p.liner} cardIcon={p.icon} cardTitle={p.title} cardText={"ל" + p.to} postmark={false} palette={p.pal} />
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
