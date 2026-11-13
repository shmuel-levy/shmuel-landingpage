import { test as base, expect, type Frame, type FrameLocator, type Page } from "@playwright/test";

/**
 * Shared fixtures:
 *  - Google Fonts are stubbed (fast, deterministic, works offline).
 *  - Every page error / console error fails the test (`errors` is checked after each test).
 */
type Fixtures = { errors: string[] };

const IGNORED = [/favicon/i, /fonts\.(googleapis|gstatic)/i, /net::ERR_ABORTED/i, /AudioContext was not allowed/i];

export const test = base.extend<Fixtures>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
        route.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !IGNORED.some((r) => r.test(m.text()))) errors.push(`console: ${m.text()}`);
      });
      page.on("response", (r) => {
        if (r.status() >= 400 && !IGNORED.some((re) => re.test(r.url()))) errors.push(`http ${r.status()} ${r.url()}`);
      });
      await use(errors);
      expect(errors, "page/console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const isMobile = (name: string) => name === "mobile";

/** No sideways scrolling on the page. */
export async function expectNoHorizontalScroll(page: Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
  expect(o.sw, "horizontal overflow").toBeLessThanOrEqual(o.w + 1);
}

/**
 * Drives a surprise (demo / sketch) from its current step until the end:
 * the "final" step, or the "locked" step of a sketch. Returns the step types visited.
 * Works with reduced motion (no character animations, instant envelope).
 */
export async function driveSurprise(f: Frame | Page, opts: { maxSteps?: number } = {}): Promise<string[]> {
  const seen: string[] = [];
  const nextBtn = async () => {
    await f.waitForSelector(".next .btn:not([disabled])", { timeout: 8000 });
    await f.locator(".next .btn").first().click();
    await f.waitForTimeout(450);
  };
  for (let g = 0; g < (opts.maxSteps ?? 24); g++) {
    const type = await f.$eval(".step", (s) => (s.className.match(/step--(\w+)/) || [])[1] || "?");
    seen.push(type);
    if (type === "final" || type === "locked") break;
    switch (type) {
      case "envelope":
        await f.locator(".env").click();
        await nextBtn();
        break;
      case "message":
      case "countdown":
      case "voice":
        await nextBtn();
        break;
      case "notes":
        await nextBtn();
        break;
      case "choice":
        await f.locator(".option").first().click();
        await nextBtn();
        break;
      case "runaway":
        await f.locator(".run-yes").click();
        await f.waitForTimeout(400);
        if (await f.$(".step--runaway .next .btn")) await nextBtn();
        break;
      case "checklist":
        for (const label of await f.locator(".check label").all()) await label.click();
        await nextBtn();
        break;
      case "quiz":
        for (let q = 0; q < 8 && (await f.$(".quiz__q")); q++) {
          const n = await f.locator(".option").count();
          for (let i = 0; i < n; i++) {
            const b = f.locator(".option").nth(i);
            if (await b.isEnabled()) await b.click();
            if (await f.$(".option.is-right")) break;
          }
          await f.waitForTimeout(800);
        }
        await nextBtn();
        break;
      case "scratch":
        await f.locator(".skip").click();
        await nextBtn();
        break;
      case "photos":
        for (let i = 0; i < 12; i++) {
          const p = f.locator('.polaroid[tabindex="0"]:not(.is-gone)');
          if (!(await p.count())) break;
          await p.first().click();
          await f.waitForTimeout(120);
        }
        await nextBtn();
        break;
      case "hold": {
        const h = f.locator(".hold");
        await h.focus();
        await h.press("Space", { delay: 2600 });
        await nextBtn();
        break;
      }
      case "candles":
        for (const c of await f.locator(".candle").all()) await c.click();
        await nextBtn();
        break;
      case "reasons":
        for (const r of await f.locator(".reason").all()) await r.click();
        await nextBtn();
        break;
      case "openwhen":
        await f.locator(".ow__env").first().click();
        await f.locator(".ow__close").click();
        await nextBtn();
        break;
      case "coupons":
        await f.locator(".coupon").first().click();
        await nextBtn();
        break;
      case "wheel":
        await f.locator(".wheel__spin").click();
        await nextBtn();
        break;
      default:
        throw new Error(`unknown step type: ${type}`);
    }
  }
  return seen;
}

export type AnyFrame = Frame | FrameLocator;
