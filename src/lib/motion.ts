/** True when the visitor asked for less motion (OS setting or the site's accessibility menu). */
export function motionOff(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-no-motion")
  );
}

/** Only the OS setting (the surprise engine ignores the site menu, like the original). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Restart a CSS animation class on an element. */
export function replayClass(el: Element | null | undefined, cls: string) {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

/** Has the visitor interacted with the page yet? (Browsers block audio/vibration before that.) */
export function userHasInteracted(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return !ua || ua.hasBeenActive;
}

export function vibrate(ms: number) {
  try {
    if (navigator.vibrate && userHasInteracted()) navigator.vibrate(ms);
  } catch {
    /* not supported */
  }
}
