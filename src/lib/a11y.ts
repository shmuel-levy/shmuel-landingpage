/* Accessibility preferences → classes on <html> (the stylesheet does the rest). */
export type A11yPrefs = Record<string, number | boolean>;

export const A11Y_TOGGLES = ["contrast", "links", "readable", "no-motion", "spacing", "grayscale", "cursor", "focus", "headings"] as const;

export function applyA11y(prefs: A11yPrefs) {
  const root = document.documentElement;
  for (const k of A11Y_TOGGLES) root.classList.toggle("a11y-" + k, !!prefs[k]);
  const lv = +(prefs["text-lg"] || 0);
  root.classList.toggle("a11y-text-lg", lv === 1);
  root.classList.toggle("a11y-text-xl", lv === 2);
}
