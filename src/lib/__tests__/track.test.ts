import { describe, expect, it } from "vitest";
import { nextSource, sourceLabel } from "../track";

const stored = { src: "instagram", camp: "", at: Date.now(), page: "index" };

describe("traffic source attribution", () => {
  it("remembers an explicit campaign source", () => {
    expect(nextSource("TikTok", null, "")).toBe("tiktok");
    expect(nextSource("facebook", stored, "")).toBe("facebook"); // explicit always wins
  });
  it("internal links don't overwrite an external source", () => {
    expect(nextSource("page-valentine", stored, "")).toBeNull();
    expect(nextSource("demo-love", null, "")).toBe("demo-love");
  });
  it("falls back to the referrer only for first visits", () => {
    expect(nextSource(null, null, "google")).toBe("google");
    expect(nextSource(null, stored, "google")).toBeNull();
  });
  it("labels sources in Hebrew for the order message", () => {
    expect(sourceLabel({ src: "ig", camp: "valentine" })).toBe("אינסטגרם / valentine");
    expect(sourceLabel({ src: "demo-love" })).toBe("דוגמה באתר (love)");
    expect(sourceLabel({ src: "page-yom-huledet" })).toBe("עמוד באתר (yom-huledet)");
  });
});
