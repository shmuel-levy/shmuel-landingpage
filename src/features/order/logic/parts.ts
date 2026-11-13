/* =========================================================
   The interactive parts of a surprise: what is recommended per type,
   a cap per plan so the surprise stays focused, and their order.
   ========================================================= */
import { ORDER } from "@/data/order";
import { SITE } from "@/data/site";
import type { Step } from "@/features/surprise/types";
import { typeDef } from "../config";
import type { FieldDef } from "@/types/content";
import type { OrderData } from "../types";

export function partsDef(type: string) {
  const T = typeDef(type)!;
  return ORDER.parts[type] || { rec: T.elements.filter((x) => x !== "envelope" && x !== "final"), more: [] };
}
export const allowedParts = (type: string) => {
  const P = partsDef(type);
  return [...P.rec, ...P.more];
};
export function planParts(id = "premium"): number {
  return SITE.pricing.plans.find((p) => p.id === id)?.parts || 5;
}
export const maxParts = () => Math.max(...SITE.pricing.plans.map((p) => p.parts || 5));

export function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v))
    return v.some((x) => x && (typeof x === "object" ? Object.values(x).some((y) => String(y || "").trim()) : String(x).trim()));
  return String(v).trim() !== "";
}

/** Default selection: the recommended parts, plus one more if the customer already wrote content for it. */
export function defaultParts(type: string, d: OrderData): string[] {
  const al = allowedParts(type), list = [...partsDef(type).rec];
  const BY_DATA: Record<string, string> = { reasons: "reasons", openWhen: "openwhen", coupons: "coupons", wheel: "wheel", quiz: "quiz", notes: "notes", promises: "notes", gift: "scratch" };
  for (const [k, p] of Object.entries(BY_DATA)) if (isFilled(d[k]) && al.includes(p) && !list.includes(p) && list.length < maxParts()) list.push(p);
  return list;
}

/** The chosen parts in the recommended order, cut to the plan's limit (unless `all`). */
export function chosenParts(type: string, d: OrderData, all = false): string[] {
  const al = allowedParts(type);
  const c = ((d.elements as string[] | undefined) || defaultParts(type, d)).filter((x) => al.includes(x));
  c.sort((a, b) => al.indexOf(a) - al.indexOf(b));
  return all ? c : c.slice(0, planParts((d.plan as string) || "premium"));
}

const STEP_LABEL: Record<string, [string, string]> = { envelope: ["envelope", "המעטפה"], message: ["letter", "הודעה אישית"], voice: ["mic", "הודעה קולית"], choice: ["question", "שאלה"] };
/** [icon, label] of a sketch step, for lists ("this is how it will look, in order"). */
export function stepLabel(s: Step): [string, string] {
  if (s.type === "final") return s.variant === "ticket" ? ["ticket", "כרטיס טיסה"] : s.variant === "invite" ? ["glass", "הזמנה רשמית"] : ["letter", "המכתב בסוף"];
  if (STEP_LABEL[s.type]) return STEP_LABEL[s.type];
  const e = ORDER.elements.find((x) => x.id === s.type);
  return e ? [e.icon, e.label.replace(/"/g, "")] : ["sparkle", s.type];
}

export type KeyedStep = Step & { _k?: string };

/**
 * Gives every step a stable key (photos, reasons, message2 if there are two…) and applies the
 * customer's drag-and-drop order. The envelope stays first and the ending stays last; parts the
 * customer sorted take their slots in that order, a newly added part keeps its recommended slot.
 */
export function applyCustomOrder(steps: KeyedStep[], order: string[] | undefined): KeyedStep[] {
  const seen: Record<string, number> = {};
  for (const s of steps) {
    const n = (seen[s.type] = (seen[s.type] || 0) + 1);
    s._k = n > 1 ? s.type + n : s.type;
  }
  if (!order?.length || steps.length < 4) return steps;
  let mid = steps.slice(1, -1);
  const pos = (s: KeyedStep) => order.indexOf(s._k!);
  const known = mid.filter((s) => pos(s) > -1).sort((a, b) => pos(a) - pos(b));
  let j = 0;
  mid = mid.map((s) => (pos(s) > -1 ? known[j++] : s));
  mid.forEach((s, i) => {
    // "to the details" only makes sense right before the ending
    if (s.type === "runaway" && s.cta === "לפרטים" && i < mid.length - 1) s.cta = "ממשיכים";
  });
  return [steps[0], ...mid, steps[steps.length - 1]];
}

/** "filled/total" status + done flag for a group of questions. */
export function groupStatus(fields: FieldDef[], data: OrderData) {
  const n = fields.filter((f) => isFilled(data[f.id])).length;
  const reqOk = fields.every((f) => !f.required || isFilled(data[f.id]));
  return { status: n ? `${n}/${fields.length}` : "", done: n > 0 && reqOk };
}
