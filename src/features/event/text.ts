import { SITE } from "@/data/site";
import { minPrice } from "@/lib/pricing";

/** {price} / {perKid} placeholders in the FAQ answers. */
export function fillEventText(s: string): string {
  const premium = (SITE.pricing.plans.find((p) => p.id === "premium") || SITE.pricing.plans[0]).price;
  const FILL: Record<string, string> = {
    price: `החל מ-${minPrice()} ₪, ומשלמים רק אחרי שראיתם את הגרסה הסופית ואהבתם. בתקופות מבצע המחיר נמוך יותר, והוא מחושב לבד בטופס.`,
    perKid: `חבילת פרימיום עולה ${premium} ₪. בכיתה של 25 ילדים זה פחות מ-${Math.ceil(premium / 25)} ₪ להורה, ובמבצע אפילו פחות.`,
  };
  return s.replace(/\{(\w+)\}/g, (_, k: string) => FILL[k] || "");
}
