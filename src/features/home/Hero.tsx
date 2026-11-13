import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { playFx } from "@/lib/fx";
import { motionOff, replayClass } from "@/lib/motion";
import { track } from "@/lib/track";
import type { ExampleItem } from "@/types/content";

const H = SITE.hero;

/** Splits a line into words that animate in one by one. */
function Words({ text, line }: { text: string; line: number }) {
  return (
    <span>
      {text.split(" ").map((w, i, all) => (
        <span key={i}>
          <span className="w" style={{ "--i": line * 3 + i } as CSSProperties}>{w}</span>
          {i < all.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="heroTitle">
      <div className="hero__bg" aria-hidden="true">
        <span className="blob blob--a" /><span className="blob blob--b" /><span className="blob blob--c" />
        <svg className="doodle doodle--a"><use href="#d-plus" /></svg>
        <svg className="doodle doodle--b"><use href="#d-ring" /></svg>
        <svg className="doodle doodle--c"><use href="#d-squiggle" /></svg>
        <svg className="doodle doodle--d"><use href="#d-heart" /></svg>
        <svg className="doodle doodle--e"><use href="#d-spark" /></svg>
        <svg className="flyer flyer--a"><use href="#d-env" /></svg>
        <svg className="flyer flyer--b"><use href="#d-env" /></svg>
        <svg className="flyer flyer--c"><use href="#d-env" /></svg>
      </div>

      <div className="container hero__grid">
        <div className="hero__text">
          <p className="eyebrow">
            <svg className="eyebrow__heart" aria-hidden="true"><use href="#d-heart" /></svg>
            <span>{H.eyebrow}</span>
          </p>
          <h1 className="hero__title" id="heroTitle">
            <Words text={H.titleA} line={0} />
            <span className="hero__ink">
              <Words text={H.titleB} line={1} />
              <svg className="scribble" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 16C60 6 130 4 296 12M30 20c70-6 150-8 240-4" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="hero__subtitle">{H.subtitle}</p>
        </div>

        <div className="hero__ctas">
          <div className="hero__buttons">
            <a className="btn btn--primary btn--lg btn--magnetic" href="order.html">
              <span>{H.cta}</span>
              <span data-icon="arrow-left"><Icon name="arrow-left" /></span>
            </a>
            <a className="btn btn--ghost btn--lg" href="#examples">{H.secondaryCta}</a>
          </div>
          <ul className="proof" id="proof">
            {H.proof.map((p) => (
              <li key={p}><Icon name="check" />{p}</li>
            ))}
          </ul>
        </div>

        <HeroDemo />
      </div>
    </section>
  );
}

/* =========================================================
   The live demo in the hero: the real surprise inside the phone
   (demos/*.html?embed=1), scaled to the screen. On entry, cupid shoots
   an arrow at the seal and the envelope opens by itself.
   "Shuffle" plays the other examples (all of them before repeating).
   ========================================================= */
const VW = 360; // width of the virtual screen inside the phone
const ORDER = ["date", "anniversary", "proposal", "bestie", "baby", "love", "sorry", "trip", "thanks"].map((n) => `demos/${n}.html`);

function HeroDemo() {
  const items = useMemo<ExampleItem[]>(() => {
    const list = SITE.examples.items.filter((x) => x.url);
    const rank = (u: string) => (ORDER.indexOf(u) + 99) % 99;
    return [...list].sort((a, b) => rank(a.url) - rank(b.url));
  }, []);
  const [cur, setCur] = useState(0);
  const [src, setSrc] = useState(items[0] ? items[0].url + "?embed=1" : "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const phone = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const shuffleBtn = useRef<HTMLButtonElement>(null);
  const scale = useRef(1);
  const introDone = useRef(false);
  const bag = useRef<number[]>([]);
  const it = items[cur];

  const fit = useCallback(() => {
    const s = screen.current, f = frame.current;
    if (!s || !f) return;
    scale.current = s.clientWidth / VW;
    f.style.width = VW + "px";
    f.style.height = Math.round(s.clientHeight / scale.current) + "px";
    f.style.transform = `scale(${scale.current.toFixed(4)})`;
  }, []);

  const doc = () => {
    try {
      return frame.current?.contentDocument || null;
    } catch {
      return null;
    }
  };
  const sealRect = useCallback(() => {
    const s = doc()?.querySelector(".env__seal");
    if (!s || !frame.current) return null;
    const fr = frame.current.getBoundingClientRect(), r = s.getBoundingClientRect(), k = scale.current;
    return { left: fr.left + r.left * k, top: fr.top + r.top * k, width: r.width * k, height: r.height * k };
  }, []);

  // cupid shoots the seal and the envelope opens
  const intro = useCallback(() => {
    introDone.current = true;
    if (motionOff()) return;
    setTimeout(() => {
      const r = phone.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return; // not on screen: skip
      const sr = sealRect();
      if (!sr) return;
      const x = Math.min(innerWidth - 56, r.right + (innerWidth > 979 ? 90 : 4));
      playFx("cupid", {
        target: sealRect,
        from: { x, y: sr.top - 40 },
        onHit: () => {
          const env = doc()?.querySelector<HTMLElement>(".env");
          if (env && !env.classList.contains("is-cracked")) env.click();
          setStatus("המעטפה נפתחת");
        },
      });
    }, 1100);
  }, [sealRect]);

  const onLoad = useCallback(() => {
    fit();
    setLoading(false);
    // touching the demo = the promo popup must not pop up in the middle
    doc()?.addEventListener(
      "pointerdown",
      () => {
        phone.current?.dispatchEvent(new Event("pointerdown"));
        introDone.current = true;
      },
      { once: true },
    );
    if (!introDone.current) intro();
  }, [fit, intro]);

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    // the iframe may have finished loading before React attached onLoad
    const d = doc();
    if (d && d.readyState === "complete" && d.querySelector(".env")) onLoad();
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // shuffle: every example once before repeating
  const pick = () => {
    if (!bag.current.length) {
      bag.current = items.map((_, i) => i).filter((i) => i !== cur);
      bag.current.sort(() => Math.random() - 0.5);
    }
    return bag.current.shift()!;
  };
  const shuffle = () => {
    if (items.length < 2) return;
    const n = pick();
    const next = items[n];
    replayClass(shuffleBtn.current, "is-spin");
    setLoading(true);
    setCur(n);
    setTimeout(() => setSrc(next.url + "?embed=1"), motionOff() ? 0 : 220);
    setStatus(`דוגמה חדשה: ${next.title}. הקישו על החותם כדי לפתוח`);
    track("hero_shuffle", { demo: next.url });
  };

  const slug = it ? it.url.split("/").pop()!.replace(".html", "") : "";
  return (
    <div className="demo-wrap">
      <p className="hand-note" aria-hidden="true">
        נסו אותי!<svg><use href="#d-arrow" /></svg>
      </p>
      <figure className="stamp" aria-hidden="true">
        <img src="images/favicon.png" alt="" width="96" height="96" />
        <figcaption>Matanot · 2026</figcaption>
      </figure>
      <div className="phone" id="demo" role="region" aria-label={it ? `הדגמה חיה של הפתעה: ${it.title}` : "הדגמה חיה של הפתעה"} ref={phone}>
        <div className="phone__notch" aria-hidden="true" />
        <div className={"phone__screen" + (loading ? " is-loading" : "")} id="demoScreen" ref={screen}>
          <iframe id="demoFrame" ref={frame} title={it ? `הדגמה חיה: ${it.title}` : "הדגמה חיה של הפתעה בקישור"} src={src} onLoad={onLoad} />
          <div className="phone__loading" aria-hidden="true"><span /></div>
        </div>
      </div>
      <div className="demo-ctl">
        <button type="button" className="demo-shuffle" id="demoShuffle" ref={shuffleBtn} onClick={shuffle}>
          <span className="demo-shuffle__ico" data-icon="replay"><Icon name="replay" /></span>
          <span>הגרלת דוגמה אחרת</span>
        </button>
        <p className="demo-now">
          <span>עכשיו בטלפון:</span> <b id="demoNow">{it?.title}</b>
        </p>
        <ul className="demo-feat" id="demoFeat" aria-label="מה יש בדוגמה הזו">
          {(it?.features || []).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="demo-links">
          <a id="demoFull" href={it?.url} target="_blank" rel="noopener">
            <span data-icon="eye"><Icon name="eye" /></span>מסך מלא<span className="sr-only"> (נפתח בחלון חדש)</span>
          </a>
          <a id="demoOrder" href={`order.html?type=${encodeURIComponent(it?.order || "partner")}&src=hero-${slug}`}>
            <span data-icon="wand"><Icon name="wand" /></span>לבנות כזו בדיוק
          </a>
        </p>
      </div>
      <p className="sr-only" id="demoStatus" aria-live="polite">{status}</p>
    </div>
  );
}
