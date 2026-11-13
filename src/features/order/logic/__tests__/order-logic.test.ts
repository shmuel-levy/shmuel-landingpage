import { describe, expect, it } from "vitest";
import { buildDemo, lockHalf } from "../demo";
import { orderMessage, totals } from "../message";
import { applyCustomOrder, chosenParts, defaultParts, stepLabel, type KeyedStep } from "../parts";
import { genderText, problem } from "../validate";
import { addDays, dpLabel, dpRel, fromIso, isoOf, today0 } from "../dates";
import { ADDR, COMMON_TOP, DETAILS, EXTRAS, VOICE_AT } from "../../config";
import type { Promo } from "@/types/content";

const base = { recipient: "נועה", address: ADDR[0], from: "שלך, דני", phone: "050-1234567", name: "דני לוי" };
const types = (steps: { type: string }[]) => steps.map((s) => s.type);
const promo: Promo = { active: true, percent: 20, endsAt: "2099-01-01T00:00:00Z", endsLabel: "31.1", title: "מבצע השקה", text: "" };

describe("parts", () => {
  it("defaults to the recommended parts of the type", () => {
    expect(defaultParts("partner", {})).toEqual(["runaway", "photos", "reasons"]);
  });
  it("adds a part the customer already wrote content for", () => {
    expect(defaultParts("partner", { coupons: ["עיסוי"] })).toContain("coupons");
  });
  it("caps the parts by plan and keeps the recommended order", () => {
    const d = { elements: ["wheel", "coupons", "photos", "runaway", "reasons", "openwhen"], plan: "basic" };
    expect(chosenParts("partner", d)).toEqual(["runaway", "photos", "reasons"]);
    expect(chosenParts("partner", d, true)).toHaveLength(6);
  });
});

describe("custom order (drag and drop)", () => {
  const steps = (): KeyedStep[] => [{ type: "envelope" }, { type: "message" }, { type: "photos", items: [] }, { type: "reasons", items: [] }, { type: "final" }] as KeyedStep[];
  it("keeps the envelope first and the ending last", () => {
    const out = applyCustomOrder(steps(), ["reasons", "photos", "message"]);
    expect(types(out)).toEqual(["envelope", "reasons", "photos", "message", "final"]);
  });
  it("a part that wasn't sorted keeps its recommended slot", () => {
    const out = applyCustomOrder(steps(), ["reasons", "message"]);
    expect(types(out)).toEqual(["envelope", "reasons", "photos", "message", "final"]);
  });
});

describe("buildDemo (the sketch)", () => {
  it("partner: envelope → message → parts → ending, with the recipient's name", () => {
    const demo = buildDemo({ type: "partner", data: { ...base, finale: "דייט" }, photos: [], voice: null });
    expect(types(demo.steps)).toEqual(["envelope", "message", "photos", "reasons", "runaway", "final"]);
    expect(demo.steps[0]).toMatchObject({ type: "envelope", to: "לנועה", mark: "נ", hint: "הקישי על החותם" });
    expect(demo.steps.at(-1)).toMatchObject({ variant: "invite", title: "זה רשמי!" });
    expect(demo).toMatchObject({ palette: "blush", liner: "hearts", mode: "sketch", orderType: "partner" });
  });
  it("addresses the recipient by gender", () => {
    const male = buildDemo({ type: "partner", data: { ...base, address: ADDR[1] }, photos: [], voice: null });
    expect(male.steps[0]).toMatchObject({ hint: "הקש על החותם" });
  });
  it("puts the voice message right after the envelope, or right before the end", () => {
    const voice = { url: "blob:x", dur: 12, type: "audio/webm" };
    const first = buildDemo({ type: "birthday", data: base, photos: [], voice });
    expect(first.steps[1]).toMatchObject({ type: "voice", src: "blob:x", duration: 12 });
    const last = buildDemo({ type: "birthday", data: { ...base, voiceAt: VOICE_AT[1] }, photos: [], voice });
    expect(types(last.steps).slice(-2)).toEqual(["voice", "final"]);
  });
  it("uses the customer's photos in the album", () => {
    const demo = buildDemo({ type: "partner", data: { ...base, memories: ["הים"] }, photos: ["blob:1", "blob:2"], voice: null });
    const album = demo.steps.find((s) => s.type === "photos") as { items: { src: string; caption: string }[] };
    expect(album.items[0]).toEqual({ src: "blob:1", caption: "הים" });
    expect(album.items).toHaveLength(2);
  });
  it("adds a reply button only when asked and the phone is valid", () => {
    const yes = buildDemo({ type: "thanks", data: { ...base, extras: [EXTRAS[0]] }, photos: [], voice: null });
    expect(yes.reply).toEqual({ phone: "972501234567", name: "דני" });
    expect(buildDemo({ type: "thanks", data: base, photos: [], voice: null }).reply).toBeNull();
  });
  it("an anniversary gets the chuppah character", () => {
    expect(buildDemo({ type: "other", data: { ...base, occasion: "יום נישואין" }, photos: [], voice: null }).fx).toBe("chuppah");
  });
  it("every type builds a playable surprise", () => {
    for (const t of ["partner", "proposal", "birthday", "sorry", "baby", "friend", "thanks", "family", "other"]) {
      const demo = buildDemo({ type: t, data: base, photos: [], voice: null });
      expect(demo.steps[0].type).toBe("envelope");
      expect(demo.steps.at(-1)!.type).toBe("final");
    }
  });
});

describe("lockHalf", () => {
  it("shows the envelope and half of the parts, the rest is listed as locked", () => {
    const demo = lockHalf(buildDemo({ type: "partner", data: base, photos: [], voice: null }), base);
    expect(types(demo.steps)).toEqual(["envelope", "message", "photos", "locked"]);
    const locked = demo.steps.at(-1) as { items: { label: string }[] };
    expect(locked.items.map((i) => i.label)).toEqual(["קלפי סיבות", "כפתור לא שבורח", "המכתב בסוף"]);
  });
});

describe("validation", () => {
  const [recipient, address] = COMMON_TOP;
  const phone = DETAILS.find((f) => f.id === "phone")!, deadline = DETAILS.find((f) => f.id === "deadline")!;
  it("required fields", () => {
    expect(problem(recipient, {})).toBe("צריך למלא את השדה הזה");
    expect(problem(address, {})).toBe("צריך לבחור אחת מהאפשרויות");
    expect(problem(recipient, { recipient: "נועה" })).toBe("");
  });
  it("phone numbers", () => {
    expect(problem(phone, { phone: "123" })).toMatch("מספר טלפון לא תקין");
    expect(problem(phone, { phone: "+972 50-123-4567" })).toBe("");
  });
  it("dates in the past", () => {
    expect(problem(deadline, { deadline: "2020-01-01" })).toBe("התאריך כבר עבר");
  });
  it("gendered suggestions", () => {
    expect(genderText("תקשיב[י||ו] עד הסוף", ADDR[0])).toBe("תקשיבי עד הסוף");
    expect(genderText("תקשיב[י||ו] עד הסוף", ADDR[1])).toBe("תקשיב עד הסוף");
    expect(genderText("תקשיב[י||ו] עד הסוף", ADDR[2])).toBe("תקשיבו עד הסוף");
  });
});

describe("dates", () => {
  const now = new Date(2026, 10, 12, 15, 0);
  it("round-trips local ISO dates", () => {
    expect(isoOf(fromIso("2026-03-09")!)).toBe("2026-03-09");
    expect(fromIso("nope")).toBeNull();
  });
  it("describes relative dates in Hebrew", () => {
    expect(dpRel(today0(now), now)).toBe("היום");
    expect(dpRel(addDays(today0(now), 1), now)).toBe("מחר");
    expect(dpRel(addDays(today0(now), 5), now)).toBe("בעוד 5 ימים");
    expect(dpRel(addDays(today0(now), 14), now)).toBe("בעוד 2 שבועות");
  });
  it("labels a day", () => {
    expect(dpLabel(new Date(2026, 10, 12))).toBe("יום חמישי, 12 בנובמבר");
  });
});

describe("totals and the WhatsApp message", () => {
  it("adds add-ons to the discounted plan price", () => {
    const t = totals({ plan: "premium", addons: ["express"] }, promo);
    expect(t.sum).toBe(119 + 20);
    expect(t.full).toBe(149 + 20);
  });
  it("summarises the order for Shmuel", () => {
    const msg = orderMessage({
      type: "partner",
      data: { ...base, plan: "basic", deadline: "2030-05-01", palette: "blush", liner: "hearts", mood: "romantic", tone: ["רומנטי"] },
      photos: [{ url: "blob:1", name: "a.jpg" }],
      voice: null,
      promo,
      sourceLabel: "אינסטגרם",
    });
    expect(msg).toContain("*סוג ההפתעה:* בן / בת זוג");
    expect(msg).toContain("*למי:* נועה");
    expect(msg).toContain("• טון: רומנטי");
    expect(msg).toContain("• תמונות: 1");
    expect(msg).toContain("*חבילה:* בסיסי, 63 ₪ (במקום 79 ₪, מבצע השקה)");
    expect(msg).toContain("*צריך עד:* 01.05.2030");
    expect(msg).toContain("*הגעתי דרך:* אינסטגרם");
    expect(msg).toMatch(/• הסדר: המעטפה ← הודעה אישית ← /);
  });
  it("labels steps for the order list", () => {
    expect(stepLabel({ type: "final", variant: "ticket" } as never)).toEqual(["ticket", "כרטיס טיסה"]);
    expect(stepLabel({ type: "reasons" } as never)).toEqual(["hearts", "קלפי סיבות"]);
  });
});
