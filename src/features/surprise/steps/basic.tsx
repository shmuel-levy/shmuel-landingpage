import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Envelope, type EnvelopeHandle } from "@/components/Envelope";
import { Icon } from "@/components/Icon";
import { useSurprise } from "../context";
import { Medal, NextButton, Photo, StepShell, Sub, Title } from "../parts";
import type { ChoiceStep, CountdownStep, CouponsStep, EnvelopeStep, MessageStep, NotesStep } from "../types";

const asList = (t?: string | string[]) => ([] as string[]).concat(t || []);

/* ---------- the opening envelope ---------- */
export function EnvelopeView({ s }: { s: EnvelopeStep }) {
  const { demo, embed, fill, next, announce, startMusic } = useSurprise();
  const env = useRef<EnvelopeHandle>(null);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const card = s.card || {};
  const cardLine = [card.title, card.text].filter(Boolean).join(". ");

  return (
    <StepShell type="envelope" className={opening ? "is-opening" : undefined}>
      <Title text={s.title} />
      <div className="env-stage">
        <Envelope
          ref={env}
          label="פתיחת המעטפה"
          ariaLabel={opened ? cardLine + ". הקישו כדי להמשיך" : undefined}
          mark={s.mark || ""}
          liner={s.liner || demo.liner || "dots"}
          to={s.to ? fill(s.to) : ""}
          cardIcon={card.icon || "heart"}
          cardTitle={card.title || ""}
          cardText={card.text || ""}
          palette={demo.palette || "ink"}
          onClick={(e) => {
            if (opened) return next(); // tapping the open card = continue
            if (env.current?.isOpening()) return;
            setOpening(true);
            // inside the home-page phone, music starts only on a real tap
            if (!embed || e.nativeEvent.isTrusted) startMusic();
            env.current?.open(() => {
              setOpened(true);
              announce(cardLine);
            });
          }}
        />
      </div>
      <p className="hint">
        <Icon name="tap" />
        {s.hint || "הקישו על החותם כדי לפתוח"}
      </p>
      {opened && <NextButton label={s.cta || "ממשיכים"} focus />}
    </StepShell>
  );
}

/* ---------- a message (with a medal or a taped photo) ---------- */
export function MessageView({ s }: { s: MessageStep }) {
  const { fill } = useSurprise();
  return (
    <StepShell type="message">
      {s.photo ? <Photo p={s.photo} cls="photo--taped" /> : <Medal name={s.icon} />}
      <Title text={s.title} />
      {asList(s.text).map((p, i) => (
        <p key={i} className="step__text">{fill(p)}</p>
      ))}
      <NextButton label={s.cta} />
    </StepShell>
  );
}

/* ---------- a multiple-choice question with an answer bubble ---------- */
export function ChoiceView({ s }: { s: ChoiceStep }) {
  const { fill, setAnswer } = useSurprise();
  const [picked, setPicked] = useState<number | null>(null);
  const two = s.options.length % 2 === 0 && s.options.length > 2;
  const o = picked == null ? null : s.options[picked];
  return (
    <StepShell type="choice">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className={`options${two ? " options--2" : ""}${picked != null ? " has-choice" : ""}`} role="group" aria-label={s.title}>
        {s.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className="option"
            aria-pressed={picked === i}
            onClick={() => {
              setPicked(i);
              if (s.key) setAnswer(s.key, opt.value || opt.label);
            }}
          >
            <span className="option__ico" aria-hidden="true"><Icon name={opt.icon || "heart"} /></span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <div className="reply-wrap" aria-live="polite">
        {o?.reply && <p className="reply">{fill(o.reply)}</p>}
      </div>
      {picked != null && <NextButton label={s.cta} />}
    </StepShell>
  );
}

/* ---------- a wall of sticky notes that drop in one by one ---------- */
const NOTE_COLORS = ["#FFF3B0", "#FDE6EE", "#E6EEFF", "#E3F7EF", "#FFE4D1", "#EFE8FB"];
const NOTE_ROTS = [-3, 2.5, -1.5, 3, -2, 1.5];
export function NotesView({ s }: { s: NotesStep }) {
  const { fill, reduce } = useSurprise();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), reduce ? 0 : 300 + s.items.length * 240);
    return () => clearTimeout(t);
  }, [reduce, s.items.length]);
  return (
    <StepShell type="notes">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <ul className="notes" role="list">
        {s.items.map((it, i) => (
          <li
            key={i}
            className="note"
            style={{ "--c": NOTE_COLORS[i % NOTE_COLORS.length], "--rot": NOTE_ROTS[i % NOTE_ROTS.length] + "deg", "--dl": (reduce ? 0 : 300 + i * 240) + "ms" } as CSSProperties}
          >
            {fill(it.text)}
            <small>{it.from}</small>
          </li>
        ))}
      </ul>
      {ready && <NextButton label={s.cta} />}
    </StepShell>
  );
}

/* ---------- a live countdown to a date ---------- */
export function CountdownView({ s }: { s: CountdownStep }) {
  const { fill } = useSurprise();
  const [target] = useState(() => (s.date ? new Date(s.date).getTime() : Date.now() + (s.daysFromNow || 30) * 864e5 + 5 * 36e5));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, target - now);
  const units: [string, number, string][] = [
    ["d", Math.floor(ms / 864e5), "ימים"],
    ["h", Math.floor(ms / 36e5) % 24, "שעות"],
    ["m", Math.floor(ms / 6e4) % 60, "דקות"],
    ["s", Math.floor(ms / 1e3) % 60, "שניות"],
  ];
  return (
    <StepShell type="countdown">
      <Medal name={s.icon} />
      <Title text={s.title} />
      <Sub text={s.sub} />
      <div className="countdown" role="timer" aria-live="off">
        {units.map(([u, v, label]) => (
          <div key={u}>
            <b data-u={u}>{v}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {s.note && <p className="reply">{fill(s.note)}</p>}
      <NextButton label={s.cta} />
    </StepShell>
  );
}

/* ---------- a coupon book: tap to redeem ---------- */
export function CouponsView({ s }: { s: CouponsStep }) {
  const { fill, announce, burst } = useSurprise();
  const items = s.items.map((c) => (typeof c === "string" ? { title: c } : c));
  const [used, setUsed] = useState<boolean[]>(() => items.map(() => false));
  return (
    <StepShell type="coupons">
      <Medal name={s.icon || "ticket"} />
      <Title text={s.title} />
      <Sub text={s.sub || "הקישו על שובר כדי לממש אותו"} />
      <ul className="coupons" role="list">
        {items.map((c, i) => (
          <li key={i}>
            <button
              type="button"
              className={"coupon" + (used[i] ? " is-used" : "")}
              aria-pressed={used[i]}
              onClick={() => {
                const on = !used[i];
                setUsed((u) => u.map((x, j) => (j === i ? on : x)));
                if (on) {
                  announce("השובר מומש: " + c.title);
                  burst(30);
                }
              }}
            >
              <span className="coupon__ico" aria-hidden="true"><Icon name={("icon" in c && c.icon) || "gift"} /></span>
              <span className="coupon__t">
                <b>{fill(c.title)}</b>
                <small>{"note" in c && c.note ? fill(c.note) : "בתוקף לתמיד"}</small>
              </span>
              <span className="coupon__stamp" aria-hidden="true">מומש!</span>
            </button>
          </li>
        ))}
      </ul>
      <NextButton label={s.cta} />
    </StepShell>
  );
}
