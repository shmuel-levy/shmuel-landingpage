/* =========================================================
   "This is how it will look, in order": the surprise's steps as a list
   that can be re-ordered by dragging (mouse anywhere on a row, touch on the grip)
   or with the arrow buttons. The envelope always opens and the ending always closes.
   Neighbours slide into place with a FLIP animation.
   ========================================================= */
import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Icon } from "@/components/Icon";
import { motionOff, vibrate } from "@/lib/motion";
import type { Step } from "@/features/surprise/types";
import { stepLabel, type KeyedStep } from "../logic/parts";

interface Props {
  steps: KeyedStep[];
  custom: boolean;
  onOrder: (keys: string[] | undefined) => void;
}

interface Drag { key: string; id: number; y0: number; start: number; dy: number }

export function PartsOrder({ steps, custom, onOrder }: Props) {
  const list = useRef<HTMLOListElement>(null);
  const items = useRef(new Map<string, HTMLLIElement>());
  const prevTops = useRef<Map<string, number> | null>(null);
  /** offsetTop of the dragged row before a swap; corrected right after React re-orders the rows */
  const pendingShift = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dy, setDy] = useState(0);
  const [moved, setMoved] = useState<{ key: string; n: number } | null>(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  // while dragging, the order lives here; on drop it is committed to the store
  const [local, setLocal] = useState<string[] | null>(null);

  const head = steps[0], tail = steps[steps.length - 1];
  const middle = steps.slice(1, -1);
  const byKey = new Map(middle.map((s) => [s._k!, s]));
  const order = local || middle.map((s) => s._k!);
  const ordered = [head, ...order.map((k) => byKey.get(k)!).filter(Boolean), tail];
  const total = ordered.length;

  useLayoutEffect(() => {
    setReady(true);
  }, []);

  /** remember where every row is, so the next render can animate from there */
  const snapshot = () => {
    const m = new Map<string, number>();
    items.current.forEach((el, k) => m.set(k, el.getBoundingClientRect().top));
    prevTops.current = m;
  };
  // FLIP: rows that moved slide from their old place
  useLayoutEffect(() => {
    const D = drag.current;
    if (D && pendingShift.current != null) {
      // the dragged row has a new home: move the drag origin by the same amount so it doesn't jump
      const me = items.current.get(D.key);
      if (me) D.y0 += me.offsetTop - pendingShift.current;
      pendingShift.current = null;
    }
    const prev = prevTops.current;
    if (!prev || motionOff()) return;
    prevTops.current = null;
    items.current.forEach((el, k) => {
      if (k === drag.current?.key) return;
      const before = prev.get(k);
      if (before == null) return;
      const d = before - el.getBoundingClientRect().top;
      if (!d) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${d}px)`;
      void el.offsetWidth;
      el.style.transition = "";
      el.style.transform = "";
    });
  });

  const announce = (key: string, keys: string[]) => {
    const name = stepLabel(byKey.get(key) as Step)[1];
    setStatus("");
    setTimeout(() => setStatus(`${name} עבר למקום ${keys.indexOf(key) + 2}`), 50);
    setMoved((m) => ({ key, n: (m?.n || 0) + 1 }));
  };

  const moveBy = (key: string, dir: number) => {
    const keys = [...order], i = keys.indexOf(key), j = i + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    snapshot();
    onOrder(keys);
    announce(key, keys);
  };

  /* ---------- pointer dragging ---------- */
  const down = (e: PointerEvent<HTMLLIElement>, key: string) => {
    const t = e.target as HTMLElement;
    if (t.closest(".path__mv") || e.button > 0) return;
    if (e.pointerType !== "mouse" && !t.closest(".path__grip")) return; // phones: touching the row still scrolls the page
    e.preventDefault();
    drag.current = { key, id: e.pointerId, y0: e.clientY + window.scrollY, start: order.indexOf(key), dy: 0 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* */
    }
    setLocal([...order]);
    setDragKey(key);
    setDy(0);
    vibrate(8);
  };
  const move = (e: PointerEvent<HTMLLIElement>) => {
    const D = drag.current;
    if (!D || e.pointerId !== D.id || !local) return;
    const cy = e.clientY;
    // scroll the page near the screen edges
    if (cy < 70) window.scrollBy(0, -10);
    else if (cy > window.innerHeight - 70) window.scrollBy(0, 10);
    const i = local.indexOf(D.key);
    let swapWith = -1;
    const after = items.current.get(local[i + 1]), before = items.current.get(local[i - 1]);
    if (after) {
      const r = after.getBoundingClientRect();
      if (cy > r.top + r.height / 2) swapWith = i + 1;
    }
    if (swapWith < 0 && before) {
      const r = before.getBoundingClientRect();
      if (cy < r.top + r.height / 2) swapWith = i - 1;
    }
    if (swapWith >= 0) {
      const keys = [...local];
      [keys[i], keys[swapWith]] = [keys[swapWith], keys[i]];
      snapshot();
      pendingShift.current = items.current.get(D.key)!.offsetTop;
      setLocal(keys);
    }
    D.dy = cy + window.scrollY - D.y0;
    setDy(D.dy);
  };
  const up = (e: PointerEvent<HTMLLIElement>) => {
    const D = drag.current;
    if (!D || e.pointerId !== D.id) return;
    drag.current = null;
    setDragKey(null);
    setDy(0);
    const keys = local || order;
    setLocal(null);
    if (keys.indexOf(D.key) !== D.start) {
      onOrder(keys);
      announce(D.key, keys);
    }
  };

  return (
    <div className="path">
      <p className="path__label"><Icon name="eye" />ככה זה ייראה, לפי הסדר:</p>
      <p className="path__hint" id="pathHint"><Icon name="grip" />גררו חלק כדי להחליף מקום, או השתמשו בחצים. המעטפה תמיד פותחת והמכתב תמיד סוגר.</p>
      <ol className={"path__list" + (ready ? " is-ready" : "") + (dragKey ? " is-dragging" : "")} id="partsPath" aria-describedby="pathHint" ref={list}>
        {ordered.map((s, i) => {
          const [icon, name] = stepLabel(s);
          const fixed = i === 0 || i === total - 1;
          const headEls = (
            <>
              <span className="path__n" aria-hidden="true">{i + 1}</span>
              <span className="path__ico" aria-hidden="true"><Icon name={icon} /></span>
              <span className="path__name">{name}</span>
            </>
          );
          if (fixed)
            return (
              <li key={i === 0 ? "__head" : "__tail"} className="path__item is-fixed" style={{ "--i": i } as CSSProperties}>
                <span className="path__grip" aria-hidden="true" />
                {headEls}
                <span className="path__pin"><Icon name="lock" />{i === 0 ? "תמיד ראשונה" : "תמיד בסוף"}</span>
              </li>
            );
          const k = s._k!, mi = i - 1, isDrag = dragKey === k;
          return (
            <li
              key={k}
              ref={(el) => {
                if (el) items.current.set(k, el);
                else items.current.delete(k);
              }}
              className={"path__item" + (isDrag ? " is-drag" : "") + (moved?.key === k ? " is-moved" : "")}
              data-k={k}
              data-name={name}
              style={{ "--i": i, ...(isDrag ? { transition: "none", transform: `translateY(${dy}px)` } : {}) } as CSSProperties}
              onPointerDown={(e) => down(e, k)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              onAnimationEnd={() => setMoved(null)}
            >
              <span className="path__grip" aria-hidden="true"><Icon name="grip" /></span>
              {headEls}
              <span className="path__mv">
                <button type="button" data-mv="-1" disabled={mi === 0} aria-label={`להקדים את ${name} (עכשיו במקום ${i + 1} מתוך ${total})`} onClick={(e) => {
                  moveBy(k, -1);
                  const li = e.currentTarget.closest("li");
                  requestAnimationFrame(() => (li?.querySelector<HTMLButtonElement>('[data-mv="-1"]:not(:disabled)') || li?.querySelector<HTMLButtonElement>("[data-mv]:not(:disabled)"))?.focus());
                }}>
                  <Icon name="chev-up" />
                </button>
                <button type="button" data-mv="1" disabled={mi === order.length - 1} aria-label={`לדחות את ${name} (עכשיו במקום ${i + 1} מתוך ${total})`} onClick={(e) => {
                  moveBy(k, 1);
                  const li = e.currentTarget.closest("li");
                  requestAnimationFrame(() => (li?.querySelector<HTMLButtonElement>('[data-mv="1"]:not(:disabled)') || li?.querySelector<HTMLButtonElement>("[data-mv]:not(:disabled)"))?.focus());
                }}>
                  <Icon name="chev-down" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="link-btn path__reset"
        id="pathReset"
        hidden={!custom}
        onClick={() => {
          snapshot();
          onOrder(undefined);
          setStatus("חזרנו לסדר המומלץ");
          requestAnimationFrame(() => list.current?.querySelector<HTMLButtonElement>("[data-mv]:not(:disabled)")?.focus());
        }}
      >
        <Icon name="replay" />
        חזרה לסדר המומלץ
      </button>
      <p className="sr-only" id="pathStatus" aria-live="polite">{status}</p>
    </div>
  );
}
