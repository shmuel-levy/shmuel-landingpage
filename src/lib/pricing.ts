/* Prices and the launch promo. The promo switches itself off after `endsAt`. */
import type { Plan, Promo } from "@/types/content";
import { SITE } from "@/data/site";

/** The promo if it is active at `now`, otherwise null. */
export function activePromo(promo: Promo | undefined = SITE.promo, now = Date.now()): Promo | null {
  return promo && promo.active && now < new Date(promo.endsAt).getTime() ? promo : null;
}

/** Price after the promo discount (rounded to whole shekels). */
export function planPrice(plan: Pick<Plan, "price">, promo: Promo | null): number {
  return promo ? Math.round(plan.price * (1 - promo.percent / 100)) : plan.price;
}

/** "עוד 5 ימים" / "עוד יום ו-3 שעות" / "עוד 4 שעות" until the promo ends. */
export function timeLeftText(promo: Promo, now = Date.now()): string {
  const ms = Math.max(0, new Date(promo.endsAt).getTime() - now);
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24;
  if (d > 1) return `עוד ${d} ימים`;
  if (d === 1) return `עוד יום ו-${h} שעות`;
  return `עוד ${Math.max(1, h)} שעות`;
}

/** Cheapest plan price (for "starting from"). */
export function minPrice(plans: Plan[] = SITE.pricing.plans): number {
  return Math.min(...plans.map((p) => p.price));
}

/** wa.me link with a prefilled message. */
export function waLink(message: string = SITE.whatsappMessage, phone: string = SITE.contact.phoneIntl): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Israeli mobile/landline → international digits for wa.me ("" if invalid). */
export function intlPhone(p: string | undefined): string {
  const dg = String(p || "").replace(/[^\d]/g, "").replace(/^972/, "0");
  return /^0\d{8,9}$/.test(dg) ? "972" + dg.slice(1) : "";
}
