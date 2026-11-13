import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { Icon } from "@/components/Icon";
import { useSurprise } from "../context";
import { Count, Medal, NextButton, StepShell, Sub, Title } from "../parts";
import { pickRunawaySpot } from "../runaway";
import type { CandlesStep, ChecklistStep, HoldStep, QuizStep, RunawayStep, ScratchStep, WheelStep } from "../types";

/* ---------- "will you...?" with a "no" button that runs away ---------- */
export function RunawayView({ s }: { s: RunawayStep }) {
  const { fill, announce, burst, next } = useSurprise();
  const area = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  const tries = useRef(0);
  const last = useRef(-1);
  const [noState, setNoState] = useState<{ text: string; style: CSSProperties } | null>(null);
  const [yesScale, setYesScale] = useState(1);
  const [after, setAfter] = useState(false);
  const texts = s.noTexts?.length ? s.noTexts : ["בטוח?", "נסו שוב", "כמעט..."];

  const run = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!area.current || !yes.current || !no.current) return;
    const n = ++tries.current;
    const ys = Math.min(1.35, 1 + n * 0.06);
    const ns = Math.max(0.6, 1 - n * 0.06);
    const spot = pickRunawaySpot(area.current, no.current, yes.current, ys, last.current, ns);
    last.current = spot.i;
    setNoState({ text: texts[(n - 1) % texts.length], style: { left: spot.x + "px", top: spot.y + "px", transform: `scale(${ns})` } });
    setYesScale(ys);
  };

  if (after) {
    return (
      <StepShell type="runaway">
        <Medal name={s.afterIcon || "smile-heart"} cls="beat" />
        <AutoFocusTitle text={s.after} />
        {s.afterText && <p className="step__text">{fill(s.afterText)}</p>}
        <NextButton label={s.cta} celebrate={{ lead: 1200, step: s }} />
      </StepShell>
    );
  }
  return (
    <StepShell type="runaway">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className="run-area" role="group" aria-label={s.title} ref={area}>
        <button
          ref={yes}
          type="button"
          className="btn btn--primary run-yes"
          style={yesScale !== 1 ? { transform: `scale(${yesScale})` } : undefined}
          onClick={() => {
            burst(80);
            if (s.after) setAfter(true);
            else next();
          }}
        >
          {s.yes}
        </button>
        <button
          ref={no}
          type="button"
          className={"btn btn--ghost run-no" + (noState ? " is-running" : "")}
          style={noState?.style}
          onPointerEnter={(e) => e.pointerType === "mouse" && run(e)}
          onPointerDown={run}
          onClick={(e) => {
            run(e);
            announce("הכפתור ברח. נשאר רק כן");
          }}
        >
          {noState ? noState.text : s.no}
        </button>
      </div>
      <p className="hint">{s.hint || ""}</p>
    </StepShell>
  );
}

function AutoFocusTitle({ text }: { text?: string }) {
  const { fill } = useSurprise();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <h1 ref={ref} className="step__title" tabIndex={-1}>
      {fill(text)}
    </h1>
  );
}

/* ---------- a checklist; the button unlocks when everything is ticked ---------- */
const CHECK = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export function ChecklistView({ s }: { s: ChecklistStep }) {
  const { burst, announce } = useSurprise();
  const [checked, setChecked] = useState<boolean[]>(() => s.items.map(() => false));
  const [unlocked, setUnlocked] = useState(false);
  const done = checked.filter(Boolean).length;
  const all = done === s.items.length;
  useEffect(() => {
    if (all && !unlocked) {
      setUnlocked(true);
      burst(40);
      announce(s.doneText || "הכל מוכן!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  return (
    <StepShell type="checklist">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className="checklist">
        {s.items.map((it, i) => (
          <div className="check" key={i}>
            <input type="checkbox" id={`ck${i}`} checked={checked[i]} onChange={(e) => setChecked((c) => c.map((x, j) => (j === i ? e.target.checked : x)))} />
            <label htmlFor={`ck${i}`}>
              <span className="check__box">{CHECK}</span>
              <span className="check__ico" aria-hidden="true"><Icon name={it.icon || "check"} /></span>
              <span className="check__text">{it.label}</span>
            </label>
          </div>
        ))}
      </div>
      <div className="meter" aria-hidden="true">
        <b style={{ width: (done / s.items.length) * 100 + "%" }} />
      </div>
      <p className="sr-only" aria-live="polite" id="ckStatus">{done ? `סומנו ${done} מתוך ${s.items.length}` : ""}</p>
      <NextButton label={s.cta} disabled={!all} celebrate={unlocked ? { lead: 900, step: s } : null} />
    </StepShell>
  );
}

/* ---------- trivia: retry until right, score = right on the first try ---------- */
export function QuizView({ s }: { s: QuizStep }) {
  const { fill, burst, reduce } = useSurprise();
  const [q, setQ] = useState(0);
  const [done, setDone] = useState(false);
  const [right, setRight] = useState<number | null>(null);
  const [wrong, setWrong] = useState<{ i: number; n: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const firstTry = useRef(0);
  const missed = useRef(false);
  const qRef = useRef<HTMLParagraphElement>(null);
  const Q = s.questions[q];

  useEffect(() => {
    if (q > 0) qRef.current?.focus({ preventScroll: true });
  }, [q]);

  if (done) {
    const total = s.questions.length;
    const perfect = firstTry.current === total;
    return (
      <StepShell type="quiz">
        <Medal name={perfect ? "trophy" : "star"} cls="beat" />
        <AutoFocusTitle text={perfect ? `${total} מתוך ${total}! ציון מושלם` : `צדקת ב-${firstTry.current} מתוך ${total}`} />
        <p className="step__text">{fill(s.doneText || "")}</p>
        <NextButton label={s.cta} celebrate={{ lead: 1400, step: s }} />
      </StepShell>
    );
  }
  const answer = (i: number) => {
    if (right != null) return;
    const ok = Q.correct === -1 || Q.correct === undefined || i === Q.correct;
    if (ok) {
      if (!missed.current) firstTry.current++;
      setRight(i);
      setFeedback(Q.right || "נכון!");
      burst(30);
      setTimeout(() => {
        if (q + 1 < s.questions.length) {
          missed.current = false;
          setRight(null);
          setWrong(null);
          setFeedback("");
          setQ(q + 1);
        } else setDone(true);
      }, reduce ? 600 : 1400);
    } else {
      missed.current = true;
      setWrong((w) => ({ i, n: (w?.n || 0) + 1 }));
      setFeedback(Q.wrong || "לא בדיוק... נסו שוב");
    }
  };
  return (
    <StepShell type="quiz">
      <Medal name={s.icon || "question"} />
      <Title text={s.title} />
      <p className="quiz__count">שאלה {q + 1} מתוך {s.questions.length}</p>
      <p className="quiz__q" id={`qq${q}`} ref={qRef} tabIndex={q > 0 ? -1 : undefined}>{fill(Q.q)}</p>
      <div className="options" role="group" aria-labelledby={`qq${q}`}>
        {Q.options.map((o, i) => (
          <button
            // re-mount on each wrong answer so the shake animation replays
            key={`${q}-${i}-${wrong?.i === i ? wrong.n : 0}`}
            type="button"
            className={"option option--plain" + (right === i ? " is-right" : "") + (wrong?.i === i ? " is-wrong" : "")}
            disabled={right != null}
            onClick={() => answer(i)}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="feedback" aria-live="assertive">{feedback}</p>
    </StepShell>
  );
}

/* ---------- a scratch card drawn on a canvas ---------- */
export function ScratchView({ s }: { s: ScratchStep }) {
  const { fill, announce, burst } = useSurprise();
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const r = s.reveal;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    announce(`${r.text}. ${r.small || ""}`);
    burst(90);
  };

  useEffect(() => {
    const canvas = cv.current!, host = box.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = host.offsetWidth * dpr;
    canvas.height = host.offsetHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, s.cover1 || "#C9CED8");
    g.addColorStop(0.5, s.cover2 || "#EEF1F6");
    g.addColorStop(1, s.cover1 || "#BAC0CC");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, (2 + Math.random() * 6) * dpr, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(40,50,80,.75)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${22 * dpr}px Heebo, Arial, sans-serif`;
    ctx.fillText(s.coverText || "גרדו כאן", canvas.width / 2, canvas.height / 2);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 46 * dpr;

    let drawing = false, last: { x: number; y: number } | null = null, moves = 0;
    const pos = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      return { x: (e.clientX - b.left) * (canvas.width / b.width), y: (e.clientY - b.top) * (canvas.height / b.height) };
    };
    const check = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 40) {
        total++;
        if (data[i] < 40) clear++;
      }
      if (clear / total > 0.5) finish();
    };
    const scratchTo = (p: { x: number; y: number }) => {
      ctx.beginPath();
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 23 * dpr, 0, 7);
      ctx.fill();
      last = p;
      if (++moves % 8 === 0) check();
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      last = null;
      canvas.setPointerCapture(e.pointerId);
      scratchTo(pos(e));
    };
    const move = (e: PointerEvent) => drawing && scratchTo(pos(e));
    const up = () => {
      drawing = false;
      last = null;
      if (!doneRef.current && moves) check();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    const ends = ["pointerup", "pointercancel", "pointerleave"] as const;
    ends.forEach((t) => canvas.addEventListener(t, up));
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      ends.forEach((t) => canvas.removeEventListener(t, up));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepShell type="scratch">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className={"scratch" + (done ? " is-done" : "")} ref={box}>
        <div className="scratch__reveal" aria-hidden={!done}>
          <Medal name={r.icon || "heart"} cls="" />
          <strong>{fill(r.text)}</strong>
          {r.small && <small>{fill(r.small)}</small>}
        </div>
        <canvas ref={cv} aria-hidden="true" />
      </div>
      <button type="button" className="skip" hidden={done} onClick={finish}>
        לגלות בלי לגרד
      </button>
      {done && <NextButton label={s.cta} focus celebrate={{ lead: 2300, step: s }} />}
    </StepShell>
  );
}

/* ---------- press and hold until the heart fills up ---------- */
const HEART_D = "M50 88C22 68 4 52 4 30 4 14 16 4 30 4c9 0 16 5 20 12 4-7 11-12 20-12 14 0 26 10 26 26 0 22-18 38-46 58z";
export function HoldView({ s }: { s: HoldStep }) {
  const { fill, announce, burst } = useSurprise();
  const fillRect = useRef<SVGRectElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [holding, setHolding] = useState(false);
  const [full, setFull] = useState(false);
  const [status, setStatus] = useState("");
  const st = useRef({ p: 0, holding: false, lastT: 0, full: false, lastSaid: 0, raf: 0 });
  const DUR = s.duration || 1800;

  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  const frame = (t: number) => {
    const S = st.current;
    const dt = S.lastT ? t - S.lastT : 16;
    S.lastT = t;
    S.p = Math.max(0, Math.min(1, S.p + (S.holding ? dt / DUR : -dt / 2500)));
    fillRect.current?.setAttribute("y", String(92 - 92 * S.p));
    if (pct.current) pct.current.textContent = Math.round(S.p * 100) + "%";
    const quarter = Math.floor(S.p * 4);
    if (quarter !== S.lastSaid) {
      S.lastSaid = quarter;
      setStatus(Math.round(S.p * 100) + "%");
    }
    if (S.p >= 1 && !S.full) {
      S.full = true;
      S.holding = false;
      setHolding(false);
      setFull(true);
      burst(70);
      announce(s.doneText || "הלב מלא!");
      return;
    }
    if (S.holding || S.p > 0) S.raf = requestAnimationFrame(frame);
    else S.lastT = 0;
  };
  const start = (e?: { preventDefault: () => void }) => {
    const S = st.current;
    if (S.full) return;
    e?.preventDefault();
    if (S.holding) return;
    S.holding = true;
    S.lastT = 0;
    setHolding(true);
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    st.current.holding = false;
    setHolding(false);
  };
  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (!down) return stop();
    if (!e.repeat) start(e);
    else e.preventDefault();
  };

  return (
    <StepShell type="hold">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <button
        type="button"
        className={"hold" + (holding ? " is-holding" : "") + (full ? " is-full" : "")}
        aria-label="לחצו והחזיקו כדי למלא את הלב"
        onPointerDown={(e: RPointerEvent) => start(e)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => onKey(e, true)}
        onKeyUp={(e) => onKey(e, false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 100 92" aria-hidden="true">
          <defs>
            <clipPath id="hc"><path d={HEART_D} /></clipPath>
          </defs>
          <path className="h-bg" d={HEART_D} />
          <rect ref={fillRect} className="h-fill" clipPath="url(#hc)" x="0" y="92" width="100" height="92" />
        </svg>
        {/* the percentage is written on every animation frame, outside React (inner span keeps React's tree intact) */}
        <span className="hold__pct" aria-hidden="true">
          {full ? <Icon name="heart" /> : <span ref={pct}>0%</span>}
        </span>
      </button>
      <p className="hint">{s.hint || "לחצו והחזיקו"}</p>
      <p className="sr-only" aria-live="polite" id="holdStatus">{status}</p>
      {full && s.doneText && <p className="reply">{fill(s.doneText)}</p>}
      {full && <NextButton label={s.cta} focus celebrate={{ lead: 1700, step: s }} />}
    </StepShell>
  );
}

/* ---------- birthday candles: tap each to blow it out ---------- */
export function CandlesView({ s }: { s: CandlesStep }) {
  const { burst } = useSurprise();
  const n = s.count || 5;
  const [out, setOut] = useState<boolean[]>(() => Array(n).fill(false));
  const left = out.filter((x) => !x).length;
  return (
    <StepShell type="candles">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className="cake">
        <div className="cake__candles">
          {out.map((isOut, i) => (
            <button
              key={i}
              type="button"
              className={"candle" + (isOut ? " is-out" : "")}
              disabled={isOut}
              aria-label={isOut ? "הנר כבוי" : `כיבוי נר ${i + 1}`}
              onClick={() => {
                if (isOut) return;
                const nextOut = out.map((x, j) => (j === i ? true : x));
                setOut(nextOut);
                if (nextOut.every(Boolean)) burst(100);
              }}
            >
              <span className="flame" />
              <span className="smoke" />
            </button>
          ))}
        </div>
        <div className="cake__body" />
        <div className="cake__plate" />
      </div>
      <Count>{left ? `נשארו ${left} נרות` : s.doneText || "המשאלה בדרך!"}</Count>
      {!left && <NextButton label={s.cta} focus celebrate={{ lead: 1100, step: s }} />}
    </StepShell>
  );
}

/* ---------- a spinning prize wheel ---------- */
export function WheelView({ s }: { s: WheelStep }) {
  const { fill, burst, reduce, setAnswer } = useSurprise();
  const opts = s.options, n = opts.length, seg = 360 / n;
  const [rot, setRot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const { fills, inks } = useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (x: string) => cs.getPropertyValue(x).trim();
    return {
      fills: [v("--accent-deep"), "#FFFFFF", v("--accent"), v("--soft")],
      inks: ["#FFFFFF", v("--ink"), "#FFFFFF", v("--ink")],
    };
  }, []);
  const P = (a: number) => [Math.cos((a * Math.PI) / 180) * 96, Math.sin((a * Math.PI) / 180) * 96].map((x) => x.toFixed(2)).join(" ");

  const spin = () => {
    if (busy) return;
    setBusy(true);
    const i = Math.floor(Math.random() * n);
    const target = (360 - (i * seg + seg / 2)) % 360;
    setRot((cur) => cur - (cur % 360) + 360 * 5 + target);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      if (s.key) setAnswer(s.key, opts[i]);
      setResult(opts[i]);
      burst(50);
    }, reduce ? 50 : 3700);
  };

  return (
    <StepShell type="wheel">
      <Medal name={s.icon || "sparkle"} cls="" />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className="wheel">
        <span className="wheel__pointer" aria-hidden="true" />
        <svg className="wheel__svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
          <g className="wheel__rot" style={{ transition: rot ? (reduce ? "none" : "transform 3.6s cubic-bezier(.17,.67,.21,1)") : undefined, transform: rot ? `rotate(${rot}deg)` : undefined }}>
            {opts.map((o, i) => {
              const a0 = -90 + i * seg, a1 = a0 + seg, mid = a0 + seg / 2, k = n % 2 && i === n - 1 ? 1 : i % 4;
              return (
                <g key={i}>
                  <path d={`M0 0L${P(a0)}A96 96 0 0 1 ${P(a1)}Z`} fill={fills[k]} stroke="rgba(0,0,0,.08)" />
                  <text transform={`rotate(${mid}) translate(58 0)`} fill={inks[k]} fontSize={o.length > 9 ? 9 : 11} fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="Heebo, Arial, sans-serif">
                    {o}
                  </text>
                </g>
              );
            })}
          </g>
          <circle r="18" fill="#fff" stroke="rgba(0,0,0,.1)" />
          <circle r="7" fill={fills[0]} />
        </svg>
      </div>
      <button type="button" className="btn btn--primary wheel__spin" disabled={busy} onClick={spin}>
        <Icon name="replay" />
        {result ? "לסובב שוב" : s.spin || "לסובב!"}
      </button>
      <div className="reply-wrap" aria-live="polite">
        {result && (
          <p className="reply">
            <b>{result}</b>
            {s.reply ? " · " + fill(s.reply) : ""}
          </p>
        )}
      </div>
      {result != null && <NextButton label={s.cta} celebrate={{ lead: 2600, step: s }} />}
    </StepShell>
  );
}
