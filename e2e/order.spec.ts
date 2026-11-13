import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, driveSurprise, expectNoHorizontalScroll, isMobile } from "./fixtures";

const TYPES = ["partner", "proposal", "birthday", "sorry", "baby", "friend", "thanks", "family", "other"];

const step = (page: Page) => page.locator(".wz-step:not([hidden])");

async function next(page: Page) {
  await step(page).locator("[data-next]").click();
  await page.waitForTimeout(250);
}

/** Opens every collapsed group in the current wizard step. */
async function openGroups(page: Page) {
  const closed = step(page).locator("details:not([open]) > summary");
  for (let i = 0; i < 20 && (await closed.count()); i++) await closed.first().click();
}

/** Fills every required field in the current wizard step with plausible values. */
async function fillRequired(page: Page) {
  await openGroups(page);
  const s = step(page);
  const quick = s.locator('[data-dp-quick][data-n="7"]');
  if (await quick.count()) await quick.first().click();
  const reqs = s.locator('[aria-required="true"]');
  const n = await reqs.count();
  for (let i = 0; i < n; i++) {
    const el = reqs.nth(i);
    const type = await el.getAttribute("type");
    const id = await el.getAttribute("id");
    if (type === "radio") {
      const name = await el.getAttribute("name");
      // a native click: works whether the input is visually hidden or the field re-renders after choosing
      if (!(await s.locator(`input[name="${name}"]:checked`).count())) await el.evaluate((e) => (e as HTMLInputElement).click());
      continue;
    }
    const value = type === "tel" ? "050-1234567" : type === "number" ? "30" : id === "f-from" ? "שלך, דני" : "נועה";
    await el.fill(value);
  }
}

async function chooseType(page: Page, type: string) {
  await page.locator(`.type-card:has(input[value="${type}"])`).click();
  await expect(page.locator(`.type-card input[value="${type}"]`)).toBeChecked();
  await next(page);
  await expect(page.locator("#wizard")).toHaveAttribute("data-step", "story");
}

async function toSketch(page: Page, type: string) {
  await page.goto("order.html");
  await chooseType(page, type);
  await fillRequired(page);
  await next(page);
  await expect(page.locator("#wizard")).toHaveAttribute("data-step", "design");
  await next(page);
  await expect(page.locator("#wizard")).toHaveAttribute("data-step", "details");
  await fillRequired(page);
  await next(page);
  await expect(page.locator("#wizard")).toHaveAttribute("data-step", "sketch");
}

function waText(href: string | null) {
  expect(href).toMatch(/^https:\/\/wa\.me\/972585943018\?text=/);
  return decodeURIComponent((href || "").split("?text=")[1] || "");
}

test.describe("order wizard", () => {
  test.use({ reducedMotion: "reduce" });

  for (const type of TYPES) {
    test(`${type}: type → story → design → details → sketch → WhatsApp`, async ({ page }, info) => {
      test.skip(!isMobile(info.project.name) && !["partner", "birthday"].includes(type), "desktop: two types are enough");
      await toSketch(page, type);
      const frame = page.frameLocator("#sketchFrame");
      await expect(frame.locator(".step--envelope")).toBeVisible();
      await expect(frame.locator(".demo-flag--sketch")).toBeVisible();
      await expect(page.locator("#summary")).toContainText("נועה");
      const msg = waText(await page.locator("#sendWa").getAttribute("href"));
      expect(msg).toContain("היי שמואל!");
      expect(msg).toContain("*למי:* נועה");
      expect(msg).toContain("• הסדר");
      expect(msg).toContain("*טלפון:* 050-1234567");
      await expect(page.locator("#msgPreview")).toHaveText(msg);
      await expectNoHorizontalScroll(page);
    });
  }

  test("the sketch can be played up to the locked half", async ({ page }) => {
    await toSketch(page, "partner");
    const frame = page.frame({ url: /preview\.html/ });
    expect(frame).toBeTruthy();
    await frame!.waitForSelector(".step--envelope");
    const seen = await driveSurprise(frame!);
    expect(seen[0]).toBe("envelope");
    expect(seen.at(-1)).toBe("locked");
    await expect(page.frameLocator("#sketchFrame").locator(".sketch-wm")).toBeAttached();
  });

  test("validation: shows a focused error summary and marks fields", async ({ page }) => {
    await page.goto("order.html");
    await next(page);
    await expect(page.locator("#step-type .wz-errors")).toBeVisible();
    await expect(page.locator("#step-type .wz-errors")).toBeFocused();
    await chooseType(page, "partner");
    await next(page);
    await expect(page.locator("#step-story .wz-errors")).toBeVisible();
    expect(await page.locator("#step-story .field.has-error").count()).toBeGreaterThan(0);
    await expect(page.locator("#f-recipient")).toHaveAttribute("aria-invalid", "true");
    await page.locator("#f-recipient").fill("נועה");
    await expect(page.locator("#f-recipient")).not.toHaveAttribute("aria-invalid", "true");
  });

  test("a draft is saved and restored after reload", async ({ page }) => {
    await page.goto("order.html?type=birthday");
    await expect(page.locator("#wizard")).toHaveAttribute("data-step", "story");
    await page.locator("#f-recipient").fill("שירה");
    await page.waitForTimeout(600);
    await page.goto("order.html");
    await expect(page.locator("#draftNote")).toBeVisible();
    await expect(page.locator("#f-recipient")).toHaveValue("שירה");
    await page.locator("#restart").click();
    await expect(page.locator("#wizard")).toHaveAttribute("data-step", "type");
  });

  test("the idea button fills a field with a suggestion", async ({ page }) => {
    await page.goto("order.html?type=partner");
    await openGroups(page);
    const btn = step(page).locator("[data-help]").first();
    const fid = await btn.getAttribute("data-help");
    await btn.click();
    const input = page.locator(`[data-key="${fid}"]`).first();
    await expect(input).not.toHaveValue("");
    await expect(btn).toContainText("רעיון אחר");
  });

  test("date picker: keyboard navigation and quick chips", async ({ page }) => {
    await page.goto("order.html?type=partner");
    await fillRequired(page);
    await next(page);
    await next(page);
    await expect(page.locator("#wizard")).toHaveAttribute("data-step", "details");
    await page.locator("#f-deadline").click();
    const pop = page.locator("#f-deadline-pop");
    await expect(pop).toBeVisible();
    await page.keyboard.press("ArrowLeft"); // RTL: left = next day
    await page.keyboard.press("Enter");
    await expect(pop).toBeHidden();
    await expect(page.locator("#f-deadline .dp__val small")).toHaveText("מחר");
    await page.locator('[data-dp-quick="deadline"][data-n="14"]').click();
    await expect(page.locator('[data-dp-quick="deadline"][data-n="14"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#f-deadline .dp__val small")).toHaveText("בעוד 2 שבועות");
  });

  test("parts order can be changed (envelope stays first)", async ({ page }) => {
    await page.goto("order.html?type=partner");
    await fillRequired(page);
    await next(page);
    await openGroups(page);
    const names = () => page.locator("#partsPath .path__name").allTextContents();
    const before = await names();
    expect(before[0]).toBe("המעטפה");
    await page.locator("#partsPath .path__item:not(.is-fixed) [data-mv='1']").first().click();
    const after = await names();
    expect(after[0]).toBe("המעטפה");
    expect(after.at(-1)).toBe(before.at(-1));
    expect(after[1]).toBe(before[2]);
    expect(after[2]).toBe(before[1]);
    await expect(page.locator("#pathReset")).toBeVisible();
    await page.locator("#pathReset").click();
    expect(await names()).toEqual(before);
  });

  test("a voice recording can be uploaded and plays right after the envelope", async ({ page }) => {
    await page.goto("order.html?type=partner");
    await fillRequired(page);
    await next(page);
    await openGroups(page);
    await page.locator("#voiceFile").setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: wav(2) });
    await expect(page.locator(".rec__done")).toBeVisible();
    await expect(page.locator("#partsPath .path__name").nth(1)).toHaveText("הודעה קולית");
    await next(page);
    await fillRequired(page);
    await next(page);
    await expect(page.locator("#voiceSend")).toBeVisible();
    const frame = page.frameLocator("#sketchFrame");
    await frame.locator(".env").click();
    await frame.locator(".next .btn").click();
    await expect(frame.locator(".step--voice")).toBeVisible();
    await expect(frame.locator(".voice__play")).toBeEnabled();
  });

  test("has no automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("order.html");
    const scan = async () =>
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`,
      );
    expect(await scan()).toEqual([]);
    await chooseType(page, "partner");
    await next(page); // validation errors visible
    expect(await scan()).toEqual([]);
  });
});

/** A tiny mono 8kHz WAV with a sine tone. */
function wav(sec: number): Buffer {
  const sr = 8000, n = sr * sec, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 8) * 8000), 44 + i * 2);
  return b;
}
