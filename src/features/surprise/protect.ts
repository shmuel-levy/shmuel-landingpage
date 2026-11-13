/* =========================================================
   Sketch protection
   A watermark over the whole screen, no text selection or image saving,
   and on desktop the content is hidden during a screenshot / print / window switch.
   Phones can't block screenshots from a web page, so there the watermark
   and the locked second half are the real protection.
   ========================================================= */
import { useEffect } from "react";

export function useSketchProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const body = document.body;
    body.classList.add("is-sketch");
    let vt = 0;
    const veil = (ms?: number) => {
      body.classList.add("is-veiled");
      clearTimeout(vt);
      if (ms) vt = window.setTimeout(() => body.classList.remove("is-veiled"), ms);
    };
    const unveil = () => {
      clearTimeout(vt);
      body.classList.remove("is-veiled");
    };
    window.mtVeil = veil;

    const shot = (e: KeyboardEvent) => {
      const k = e.key || "";
      if (k === "PrintScreen" || ((e.metaKey || e.ctrlKey) && e.shiftKey && /^[345sS]$/.test(k))) {
        veil(3000);
        try {
          void navigator.clipboard?.writeText("");
        } catch {
          /* */
        }
      }
      if ((e.ctrlKey || e.metaKey) && /^[psPS]$/.test(k)) {
        e.preventDefault();
        veil(2000);
      }
    };
    const block = (e: Event) => e.preventDefault();
    const vis = () => (document.hidden ? veil() : setTimeout(unveil, 350));
    const blur = () => veil();
    const focus = () => setTimeout(unveil, 250);
    const standalone = window.top === window; // full screen, not inside the order form

    document.addEventListener("keydown", shot);
    document.addEventListener("keyup", shot);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("visibilitychange", vis);
    if (standalone) {
      window.addEventListener("blur", blur);
      window.addEventListener("focus", focus);
    }
    window.addEventListener("beforeprint", blur);
    window.addEventListener("afterprint", unveil);
    return () => {
      body.classList.remove("is-sketch", "is-veiled");
      document.removeEventListener("keydown", shot);
      document.removeEventListener("keyup", shot);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      window.removeEventListener("beforeprint", blur);
      window.removeEventListener("afterprint", unveil);
      delete window.mtVeil;
    };
  }, [enabled]);
}
