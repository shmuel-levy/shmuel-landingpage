/* Date helpers for the custom date picker. Values are stored as local "YYYY-MM-DD". */

export const DP_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const DP_DAYS_LONG = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const DP_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const pad = (n: number) => ("0" + n).slice(-2);
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function fromIso(s: unknown): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
export function today0(now = new Date()): Date {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return t;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** the latest date a field accepts (a due date may be ~10 months ahead) */
export const dpMax = (fieldId: string, now = new Date()) => addDays(today0(now), fieldId === "dueDate" ? 300 : 365);

/** "היום", "מחר", "בעוד 5 ימים", "בעוד 3 שבועות", "בעוד 4 חודשים" */
export function dpRel(d: Date, now = new Date()): string {
  const n = Math.round((d.getTime() - today0(now).getTime()) / 864e5);
  if (n === 0) return "היום";
  if (n === 1) return "מחר";
  if (n === 2) return "מחרתיים";
  if (n < 14) return `בעוד ${n} ימים`;
  if (n < 60) return `בעוד ${Math.round(n / 7)} שבועות`;
  return `בעוד ${Math.round(n / 30)} חודשים`;
}
/** "יום חמישי, 14 בנובמבר" */
export const dpLabel = (d: Date) => `יום ${DP_DAYS_LONG[d.getDay()]}, ${d.getDate()} ב${DP_MONTHS[d.getMonth()]}`;

/** quick-pick chips under the date button */
export const dpQuick = (fieldId: string): [number, string][] =>
  fieldId === "deadline" ? [[1, "מחר"], [3, "בעוד 3 ימים"], [7, "בעוד שבוע"], [14, "בעוד שבועיים"]] : [];

/** "2026-11-30" → "30.11.2026" */
export const dotted = (iso: string) => iso.split("-").reverse().join(".");
