/* =========================================================
   Accessibility menu: text size (3 levels), contrast, link highlight, readable font,
   stop animations, spacing, grayscale, big cursor, focus highlight, heading highlight.
   Preferences stay in the visitor's browser only. The same classes are applied
   before first paint by a tiny inline script in each HTML page (no flash).
   ========================================================= */
import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { applyA11y, type A11yPrefs as Prefs } from "@/lib/a11y";

const KEY = "matanot-a11y";
const BUTTONS: [key: string, icon: string, label: string][] = [
  ["text-lg", "text-size", "גודל טקסט"],
  ["contrast", "contrast", "ניגודיות גבוהה"],
  ["links", "link", "הדגשת קישורים"],
  ["readable", "type", "גופן קריא"],
  ["no-motion", "pause", "עצירת אנימציות"],
  ["spacing", "line-height", "ריווח שורות"],
  ["grayscale", "grayscale", "גווני אפור"],
  ["cursor", "cursor", "סמן גדול"],
  ["focus", "focus", "הדגשת פוקוס"],
  ["headings", "heading", "הדגשת כותרות"],
];
const NAMES: Record<string, string> = Object.fromEntries(BUTTONS.map(([k, , l]) => [k, l]));
NAMES["text-lg"] = "הגדלת טקסט";

function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function A11yWidget() {
  const [prefs, setPrefs] = useState<Prefs>({});
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => setPrefs(readPrefs()), []);

  const save = (p: Prefs) => {
    setPrefs(p);
    applyA11y(p);
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* private mode */
    }
  };
  const say = (t: string) => {
    setStatus("");
    setTimeout(() => setStatus(t), 50);
  };
  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  };

  useEffect(() => {
    if (open) first.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const click = (e: MouseEvent) => !box.current?.contains(e.target as Node) && close(false);
    document.addEventListener("keydown", key);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("click", click);
    };
  }, [open]);

  const lv = +(prefs["text-lg"] || 0);
  return (
    <div className="a11y" id="a11y" ref={box}>
      <button
        ref={toggle}
        className="a11y__toggle"
        id="a11yToggle"
        type="button"
        aria-expanded={open}
        aria-controls="a11yPanel"
        aria-label="תפריט נגישות"
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <Icon name="accessibility" />
      </button>
      <div className="a11y__panel" id="a11yPanel" role="dialog" aria-modal="false" aria-labelledby="a11yTitle" hidden={!open}>
        <div className="a11y__head">
          <h2 id="a11yTitle">התאמות נגישות</h2>
          <button type="button" className="a11y__close" id="a11yClose" aria-label="סגירת תפריט הנגישות" onClick={() => close(true)}>
            <Icon name="x" />
          </button>
        </div>
        <div className="a11y__grid">
          {BUTTONS.map(([k, icon, label], i) => (
            <button
              key={k}
              ref={i === 0 ? first : undefined}
              type="button"
              data-a11y={k}
              aria-pressed={!!prefs[k]}
              onClick={() => {
                if (k === "text-lg") {
                  const n = (lv + 1) % 3;
                  save({ ...prefs, [k]: n });
                  say(n ? `${NAMES[k]}: רמה ${n + 1} מתוך 3` : "גודל טקסט רגיל");
                } else {
                  const on = !prefs[k];
                  save({ ...prefs, [k]: on });
                  say(NAMES[k] + (on ? " הופעל" : " כובה"));
                }
              }}
            >
              <Icon name={icon} />
              {label}
              {k === "text-lg" && <span className="a11y__lvl">{lv ? ` (${lv + 1}/3)` : ""}</span>}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="a11y__reset"
          id="a11yReset"
          onClick={() => {
            save({});
            say("כל ההגדרות אופסו");
          }}
        >
          <Icon name="replay" />
          איפוס הגדרות
        </button>
        <a className="a11y__statement" href="negishut.html">להצהרת הנגישות</a>
        <p className="sr-only" id="a11yStatus" aria-live="polite">{status}</p>
      </div>
    </div>
  );
}
