import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { useSurprise } from "../context";
import { Count, Medal, NextButton, StepShell, Sub, Title } from "../parts";
import type { OpenWhenStep, PhotosStep, ReasonsStep, VoiceStep } from "../types";

/* ---------- a stack of polaroids: tap to throw the top one away ---------- */
const PH_BG = ["linear-gradient(135deg,var(--soft),var(--accent))", "linear-gradient(135deg,#E6EEFF,#AFC6FF)", "linear-gradient(135deg,#FFF6D9,#FFD98A)", "linear-gradient(135deg,#E3F7EF,#A9E3CB)", "linear-gradient(135deg,#EFE8FB,#CDB8EE)"];
const PH_ROT = [-4, 3, -2, 5, -5];
export function PhotosView({ s }: { s: PhotosStep }) {
  const { fill } = useSurprise();
  const items = s.items;
  const [cur, setCur] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const finished = cur >= items.length;

  useEffect(() => {
    if (cur > 0 && !finished) refs.current[cur]?.focus({ preventScroll: true });
  }, [cur, finished]);

  // rendered in reverse so the first photo is on top of the stack
  const order = items.map((it, i) => ({ it, i })).reverse();
  return (
    <StepShell type="photos">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub || "הקישו על התמונה לתמונה הבאה"} />
      <div className="album">
        {order.map(({ it, i }) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            className={"polaroid" + (i < cur ? " is-gone" : "")}
            data-i={i}
            style={{ "--rot": PH_ROT[i % PH_ROT.length] + "deg" } as CSSProperties}
            tabIndex={i === cur ? 0 : -1}
            aria-hidden={i !== cur}
            aria-label={`תמונה ${i + 1} מתוך ${items.length}: ${it.caption}. הקישו לתמונה הבאה`}
            onClick={() => i === cur && setCur(cur + 1)}
          >
            <span className="polaroid__img" style={it.src ? undefined : { background: PH_BG[i % PH_BG.length] }} aria-hidden="true">
              {it.src ? (
                <img src={it.src} alt="" width={600} height={560} decoding="async" loading={i > 1 ? "lazy" : undefined} />
              ) : (
                <>
                  <Icon name="image" />
                  <small>כאן תופיע התמונה שלכם</small>
                </>
              )}
            </span>
            <span className="polaroid__cap" aria-hidden="true">{fill(it.caption)}</span>
          </button>
        ))}
      </div>
      <Count>{finished ? s.doneText || "אלה הרגעים שלנו" : `תמונה ${cur + 1} מתוך ${items.length}`}</Count>
      {finished && <NextButton label={s.cta} focus celebrate={{ lead: 600, step: s }} />}
    </StepShell>
  );
}

/* ---------- "why you": cards that flip one by one ---------- */
export function ReasonsView({ s }: { s: ReasonsStep }) {
  const { fill, burst } = useSurprise();
  const items = s.items.slice(0, 8);
  const [flipped, setFlipped] = useState<boolean[]>(() => items.map(() => false));
  const open = flipped.filter(Boolean).length;
  const all = open === items.length;
  return (
    <StepShell type="reasons">
      <Medal name={s.icon || "hearts"} cls="beat" />
      <Title text={s.title} />
      <Sub text={s.sub || "הקישו על כל קלף"} />
      <ul className={"reasons" + (items.length > 6 ? " reasons--3" : "")} role="list">
        {items.map((t, i) => (
          <li key={i}>
            <button
              type="button"
              className={"reason" + (flipped[i] ? " is-flipped" : "")}
              data-i={i}
              aria-label={flipped[i] ? undefined : `קלף ${i + 1} מתוך ${items.length}, הקישו לחשיפה`}
              onClick={() => {
                if (flipped[i]) return;
                const nf = flipped.map((x, j) => (j === i ? true : x));
                setFlipped(nf);
                if (nf.every(Boolean)) burst(60);
              }}
            >
              <span className="reason__in">
                <span className="reason__front" aria-hidden="true">
                  <Icon name="heart" />
                  <b>{i + 1}</b>
                </span>
                <span className="reason__back" aria-hidden={!flipped[i]}>{fill(t)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Count>{all ? s.doneText || "ויש עוד אלף כאלה" : `נחשפו ${open} מתוך ${items.length}`}</Count>
      {open > 0 && <NextButton label={s.cta} celebrate={all ? { lead: 1700, step: s } : null} />}
    </StepShell>
  );
}

/* ---------- "open when...": little envelopes for different moments ---------- */
export function OpenWhenView({ s }: { s: OpenWhenStep }) {
  const { fill } = useSurprise();
  const prefix = s.prefix || "פתחו כש...";
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [seen, setSeen] = useState<boolean[]>(() => s.items.map(() => false));
  const [anyOpened, setAnyOpened] = useState(false);
  const whenRef = useRef<HTMLParagraphElement>(null);
  const envRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastIdx = useRef<number | null>(null);

  useEffect(() => {
    if (openIdx != null) whenRef.current?.focus({ preventScroll: true });
    else if (lastIdx.current != null) envRefs.current[lastIdx.current]?.focus({ preventScroll: true });
  }, [openIdx]);

  const it = openIdx != null ? s.items[openIdx] : null;
  return (
    <StepShell type="openwhen">
      <Medal name={s.icon || "mail-open"} />
      <Title text={s.title} />
      <Sub text={s.sub || "מעטפה לכל רגע. הקישו כדי לפתוח"} />
      <ul className="ow" role="list" hidden={openIdx != null}>
        {s.items.map((x, i) => (
          <li key={i}>
            <button
              ref={(el) => {
                envRefs.current[i] = el;
              }}
              type="button"
              className={"ow__env" + (seen[i] ? " is-seen" : "")}
              data-i={i}
              onClick={() => {
                lastIdx.current = i;
                setSeen((v) => v.map((y, j) => (j === i ? true : y)));
                setOpenIdx(i);
                setAnyOpened(true);
              }}
            >
              <Icon name="envelope" className="ow__ico" />
              <span className="ow__label">
                <small>{prefix}</small>
                <b>{fill(x.when)}</b>
              </span>
              <span className="ow__seen" aria-hidden="true"><Icon name="check" /></span>
            </button>
          </li>
        ))}
      </ul>
      <div className="ow__letter" hidden={openIdx == null}>
        <p className="ow__when" tabIndex={-1} ref={whenRef}>{it ? prefix.replace("...", " ") + it.when : ""}</p>
        <p className="ow__text">{it ? fill(it.text) : ""}</p>
        <button type="button" className="btn btn--ghost ow__close" onClick={() => setOpenIdx(null)}>
          <Icon name="arrow-right" />
          חזרה למעטפות
        </button>
      </div>
      {anyOpened && <NextButton label={s.cta} />}
    </StepShell>
  );
}

/* ---------- a voice message from the sender, styled like a chat voice note ---------- */
const fmt = (sec?: number) => {
  const v = Math.max(0, Math.round(sec || 0));
  return Math.floor(v / 60) + ":" + ("0" + (v % 60)).slice(-2);
};
const BARS = Array.from({ length: 30 }, (_, i) => Math.round(28 + Math.abs(Math.sin(i * 1.7) + Math.sin(i * 0.63)) * 34));
export function VoiceView({ s }: { s: VoiceStep }) {
  const { fill, duck, burst, announce, track } = useSurprise();
  const has = !!s.src;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ t: 0, p: 0 });

  // leaving the step mid-message stops the recording
  useEffect(() => () => audio.current?.pause(), []);

  const total = () => {
    const a = audio.current;
    return a && isFinite(a.duration) && a.duration > 0 ? a.duration : s.duration || 0;
  };
  const lit = Math.round(progress.p * BARS.length);
  return (
    <StepShell type="voice">
      <Medal name={s.icon || "mic"} />
      <Title text={s.title || "השארתי לך הודעה"} />
      <Sub text={s.sub} />
      <div className={"voice" + (has ? "" : " voice--empty") + (playing ? " is-playing" : "")}>
        <button
          type="button"
          className="voice__play"
          aria-label={playing ? "עצירת ההודעה" : "השמעת ההודעה"}
          disabled={!has}
          onClick={() => {
            const a = audio.current;
            if (!a) return;
            if (a.paused) {
              duck(true);
              a.play().catch(() => {
                setPlaying(false);
                duck(false);
              });
            } else a.pause();
          }}
        >
          <span className="voice__ring" aria-hidden="true" />
          <Icon name={playing ? "pause" : "play"} />
        </button>
        <div className="voice__body">
          {s.from && <b className="voice__from">{fill(s.from)}</b>}
          <div className="voice__wave" aria-hidden="true">
            {BARS.map((h, i) => (
              <i key={i} className={i < lit ? "is-on" : undefined} style={{ "--h": h + "%" } as CSSProperties} />
            ))}
          </div>
          <p className="voice__time" aria-hidden="true">
            <span className="voice__cur">{fmt(progress.t)}</span>
            <span>{fmt(s.duration)}</span>
          </p>
        </div>
      </div>
      {!has && (
        <p className="voice__ph">
          <Icon name="mic" />
          כאן תתנגן ההקלטה שלכם. מקליטים אותה בשלב העיצוב בטופס.
        </p>
      )}
      {s.caption && (
        <p className="voice__caption">
          <Icon name="chat" />
          <span>{fill(s.caption)}</span>
        </p>
      )}
      {has && (
        <audio
          ref={audio}
          preload="metadata"
          src={s.src}
          onPlay={() => {
            setPlaying(true);
            track("voice_play");
          }}
          onPause={(e) => {
            setPlaying(false);
            if (!e.currentTarget.ended) duck(false);
          }}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setProgress({ t, p: total() ? Math.min(1, t / total()) : 0 });
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress((p) => ({ ...p, p: 1 }));
            duck(false);
            burst(40);
            announce("ההודעה הסתיימה");
          }}
        />
      )}
      <NextButton label={s.cta} />
    </StepShell>
  );
}
