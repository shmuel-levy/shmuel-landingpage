/* =========================================================
   The promo as a small, gentle popup (instead of a banner).
   How often: src/data/site.ts → promo.popupEvery
     "load" = every visit and refresh · "session" = once per visit · "week" = once a week
   Shows after 7 seconds, or when scrolling to the examples. Someone playing with the
   demo phone won't get a popup in the middle: it waits for the scroll.
   A small envelope opens and reveals the discount. Esc, a click outside or "maybe later" close it.
   Non-modal: the page stays usable and focus is not stolen.
   ========================================================= */
import { useEffect, useRef, useState } from "react";
import { Envelope, type EnvelopeHandle } from "@/components/Envelope";
import { Icon } from "@/components/Icon";
import { motionOff } from "@/lib/motion";
import { timeLeftText } from "@/lib/pricing";
import { track } from "@/lib/track";
import type { Promo } from "@/types/content";

const KEY = "matanot-promo-pop";

export function PromoPopup({ promo, onAnnounce }: { promo: Promo; onAnnounce: (text: string) => void }) {
  const pop = useRef<HTMLDialogElement>(null);
  const env = useRef<EnvelopeHandle>(null);
  const [closing, setClosing] = useState(false);
  const [left] = useState(() => timeLeftText(promo));

  useEffect(() => {
    const d = pop.current;
    if (!d || typeof d.show !== "function") return;
    const every = promo.popupEvery || "load";
    const storage = () => (every === "session" ? sessionStorage : localStorage);
    let seen = 0;
    try {
      seen = every === "load" ? 0 : +(storage().getItem(KEY) || 0);
    } catch {
      /* */
    }
    // ?promo=1 forces it after 1.5s (for testing)
    const force = /[?&]promo=1/.test(location.search);
    if (!force && (seen || /[?&](src|utm_source)=promo/.test(location.search))) {
      if (every !== "week" || Date.now() - seen < 7 * 864e5) return;
    }

    let shown = false;
    const timers: number[] = [];
    const show = () => {
      if (shown || document.querySelector("dialog[open]")) return;
      shown = true;
      try {
        storage().setItem(KEY, String(Date.now()));
      } catch {
        /* */
      }
      d.show();
      timers.push(window.setTimeout(() => env.current?.open(), motionOff() ? 0 : 450));
      onAnnounce(`${promo.percent}% הנחה על כל ההפתעות, עד ${promo.endsLabel}. אפשר לסגור עם Escape.`);
      track("promo_popup", {});
    };
    const close = () => {
      if (!d.open) return;
      setClosing(true);
      timers.push(
        window.setTimeout(() => {
          setClosing(false);
          d.close();
        }, motionOff() ? 0 : 220),
      );
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && d.open && close();
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (d.open && !d.contains(t)) close();
      if (t.closest?.("[data-pop-close]")) close();
    };
    // someone on the way to the order form doesn't need a popup
    const onOrderClick = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('a[href*="order.html"]')) {
        clearTimeout(timer);
        shown = true;
      }
    };
    window.addEventListener("keydown", onKey, true);
    d.addEventListener("cancel", onCancel);
    document.addEventListener("click", onDocClick);
    document.addEventListener("click", onOrderClick, true);

    let timer = window.setTimeout(show, force ? 1500 : 7000);
    // touched the demo phone? don't interrupt; wait for the scroll to the examples
    const demo = document.getElementById("demo");
    const onDemo = () => clearTimeout(timer);
    if (demo && !force) demo.addEventListener("pointerdown", onDemo, { once: true });
    let io: IntersectionObserver | null = null;
    const ex = document.getElementById("examples");
    if (ex && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (en) => {
          if (en[0].isIntersecting) {
            io?.disconnect();
            clearTimeout(timer);
            timer = window.setTimeout(show, 600);
          }
        },
        { threshold: 0.2 },
      );
      io.observe(ex);
    }
    return () => {
      clearTimeout(timer);
      timers.forEach(clearTimeout);
      io?.disconnect();
      window.removeEventListener("keydown", onKey, true);
      d.removeEventListener("cancel", onCancel);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("click", onOrderClick, true);
      demo?.removeEventListener("pointerdown", onDemo);
    };
  }, [promo, onAnnounce]);

  return (
    <dialog className={"ppop" + (closing ? " is-closing" : "")} id="promoPop" aria-labelledby="ppopTitle" aria-describedby="ppopText" ref={pop}>
      {/* a real autofocus attribute (not React's autoFocus, which would steal focus on page load):
          when the dialog opens, focus lands on the card, not on a button */}
      <div className="ppop__card" tabIndex={-1} ref={(el) => el?.setAttribute("autofocus", "")}>
        <button type="button" className="ppop__x" data-pop-close="" aria-label="סגירה">
          <span data-icon="x"><Icon name="x" /></span>
        </button>
        <div className="ppop__env" id="ppopEnv" aria-hidden="true">
          <Envelope ref={env} decorative mark="%" liner="confetti" cardIcon="gift" cardTitle={`${promo.percent}% הנחה`} cardText="על כל החבילות" postmark={false} palette="blush" />
        </div>
        <h2 className="ppop__title" id="ppopTitle">{promo.percent}% הנחה על כל ההפתעות</h2>
        <p className="ppop__text" id="ppopText">{promo.title} עד {promo.endsLabel} · {left}. ההנחה כבר מחושבת בטופס.</p>
        <a className="btn btn--primary btn--lg ppop__cta" href="order.html?src=promo-pop">
          <span data-icon="wand"><Icon name="wand" /></span>
          לבנות סקיצה עם ההנחה
        </a>
        <button type="button" className="link-btn ppop__later" data-pop-close="">אולי אחר כך</button>
      </div>
    </dialog>
  );
}
