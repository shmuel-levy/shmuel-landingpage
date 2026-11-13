/* =========================================================
   The envelope: a wax seal that cracks, a flap that opens over a patterned
   liner, and a card that slides out, comes forward, and only then gets its text.
   Used by the home page, the surprise engine, the sketch and the order form.

   Timeline (ms):
     0     seal pressed, a crack line runs across it (sound + haptic)
     150   both halves of the seal fall, wax crumbs
     420   the flap opens in 3D and reveals the liner
     1080  the card slides out of the pocket (paper sound)
     1820  the card comes forward, the envelope drops away, glow + sparkles,
           the text is written on the card line by line (chime)
     2700  presented → done()
   ========================================================= */
import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState, type CSSProperties, type MouseEvent, type Ref } from "react";
import { Icon } from "./Icon";
import { paletteStyle } from "@/lib/envelope/palettes";
import { playSfx } from "@/lib/sfx";
import { motionOff, vibrate } from "@/lib/motion";

export const STAGES = ["is-cracked", "is-split", "is-open", "is-out", "is-lifted", "is-presented"] as const;
const STAGE_AT = [0, 150, 420, 1080, 1820, 2700];
export const ENVELOPE_DURATION = 2700;

export interface EnvelopeHandle {
  /** Run the opening animation. `done` fires when the card is presented (+ opts.hold ms). */
  open: (done?: () => void, opts?: { hold?: number }) => void;
  /** Back to the closed state. */
  reset: () => void;
  /** Final state without animation. */
  show: () => void;
  isOpening: () => boolean;
  element: () => HTMLButtonElement | null;
}

export interface EnvelopeProps {
  label?: string;
  mark?: string;
  liner?: string;
  to?: string;
  cardIcon?: string;
  cardTitle?: string;
  cardText?: string;
  cardSign?: string;
  postmark?: boolean;
  /** the tapping-finger hint */
  hint?: boolean;
  palette?: string;
  className?: string;
  /** decorative copies (home page mock-ups) */
  decorative?: boolean;
  ariaLabel?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<EnvelopeHandle>;
}

interface Particle { x: string; y: string; r: string; s: string; delay: string; shape?: "heart" | "spark"; dot?: boolean }

function particles(n: number, kind: "crumb" | "spark"): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const d = kind === "crumb" ? 26 + Math.random() * 40 : 70 + Math.random() * 100;
    return {
      x: (Math.cos(a) * d).toFixed(1) + "px",
      y: (Math.sin(a) * d * (kind === "crumb" ? 0.5 : 0.8) + (kind === "crumb" ? 46 : -10)).toFixed(1) + "px",
      r: (Math.random() * 540 - 270).toFixed(0) + "deg",
      s: (0.6 + Math.random() * 0.8).toFixed(2),
      delay: (Math.random() * (kind === "crumb" ? 60 : 260)).toFixed(0) + "ms",
      dot: kind === "spark" && i % 4 === 0,
      shape: kind === "spark" && i % 4 !== 0 ? (i % 4 === 2 ? "heart" : "spark") : undefined,
    };
  });
}

// The wax blob: an imperfect circle, like a real seal.
const BLOB = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const r = 44 + 2.6 * Math.sin(7 * t + 0.3) + 1.7 * Math.sin(13 * t + 1.2) + 1.1 * Math.sin(3 * t);
    pts.push((50 + r * Math.cos(t)).toFixed(1) + " " + (50 + r * Math.sin(t)).toFixed(1));
  }
  return "M" + pts.join("L") + "Z";
})();
const HEART = "M50 66C38 58 31 51 31 43c0-6 4.6-10 10-10 4 0 7 2.2 9 5.5 2-3.3 5-5.5 9-5.5 5.4 0 10 4 10 10 0 8-7 15-19 23z";
// the crack line along which the two halves of the seal separate
const CRACK = "M54 0L47 21L56 40L46 60L55 79L49 100";
const SEAL_FONT = "'Frank Ruhl Libre','Suez One',serif";

function Seal({ mark, gid }: { mark?: string; gid: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gid} cx="36%" cy="30%" r="78%">
          <stop offset="0" style={{ stopColor: "var(--env-seal-hi)" }} />
          <stop offset=".5" style={{ stopColor: "var(--env-seal)" }} />
          <stop offset="1" style={{ stopColor: "var(--env-seal-deep)" }} />
        </radialGradient>
      </defs>
      <path d={BLOB} fill={`url(#${gid})`} />
      <circle cx="50" cy="50" r="30" fill="none" style={{ stroke: "var(--env-seal-deep)" }} strokeWidth="2.6" opacity=".5" />
      <circle cx="50" cy="51.2" r="30" fill="none" stroke="#fff" strokeWidth="1.1" opacity=".28" />
      {mark ? (
        <>
          <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily={SEAL_FONT} fontWeight="700" fontSize="42" fill="#fff" opacity=".28" transform="translate(0 1.2)">{mark}</text>
          <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily={SEAL_FONT} fontWeight="700" fontSize="42" style={{ fill: "var(--env-seal-deep)" }} opacity=".9">{mark}</text>
        </>
      ) : (
        <>
          <path d={HEART} fill="#fff" opacity=".28" transform="translate(0 1.2)" />
          <path d={HEART} style={{ fill: "var(--env-seal-deep)" }} opacity=".85" />
        </>
      )}
      <ellipse cx="34" cy="27" rx="13" ry="5.5" fill="#fff" opacity=".22" transform="rotate(-32 34 27)" />
    </svg>
  );
}

const Postmark = () => (
  <svg className="env__postmark" viewBox="0 0 120 60" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="30" cy="30" r="22" />
      <circle cx="30" cy="30" r="16" strokeWidth="1.2" />
      <path d="M58 18c8-6 14 6 22 0s14 6 22 0 10 4 14 2M58 30c8-6 14 6 22 0s14 6 22 0 10 4 14 2M58 42c8-6 14 6 22 0s14 6 22 0 10 4 14 2" />
    </g>
    <text x="30" y="31" textAnchor="middle" dominantBaseline="central" fontFamily="Heebo,Arial,sans-serif" fontWeight="800" fontSize="8.5" fill="currentColor" letterSpacing=".5">MATANOT</text>
  </svg>
);

const TapFinger = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#fff" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M9.2 13.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6l5.1.9c1.1.2 1.9 1.2 1.8 2.3l-.5 4.5a3 3 0 0 1-3 2.6h-3.9a3 3 0 0 1-2.4-1.2l-3.3-4.4a1.5 1.5 0 0 1 2.2-2z" />
  </svg>
);

const SPARK_PATH = "M12 1.5c.9 6.1 3.4 9.1 10.5 10.5-7.1 1.4-9.6 4.4-10.5 10.5C11.1 16.4 8.6 13.4 1.5 12 8.6 10.6 11.1 7.6 12 1.5z";
const HEART_PATH = "M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z";

function ParticleEls({ list, kind }: { list: Particle[]; kind: "crumb" | "spark" }) {
  return (
    <>
      {list.map((p, i) => (
        <i
          key={i}
          className={`env__p env__p--${kind}${p.dot ? " env__p--dot" : ""}`}
          style={{ "--x": p.x, "--y": p.y, "--r": p.r, "--s": p.s, animationDelay: p.delay } as CSSProperties}
        >
          {p.shape && (
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d={p.shape === "heart" ? HEART_PATH : SPARK_PATH} />
            </svg>
          )}
        </i>
      ))}
    </>
  );
}

export function Envelope(props: EnvelopeProps) {
  const { label = "פתיחת המעטפה", mark, liner = "dots", to, cardIcon, cardTitle, cardText, cardSign, postmark = true, hint = true, palette, className, decorative, ariaLabel, onClick, ref } = props;
  const gid = "sg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const btn = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const opening = useRef(false);
  const [stage, setStage] = useState(0); // how many STAGES are applied
  const [instant, setInstant] = useState(false);
  const [crumbs, setCrumbs] = useState<Particle[]>([]);
  const [sparks, setSparks] = useState<Particle[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const open = useCallback((done?: () => void, opts: { hold?: number } = {}) => {
    if (opening.current) return;
    opening.current = true;
    clear();
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    if (motionOff()) {
      setInstant(true);
      setStage(STAGES.length);
      if (done) later(60 + (opts.hold || 0), done);
      return;
    }
    setStage(1);
    playSfx("crack");
    vibrate(14);
    STAGES.forEach((s, i) => {
      if (i === 0) return;
      later(STAGE_AT[i], () => {
        setStage(i + 1);
        if (s === "is-split") setCrumbs(particles(11, "crumb"));
        if (s === "is-out") playSfx("paper");
        if (s === "is-lifted") {
          setSparks(particles(22, "spark"));
          playSfx("chime");
          vibrate(8);
        }
      });
    });
    if (done) later(ENVELOPE_DURATION + (opts.hold || 0), done);
  }, []);

  const reset = useCallback(() => {
    clear();
    opening.current = false;
    setStage(0);
    setInstant(false);
    setCrumbs([]);
    setSparks([]);
  }, []);

  const show = useCallback(() => {
    opening.current = true;
    setInstant(true);
    setStage(STAGES.length);
  }, []);

  useImperativeHandle(ref, () => ({ open, reset, show, isOpening: () => opening.current, element: () => btn.current }), [open, reset, show]);

  const fullLabel = ariaLabel || (to && !label.includes(to) ? `${label}, ${to}` : label);
  const cls = [
    "env",
    `env--liner-${liner}`,
    to ? "env--has-to" : "",
    className || "",
    ...STAGES.slice(0, stage),
    instant ? "is-instant" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={btn}
      type="button"
      className={cls}
      data-palette={palette}
      style={palette ? paletteStyle(palette) : undefined}
      aria-label={decorative ? undefined : fullLabel}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      onClick={onClick}
    >
      <span className="env__float">
        <span className="env__back"><span className="env__liner" /></span>
        <span className="env__glow" aria-hidden="true" />
        <span className="env__card">
          <span className="env__card-in">
            {cardIcon && <span className="env__card-medal"><Icon name={cardIcon} className="env__card-ico" /></span>}
            {cardTitle && <b className="env__card-title">{cardTitle}</b>}
            {cardText && <small className="env__card-text">{cardText}</small>}
            <i className="env__card-rule" />
            {cardSign && <em className="env__card-sign">{cardSign}</em>}
          </span>
          <span className="env__card-sheen" aria-hidden="true" />
        </span>
        <span className="env__pocket">
          <span className="env__sides" />
          <span className="env__bottom-wrap"><span className="env__bottom" /></span>
          {postmark && <Postmark />}
          {to && <span className="env__to" aria-hidden="true">{to}</span>}
        </span>
        <span className="env__flapshade"><i /></span>
        <span className="env__flap">
          <span className="env__flap-out" />
          <span className="env__flap-in"><span className="env__liner" /></span>
        </span>
        <span className="env__sheen" aria-hidden="true" />
        <span className="env__seal">
          <span className="env__seal-half env__seal-half--a"><Seal mark={mark} gid={gid + "a"} /></span>
          <span className="env__seal-half env__seal-half--b"><Seal mark={mark} gid={gid + "b"} /></span>
          <svg className="env__crack" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d={CRACK} /></svg>
          <ParticleEls list={crumbs} kind="crumb" />
        </span>
        {hint && (
          <span className="env__tap" aria-hidden="true"><i /><i /><TapFinger /></span>
        )}
        <span className="env__fx" aria-hidden="true"><ParticleEls list={sparks} kind="spark" /></span>
      </span>
      <span className="env__shadow" />
    </button>
  );
}
