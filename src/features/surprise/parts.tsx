/* Building blocks shared by all step types. */
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { useSurprise } from "./context";
import type { PhotoRef, Step } from "./types";

/** The <section class="step step--{type}"> wrapper: entry/leave animation, focus and scroll on mount. */
export function StepShell({ type, className, children }: { type: string; className?: string; children: ReactNode }) {
  const { leaving, focusOnMount } = useSurprise();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (focusOnMount) ref.current?.querySelector<HTMLElement>(".step__title")?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section ref={ref} className={`step step--${type}${className ? " " + className : ""}${leaving ? " is-leaving" : ""}`}>
      {children}
    </section>
  );
}

export function Title({ text }: { text?: string }) {
  const { fill } = useSurprise();
  return (
    <h1 className="step__title" tabIndex={-1}>
      {fill(text)}
    </h1>
  );
}

export function Sub({ text }: { text?: string }) {
  const { fill } = useSurprise();
  return text ? <p className="step__sub">{fill(text)}</p> : null;
}

/** Round medal with an icon above the title. `cls` defaults to the bobbing animation. */
export function Medal({ name, cls }: { name?: string; cls?: string }) {
  if (!name) return null;
  return (
    <div className={`medal ${cls ?? "bob"}`.trim()} aria-hidden="true">
      <span className="medal__ring" />
      <Icon name={name} />
    </div>
  );
}

export function Photo({ p, cls }: { p?: PhotoRef; cls?: string }) {
  const { fill } = useSurprise();
  if (!p?.src) return null;
  return (
    <figure className={`photo ${cls || ""}`}>
      <img src={p.src} alt={p.alt || ""} width={p.w || 720} height={p.h || 540} decoding="async" />
      {p.caption && <figcaption>{fill(p.caption)}</figcaption>}
    </figure>
  );
}

interface NextProps {
  label?: string;
  disabled?: boolean;
  /** move keyboard focus to the button when it appears */
  focus?: boolean;
  /** when set, a finishing character hits the button after `lead` ms and moves on */
  celebrate?: { lead: number; step: Step } | null;
}

/** The "continue" button. Clicking it before the character finishes moves on right away. */
export function NextButton({ label, disabled, focus, celebrate }: NextProps) {
  const api = useSurprise();
  const ref = useRef<HTMLButtonElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 80);
    return () => clearTimeout(t);
  }, [focus]);

  useEffect(() => {
    if (!celebrate || fired.current) return;
    fired.current = true;
    api.celebrate(ref.current, celebrate.lead, celebrate.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate]);

  return (
    <div className="next">
      <button
        ref={ref}
        type="button"
        className={"btn btn--primary" + (disabled ? "" : " is-ready")}
        disabled={disabled}
        onClick={() => {
          api.stopFx();
          api.next();
        }}
      >
        {label || "ממשיכים"}
        <Icon name="arrow-left" />
      </button>
    </div>
  );
}

/** Live "x of y" counter used by several games. */
export function Count({ children }: { children: ReactNode }) {
  return (
    <p className="album__count" aria-live="polite">
      {children}
    </p>
  );
}
