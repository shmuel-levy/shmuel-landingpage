import AxeBuilder from "@axe-core/playwright";
import { test, expect, expectNoHorizontalScroll, isMobile } from "./fixtures";

// A date inside the launch promo, so prices/popup are deterministic.
const IN_PROMO = new Date("2026-12-01T10:00:00+02:00");

test.describe("home page", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders all sections from the site config", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await expect(page.locator("h1")).toContainText("הרגש שלך");
    await expect(page.locator("h1")).toContainText("בקישור אחד");
    await expect(page.locator("#how .step")).toHaveCount(3);
    await expect(page.locator(".example")).toHaveCount(9);
    await expect(page.locator(".tool")).toHaveCount(16);
    await expect(page.locator(".plan")).toHaveCount(2);
    await expect(page.locator(".faq__item")).toHaveCount(12);
    await expect(page.locator(".review")).toHaveCount(3);
    await expect(page.locator(".project")).toHaveCount(3);
    await expect(page.locator(".ev-more a")).toHaveCount(6);
    await expect(page.locator("#proof li")).toHaveCount(3);
    await expect(page.locator("#footerContact a").first()).toHaveAttribute("href", "tel:+972585943018");
    await expect(page.locator("#waFloat")).toHaveAttribute("href", /^https:\/\/wa\.me\/972585943018\?text=/);
    await expectNoHorizontalScroll(page);
  });

  test("prices include the active promo", async ({ page }) => {
    await page.clock.setFixedTime(IN_PROMO);
    await page.goto("index.html?src=promo");
    await expect(page.locator("#promoStrip")).toBeVisible();
    await expect(page.locator("#plan-basic .plan__num")).toHaveText("63");
    await expect(page.locator("#plan-premium .plan__num")).toHaveText("119");
    await expect(page.locator("#plan-premium .plan__old")).toContainText("149");
  });

  test("examples can be filtered by category", async ({ page }, info) => {
    await page.goto("index.html?src=promo");
    if (isMobile(info.project.name)) {
      await expect(page.locator(".example:visible")).toHaveCount(4);
      await page.locator("#exMore").click();
    }
    await expect(page.locator(".example:visible")).toHaveCount(9);
    await page.locator(".tab", { hasText: "משפחה" }).click();
    await expect(page.locator(".example:visible")).toHaveCount(1);
    await expect(page.locator("#exStatus")).toHaveText("מוצגות 1 דוגמאות");
    await page.locator(".tab", { hasText: "זוגיות" }).click();
    await expect(page.locator(".example:visible")).toHaveCount(6);
  });

  test("idea generator, FAQ and about toggles", async ({ page }) => {
    await page.goto("index.html?src=promo");
    const title = page.locator("#ideaCard .idea__title");
    const before = await title.textContent();
    await page.locator("#ideaNext").click();
    await expect(title).not.toHaveText(before || "");
    await expect(page.locator("#ideaWant")).toHaveAttribute("href", /order\.html\?type=\w+/);

    const faq = page.locator(".faq__item").first();
    await faq.locator("summary").click();
    await expect(faq).toHaveAttribute("open", "");

    // "read more" exists on mobile only (desktop shows the whole story)
    if (await page.locator("#aboutMore").isVisible()) {
      await page.locator("#aboutMore").click();
      await expect(page.locator("#aboutMore")).toHaveAttribute("aria-expanded", "true");
    }
  });

  test("testimonial screenshot opens in a lightbox", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await page.locator(".review__shot").first().click();
    await expect(page.locator("#lightbox")).toBeVisible();
    await expect(page.locator("#lightboxImg")).toHaveAttribute("src", /review-1\.jpg/);
    await page.locator("#lightboxClose").click();
    await expect(page.locator("#lightbox")).toBeHidden();
  });

  test("accessibility menu applies and remembers settings", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await page.locator("#a11yToggle").click();
    await expect(page.locator("#a11yPanel")).toBeVisible();
    await page.locator('[data-a11y="contrast"]').click();
    await expect(page.locator("html")).toHaveClass(/a11y-contrast/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/a11y-contrast/);
    await page.locator("#a11yToggle").click();
    await page.locator("#a11yReset").click();
    await expect(page.locator("html")).not.toHaveClass(/a11y-contrast/);
  });

  test("hamburger menu opens a drawer and closes with Escape", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await page.locator(".burger").click();
    await expect(page.locator("#siteMenu")).toBeVisible();
    await expect(page.locator("#siteMenu .drawer__nav a")).toHaveCount(7);
    await page.keyboard.press("Escape");
    await expect(page.locator("#siteMenu")).toBeHidden();
  });

  test("mobile plan switch shows one plan at a time", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "mobile only");
    await page.goto("index.html?src=promo");
    await expect(page.locator("#plan-premium")).toBeVisible();
    await expect(page.locator("#plan-basic")).toBeHidden();
    await page.locator('.plan-switch [data-plan="basic"]').click();
    await expect(page.locator("#plan-basic")).toBeVisible();
    await expect(page.locator("#plan-premium")).toBeHidden();
  });

  test("has no automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await page.waitForTimeout(600);
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});

test.describe("promo popup", () => {
  test.use({ reducedMotion: "reduce" });

  test("opens with ?promo=1 and closes with Escape", async ({ page }) => {
    await page.clock.setFixedTime(IN_PROMO);
    await page.goto("index.html?promo=1");
    const pop = page.locator("#promoPop");
    await expect(pop).toBeVisible({ timeout: 6000 });
    await expect(page.locator("#ppopTitle")).toContainText("20%");
    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
  });

  test("is not shown to visitors who came from the promo itself", async ({ page }) => {
    await page.clock.setFixedTime(IN_PROMO);
    await page.goto("index.html?src=promo");
    await page.waitForTimeout(2500);
    await expect(page.locator("#promoPop")).toBeHidden();
  });
});

test.describe("hero live demo", () => {
  test("cupid shoots the seal and the envelope opens by itself", async ({ page }) => {
    await page.goto("index.html?src=promo");
    const frame = page.frameLocator("#demoFrame");
    await expect(frame.locator(".env")).toBeVisible();
    await expect(page.locator(".fx-cupid")).toBeVisible({ timeout: 8000 });
    await expect(frame.locator(".env")).toHaveClass(/is-cracked/, { timeout: 8000 });
    await expectNoHorizontalScroll(page);
  });

  test("shuffle loads a different example into the phone", async ({ page }) => {
    await page.goto("index.html?src=promo");
    await expect(page.locator("#demoNow")).toHaveText("נצא לדייט?");
    await page.locator("#demoShuffle").click();
    await expect(page.locator("#demoNow")).not.toHaveText("נצא לדייט?");
    await expect(page.locator("#demoFrame")).not.toHaveAttribute("src", /date\.html/);
    await expect(page.locator("#demoOrder")).toHaveAttribute("href", /order\.html\?type=\w+&src=hero-/);
    await expect(page.frameLocator("#demoFrame").locator(".env")).toBeVisible();
  });
});
