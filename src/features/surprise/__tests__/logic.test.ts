import { describe, expect, it } from "vitest";
import { chooseSpot } from "../runaway";
import { fillTemplate } from "../template";

describe("fillTemplate", () => {
  it("fills answers, then defaults, then empty", () => {
    expect(fillTemplate("the date: {date}", { date: "picnic" })).toBe("the date: picnic");
    expect(fillTemplate("{food} & {after}", {}, { food: "pasta" })).toBe("pasta & ");
    expect(fillTemplate(undefined, {})).toBe("");
  });
});

describe("chooseSpot (runaway 'no' button)", () => {
  const area = { w: 300, h: 200 };
  const no = { w: 80, h: 40 };
  const yes = { x: 110, y: 80, w: 80, h: 40 }; // centred

  it("never lands on the 'yes' button, even after it grows", () => {
    for (let r = 0; r < 1; r += 0.05) {
      const s = chooseSpot(area, no, yes, 1.35, -1, 1, () => r);
      const hits = s.x < yes.x + yes.w && s.x + no.w > yes.x && s.y < yes.y + yes.h && s.y + no.h > yes.y;
      expect(hits).toBe(false);
    }
  });

  it("never repeats the previous spot", () => {
    for (let last = 0; last < 8; last++) expect(chooseSpot(area, no, yes, 1, last, 1, () => 0).i).not.toBe(last);
  });

  it("stays inside the play area", () => {
    const s = chooseSpot(area, no, yes, 1, -1, 1, () => 0.99);
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.x + no.w).toBeLessThanOrEqual(area.w);
    expect(s.y + no.h).toBeLessThanOrEqual(area.h);
  });
});
