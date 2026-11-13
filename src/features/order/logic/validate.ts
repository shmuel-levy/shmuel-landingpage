/* Field validation and the "idea" suggestions. */
import type { FieldDef, HelpSuggestion } from "@/types/content";
import { ORDER } from "@/data/order";
import { ADDR, COMMON_BOTTOM, COMMON_TOP, DETAILS, typeDef, type StepId } from "../config";
import { today0 } from "./dates";
import type { OrderData } from "../types";

/** The fields validated on a step. */
export function fieldsOfStep(step: StepId, type: string | null): FieldDef[] {
  if (step === "story") return [...COMMON_TOP, ...(typeDef(type)?.fields || []), ...COMMON_BOTTOM];
  if (step === "details") return DETAILS;
  return [];
}

/** The error message for a field, or "" when it is fine. */
export function problem(f: FieldDef, d: OrderData, now = new Date()): string {
  const v = d[f.id];
  if (f.required && (v == null || String(v).trim() === "")) return f.type === "chips" ? "צריך לבחור אחת מהאפשרויות" : "צריך למלא את השדה הזה";
  if (f.validate === "phone" && v) {
    const digits = String(v).replace(/[^\d+]/g, "").replace(/^\+972/, "0");
    if (!/^0\d{8,9}$/.test(digits)) return "מספר טלפון לא תקין. למשל: 050-1234567";
  }
  if (f.type === "date" && v && new Date(v) < today0(now)) return "התאריך כבר עבר";
  return "";
}

/** Suggestions for the "idea" button: type-specific first, then common. */
export function helpList(fid: string, type: string | null): HelpSuggestion[] | null {
  const H = ORDER.help;
  return (type && H[type]?.[fid]) || H.common?.[fid] || null;
}

export const HELP_TYPES = ["text", "textarea", "list", "notes", "quiz"];
export const hasHelp = (f: FieldDef, type: string | null) => !f.noHelp && HELP_TYPES.includes(f.type) && !!helpList(f.id, type);

/** "[נקבה|זכר|רבים]" → the form matching how the recipient is addressed. */
export function genderText(s: string, address: string | undefined): string {
  const k = address === ADDR[1] ? 1 : address === ADDR[2] ? 2 : 0;
  return String(s).replace(/\[([^\]]*)\]/g, (_, alt: string) => {
    const p = alt.split("|");
    return p[k] != null ? p[k] : p[0];
  });
}
