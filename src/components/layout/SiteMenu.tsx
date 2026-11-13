/* =========================================================
   Hamburger menu on every page and screen size.
   A side drawer built on <dialog>: focus stays inside, Esc closes,
   focus returns to the button.
   ========================================================= */
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Icon } from "../Icon";
import { SITE } from "@/data/site";
import { prefersReducedMotion } from "@/lib/motion";

const LINKS: [hash: string, icon: string, label: string][] = [
  ["#top", "home", "עמוד הבית"],
  ["#how", "sparkle", "איך זה עובד"],
  ["#examples", "images", "דוגמאות"],
  ["#him", "pencil", "מכתב לבת הזוג"],
  ["#pricing", "tag", "מחירים ומבצע"],
  ["#about", "smile", "מי אני"],
  ["#faq", "question", "שאלות נפוצות"],
];

export function SiteMenu({ onHome }: { onHome: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const base = onHome ? "" : "index.html";

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setOpen(false);
      document.documentElement.style.overflow = "";
      button.current?.focus({ preventScroll: true });
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const show = () => {
    const d = dialog.current!;
    if (d.showModal) d.showModal();
    else d.setAttribute("open", "");
    setOpen(true);
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => dialog.current?.open && dialog.current.close();

  // a click on the backdrop closes
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    const d = dialog.current!, r = d.getBoundingClientRect();
    if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) close();
  };
  // in-page link: close first, then scroll and move focus to the section heading
  const goTo = (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (!onHome) return;
    e.preventDefault();
    const target = document.querySelector(hash);
    close();
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", hash);
    const h = target.querySelector<HTMLElement>("h1, h2");
    if (h) {
      h.setAttribute("tabindex", "-1");
      setTimeout(() => h.focus({ preventScroll: true }), 450);
    }
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className="burger"
        aria-expanded={open}
        aria-controls="siteMenu"
        aria-label="תפריט"
        onClick={() => (open ? close() : show())}
      >
        <span className="burger__lines" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <dialog className="drawer" id="siteMenu" aria-labelledby="siteMenuTitle" ref={dialog} onClick={onDialogClick}>
        <div className="drawer__inner">
          <div className="drawer__head">
            <span className="brand">
              <img className="brand__mark" src="images/favicon.png" alt="" width="40" height="40" />
              <span className="brand__text"><b lang="en" id="siteMenuTitle">Matanot</b><small>הפתעות בקישור</small></span>
            </span>
            <button type="button" className="drawer__close" aria-label="סגירת התפריט" onClick={close}>
              <Icon name="x" />
            </button>
          </div>
          <nav className="drawer__nav" aria-label="תפריט ראשי">
            <ul>
              {LINKS.map(([hash, icon, label], i) => (
                <li key={hash}>
                  <a href={base + hash} style={{ "--i": i } as CSSProperties} onClick={(e) => goTo(e, hash)}>
                    <span className={`tile tile--${(i % 6) + 1}`} aria-hidden="true"><Icon name={icon} /></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="btn btn--primary btn--lg btn--block drawer__cta" href="order.html">
            <Icon name="wand" />
            לבנות סקיצה עכשיו
          </a>
          <div className="drawer__contact">
            <a className="drawer__wa" href={`https://wa.me/${SITE.contact.phoneIntl}`} target="_blank" rel="noopener">
              <Icon name="whatsapp" />
              ווטסאפ<span className="sr-only"> (נפתח בחלון חדש)</span>
            </a>
            <a href={`tel:+${SITE.contact.phoneIntl}`}>
              <Icon name="call" />
              <span dir="ltr">{SITE.contact.phoneDisplay}</span>
            </a>
          </div>
          <div className="drawer__legal">
            <a href="negishut.html">הצהרת נגישות</a>
            <a href="privacy.html">מדיניות פרטיות</a>
            <a href="terms.html">תנאי שירות</a>
          </div>
        </div>
      </dialog>
    </>
  );
}
