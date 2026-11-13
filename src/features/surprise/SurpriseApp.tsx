/* =========================================================
   The surprise engine. Every example, sketch and real customer surprise
   is just data (window.DEMO); this component plays it step by step.
   ========================================================= */
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { FX_BY_TYPE, playFx, type FxRun } from "@/lib/fx";
import { prefersReducedMotion } from "@/lib/motion";
import { track as trackEvent } from "@/lib/track";
import { SITE } from "@/data/site";
import { SurpriseContext, type SurpriseApi } from "./context";
import { burst as confetti, themeColors } from "./confetti";
import { MusicBox } from "./music";
import { useSketchProtection } from "./protect";
import { fillTemplate } from "./template";
import type { DemoConfig, Step } from "./types";
import { ChoiceView, CountdownView, CouponsView, EnvelopeView, MessageView, NotesView } from "./steps/basic";
import { CandlesView, ChecklistView, HoldView, QuizView, RunawayView, ScratchView, WheelView } from "./steps/games";
import { OpenWhenView, PhotosView, ReasonsView, VoiceView } from "./steps/cards";
import { FinalView, LockedView } from "./steps/endings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VIEWS: Record<Step["type"], ComponentType<{ s: any }>> = {
  envelope: EnvelopeView, message: MessageView, choice: ChoiceView, runaway: RunawayView, checklist: ChecklistView,
  quiz: QuizView, scratch: ScratchView, photos: PhotosView, hold: HoldView, candles: CandlesView, notes: NotesView,
  countdown: CountdownView, reasons: ReasonsView, openwhen: OpenWhenView, wheel: WheelView, coupons: CouponsView,
  voice: VoiceView, locked: LockedView, final: FinalView,
};

const params = () => new URLSearchParams(location.search);

/** Floating background icons in the site colours (random once per visit). */
function Deco({ icons }: { icons: string[] }) {
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        icon: icons[i % icons.length],
        style: {
          left: (i * 11 + Math.random() * 8).toFixed(1) + "%",
          "--s": 18 + Math.random() * 20 + "px",
          "--t": 14 + Math.random() * 12 + "s",
          "--dl": -Math.random() * 24 + "s",
          "--c": i % 3 === 0 ? "var(--accent-deep)" : i % 3 === 1 ? "var(--accent)" : "var(--ink)",
        } as CSSProperties,
      })),
    [icons],
  );
  return (
    <div className="deco" aria-hidden="true">
      {items.map((d, i) => (
        <span key={i} style={d.style}><Icon name={d.icon} /></span>
      ))}
    </div>
  );
}

export function SurpriseApp({ demo }: { demo: DemoConfig }) {
  const sketch = demo.mode === "sketch";
  const gift = demo.mode === "gift";
  const embed = params().has("embed");
  const reduce = prefersReducedMotion();
  const pageName = (location.pathname.split("/").pop() || "").replace(".html", "");
  const steps = demo.steps;

  // ?step=3 opens directly on a step (screenshots, deep links)
  const [idx, setIdx] = useState(() => {
    const n = parseInt(params().get("step") || "", 10);
    return n > 0 && n < steps.length ? n : 0;
  });
  const [run, setRun] = useState(0); // bumps on restart → remounts the step
  const [leaving, setLeaving] = useState(false);
  const [focusOnMount, setFocusOnMount] = useState(false);
  const [live, setLive] = useState("");
  const [music, setMusic] = useState<"idle" | "on" | "off">("idle");
  const idxRef = useRef(idx);
  const pending = useRef(false);
  const answers = useRef<Record<string, string>>({});
  const fxRun = useRef<FxRun | null>(null);
  const fxHost = useRef<HTMLDivElement>(null);
  const box = useMemo(() => new MusicBox(demo.mood, demo.melody, (on) => setMusic(on ? "on" : "off")), [demo.mood, demo.melody]);
  const musicResume = useRef(false);

  useSketchProtection(sketch);

  // body classes the stylesheet relies on
  useEffect(() => {
    const b = document.body.classList;
    if (params().has("clean")) b.add("is-clean");
    if (embed) b.add("is-clean", "is-embed");
    // inside the home-page phone, links open in the main window
    const toTop = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a && !a.target) a.target = "_top";
    };
    if (embed) document.addEventListener("click", toTop, true);
    const hidden = () => document.hidden && box.on && box.stop();
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("click", toTop, true);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [embed, box]);

  const stopFx = useCallback(() => {
    fxRun.current?.stop();
    fxRun.current = null;
  }, []);

  const next = useCallback(() => {
    if (pending.current || idxRef.current >= steps.length - 1) return;
    stopFx();
    idxRef.current += 1;
    const go = () => {
      pending.current = false;
      setLeaving(false);
      setFocusOnMount(true);
      setIdx(idxRef.current);
    };
    if (reduce) return go();
    pending.current = true;
    setLeaving(true);
    setTimeout(go, 320);
  }, [steps.length, reduce, stopFx]);

  const restart = useCallback(() => {
    stopFx();
    answers.current = {};
    idxRef.current = 0;
    setFocusOnMount(true);
    setIdx(0);
    setRun((r) => r + 1);
  }, [stopFx]);

  const announce = useCallback((t: string) => {
    setLive("");
    setTimeout(() => setLive(t), 60);
  }, []);

  const api = useMemo<SurpriseApi>(
    () => ({
      demo, sketch, gift, embed, reduce, focusOnMount, leaving, next, restart, announce, stopFx, pageName,
      siteUrl: demo.siteUrl || SITE.siteUrl,
      burst: (n = 60) => !reduce && confetti(fxHost.current, n, demo.confetti || themeColors()),
      fill: (s) => fillTemplate(s, answers.current, demo.defaults),
      setAnswer: (k, v) => {
        answers.current[k] = v;
      },
      track: (name, p = {}) => !gift && trackEvent(name, p),
      startMusic: () => demo.music !== false && box.start(),
      duck: (on) => {
        if (on) {
          musicResume.current = box.on;
          if (box.on) box.stop();
        } else if (musicResume.current) {
          musicResume.current = false;
          box.start();
        }
      },
      celebrate: (btn, lead, s) => {
        if (!btn || reduce) return;
        if (s && (s.cupid === false || s.fx === false || s.fx === "none")) return;
        const theme = (s && s.fx) || demo.fx || FX_BY_TYPE[demo.orderType || ""] || "cupid";
        if (theme === "none") return;
        // in the home-page phone, cupid already shot once (to open the envelope); twice is too much
        if (embed && theme === "cupid") return;
        const mine = idxRef.current;
        fxRun.current?.stop();
        const r = playFx(theme, {
          target: btn,
          lead: lead || 700,
          onDone: (ok) => {
            fxRun.current = null;
            if (ok && idxRef.current === mine && btn.isConnected) next();
          },
        });
        fxRun.current = r;
        btn.addEventListener("click", () => r.stop(), { once: true });
      },
    }),
    [demo, sketch, gift, embed, reduce, focusOnMount, leaving, next, restart, announce, stopFx, pageName, box],
  );

  const s = steps[idx];
  const View = VIEWS[s.type] || VIEWS.message;
  const flag = gift ? null : sketch ? (
    <p className="demo-flag demo-flag--sketch"><Icon name="pencil" />סקיצה לכיוון · הגרסה האמיתית נבנית ביד</p>
  ) : (
    <p className="demo-flag"><Icon name="sparkle" />אתר לדוגמה · השמות והתמונות להמחשה</p>
  );

  return (
    <SurpriseContext.Provider value={api}>
      {!reduce && demo.deco?.length ? <Deco icons={demo.deco} /> : <div className="deco" aria-hidden="true" />}
      <div className="app">
        <header>
          <div className="topbar">
            {gift ? (
              <span className="back back--gift" aria-hidden="true" />
            ) : sketch ? (
              <span className="back back--sketch"><Icon name="eye" />תצוגה מקדימה</span>
            ) : (
              <a className="back" href="../index.html#examples"><Icon name="arrow-right" />חזרה ל-Matanot</a>
            )}
            <div className="progress" aria-hidden="true">
              {steps.map((_, i) => (
                <i key={i} className={i < idx ? "is-done" : i === idx ? "is-current" : ""} />
              ))}
            </div>
            <button
              className="music"
              type="button"
              aria-pressed={music === "on"}
              aria-label="מוזיקת רקע"
              hidden={demo.music === false}
              onClick={() => box.toggle()}
            >
              <Icon name={music === "idle" ? "music" : music === "on" ? "volume-on" : "volume-off"} />
            </button>
          </div>
          {flag}
        </header>
        <main className="stage" id="stage">
          <View key={`${run}-${idx}`} s={s} />
        </main>
        <footer>
          {!sketch && <p className="desk-hint"><Icon name="phone" />הכי כיף לפתוח מהטלפון</p>}
        </footer>
      </div>
      <div className="fx" aria-hidden="true" ref={fxHost} />
      <p className="sr-only" aria-live="polite" id="live">{live}</p>
      {sketch && <SketchOverlays />}
    </SurpriseContext.Provider>
  );
}

function SketchOverlays() {
  return (
    <>
      <div className="sketch-wm" aria-hidden="true" />
      <div className="sketch-veil" aria-hidden="true">
        <p>
          <Icon name="lock" />
          <b>הסקיצה מוסתרת</b>
          <small>היא רק להמחשה. הגרסה האמיתית נבנית ביד.</small>
        </p>
      </div>
    </>
  );
}
