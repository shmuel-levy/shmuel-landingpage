import { describe, expect, it } from "vitest";
import { activePromo, intlPhone, minPrice, planPrice, timeLeftText, waLink } from "../pricing";
import type { Promo } from "@/types/content";

const promo: Promo = { active: true, percent: 20, endsAt: "2027-01-31T23:59:59+02:00", endsLabel: "31.1", title: "מבצע", text: "20%" };
const at = (iso: string) => new Date(iso).getTime();

describe("promo", () => {
  it("is active only before its end date", () => {
    expect(activePromo(promo, at("2026-12-01T10:00:00+02:00"))).toBe(promo);
    expect(activePromo(promo, at("2027-02-01T00:00:00+02:00"))).toBeNull();
    expect(activePromo({ ...promo, active: false }, at("2026-12-01T10:00:00+02:00"))).toBeNull();
  });

  it("discounts and rounds plan prices", () => {
    expect(planPrice({ price: 79 }, promo)).toBe(63);
    expect(planPrice({ price: 149 }, promo)).toBe(119);
    expect(planPrice({ price: 149 }, null)).toBe(149);
  });

  it("describes the time left in Hebrew", () => {
    expect(timeLeftText(promo, at("2027-01-20T23:59:59+02:00"))).toBe("עוד 11 ימים");
    expect(timeLeftText(promo, at("2027-01-30T20:59:59+02:00"))).toBe("עוד יום ו-3 שעות");
    expect(timeLeftText(promo, at("2027-01-31T23:00:00+02:00"))).toBe("עוד 1 שעות");
  });
});

describe("contact helpers", () => {
  it("builds WhatsApp links with an encoded message", () => {
    expect(waLink("היי", "972500000000")).toBe("https://wa.me/972500000000?text=%D7%94%D7%99%D7%99");
  });
  it("normalises Israeli phone numbers", () => {
    expect(intlPhone("050-123-4567")).toBe("972501234567");
    expect(intlPhone("+972 50 123 4567")).toBe("972501234567");
    expect(intlPhone("12345")).toBe("");
  });
  it("finds the cheapest plan", () => {
    expect(minPrice()).toBe(79);
  });
});
