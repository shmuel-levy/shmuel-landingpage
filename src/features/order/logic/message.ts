/* Totals and the WhatsApp message the customer sends at the end. Pure functions → unit-tested. */
import { ORDER } from "@/data/order";
import { SITE } from "@/data/site";
import { getPalette, LINERS } from "@/lib/envelope/palettes";
import { planPrice } from "@/lib/pricing";
import type { Promo } from "@/types/content";
import { EXTRAS, VOICE_AT, typeDef } from "../config";
import { dotted } from "./dates";
import { buildDemo } from "./demo";
import { stepLabel } from "./parts";
import type { OrderData, PhotoItem, VoiceMeta } from "../types";

export function totals(d: OrderData, promo: Promo | null) {
  const P = SITE.pricing;
  const plan = P.plans.find((p) => p.id === d.plan) || P.plans[0];
  const adds = P.addons.filter((a) => ((d.addons as string[]) || []).includes(a.id));
  const addSum = adds.reduce((s, a) => s + a.price, 0);
  return { plan, adds, sum: planPrice(plan, promo) + addSum, full: plan.price + addSum };
}

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.round(sec || 0));
  return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
};

interface MessageInput {
  type: string;
  data: OrderData;
  photos: PhotoItem[];
  voice: VoiceMeta | null;
  promo: Promo | null;
  /** "how did you hear about me" from the stored traffic source */
  sourceLabel?: string;
}

const filled = (a: unknown) => ((a as unknown[]) || []).filter((x) => x && String(x).trim()) as string[];

export function orderMessage({ type, data: d, photos, voice, promo, sourceLabel }: MessageInput): string {
  const T = typeDef(type)!, t = totals(d, promo);
  const out = ["היי שמואל! מילאתי את טופס ההזמנה באתר וראיתי סקיצה. הנה הפרטים:", ""];
  const add = (label: string, v: unknown) => {
    if (v != null && String(v).trim() !== "") out.push(`*${label}:* ${String(v).trim()}`);
  };
  add("סוג ההפתעה", T.label);
  add("למי", d.recipient);
  add("פנייה", d.address);
  add("חתימה", d.from);
  out.push("", "*הסיפור*");
  for (const f of T.fields) {
    const v = d[f.id];
    if (f.type === "list" || f.type === "multi") {
      const list = filled(v);
      if (list.length) out.push(`• ${f.label}: ${list.join(" / ")}`);
    } else if (f.type === "quiz") {
      ((v as { q?: string; a?: string; w1?: string; w2?: string }[]) || []).filter((q) => q && q.q).forEach((q, i) => {
        out.push(`• שאלה ${i + 1}: ${q.q} | נכונה: ${q.a || "-"} | שגויות: ${filled([q.w1, q.w2]).join(", ")}`);
      });
    } else if (f.type === "notes") {
      const pp = f.parts || ["text", "from"];
      ((v as Record<string, string>[]) || []).filter((n) => n && n[pp[0]]).forEach((n) => {
        out.push(`• ${f.label.replace(/"/g, "")}: ${n[pp[0]]}${n[pp[1]] ? " | " + n[pp[1]] : ""}`);
      });
    } else if (v && String(v).trim()) out.push(`• ${f.label}: ${String(v).trim().replace(/\n+/g, " / ")}`);
  }
  if (filled(d.tone).length) out.push("• טון: " + (d.tone as string[]).join(", "));
  out.push("", "*עיצוב*");
  out.push(`• פלטה: ${getPalette(d.palette).label} · בטנה: ${LINERS[d.liner as keyof typeof LINERS]} · חותם: ${d.mark || "לב"}`);
  out.push(`• מוזיקה: ${ORDER.moods.find((m) => m.id === d.mood)?.label}${d.song ? " · שיר: " + d.song : ""}`);
  out.push(
    "• חלקים: " +
      ORDER.elements
        .filter((e) => ((d.elements as string[]) || []).includes(e.id) || e.id === "envelope" || e.id === "final")
        .map((e) => e.label.replace(/"/g, ""))
        .join(", "),
  );
  const steps = buildDemo({ type, data: d, photos: photos.map((p) => p.url), voice }).steps;
  out.push(`• הסדר${(d.order as string[] | undefined)?.length ? " (סידרתי בעצמי)" : ""}: ${steps.map((s) => stepLabel(s)[1]).join(" ← ")}`);
  if (photos.length) out.push(`• תמונות: ${photos.length} (שולח/ת כאן בצ'אט)`);
  if (voice) out.push(`• הודעה קולית: ${fmtTime(voice.dur)}, ${d.voiceAt || VOICE_AT[0]} (שולח/ת את הקובץ כאן בצ'אט)${d.voiceCaption ? " · כתובית: " + d.voiceCaption : ""}`);
  out.push("");
  add("חבילה", `${t.plan.name}, ${planPrice(t.plan, promo)} ₪${promo ? ` (במקום ${t.plan.price} ₪, ${promo.title})` : ""}`);
  if (t.adds.length) add("תוספות", t.adds.map((a) => `${a.name} +${a.price} ₪`).join(", "));
  add('סה"כ משוער', t.sum + " ₪");
  add("צריך עד", d.deadline ? dotted(d.deadline) : "");
  add("שם", d.name);
  add("טלפון", d.phone);
  const ex = (d.extras as string[]) || [];
  if (ex.includes(EXTRAS[0])) add("כפתור תגובה", "כן, לטלפון שלי");
  if (ex.includes(EXTRAS[1])) add("תזכורת לשנה הבאה", "כן" + (d.deadline ? ", לפני " + d.deadline.split("-").reverse().slice(0, 2).join(".") : ""));
  add("הערות", d.notes);
  add("הגעתי דרך", filled([d.source, sourceLabel || ""]).join(" · "));
  return out.join("\n");
}
