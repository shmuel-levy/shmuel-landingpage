/** Replaces {key} placeholders with the visitor's answers, falling back to the demo's defaults.
 *  e.g. "the date: {date}" after the wheel picked "picnic" → "the date: picnic". */
export function fillTemplate(s: string | undefined, answers: Record<string, string>, defaults: Record<string, string> = {}): string {
  return String(s ?? "").replace(/\{(\w+)\}/g, (_, k: string) => answers[k] || defaults[k] || "");
}
