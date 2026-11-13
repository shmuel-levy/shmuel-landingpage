import AxeBuilder from "@axe-core/playwright";
import { test, expect, expectNoHorizontalScroll } from "./fixtures";

const EVENT_PAGES: [slug: string, type: string][] = [
  ["michtav-ahava", "partner"],
  ["matana-leganenet", "thanks"],
  ["yom-huledet", "birthday"],
  ["hatzaat-nisuim", "proposal"],
  ["hodaa-al-herayon", "baby"],
  ["valentine", "partner"],
];

test.describe("event landing pages", () => {
  test.use({ reducedMotion: "reduce" });

  for (const [slug, type] of EVENT_PAGES) {
    test(`${slug}: content, order links and price`, async ({ page }) => {
      await page.goto(`${slug}.html`);
      await expect(page.locator("h1#evTitle")).toBeVisible();
      await expect(page.locator(".ev-hero .btn--primary")).toHaveAttribute("href", `order.html?type=${type}&src=page-${slug}`);
      await expect(page.locator("#evPrice")).toContainText(/החל מ-\d+ ₪/);
      expect(await page.locator(".ev-idea").count()).toBeGreaterThanOrEqual(4);
      expect(await page.locator(".faq__item").count()).toBeGreaterThanOrEqual(3);
      await expect(page.locator("[data-wa]").first()).toHaveAttribute("href", /^https:\/\/wa\.me\/972585943018\?text=/);
      await expect(page.locator(".ev-more a")).toHaveCount(6);
      // structured data for Google (FAQPage)
      const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(JSON.parse(ld || "{}")["@type"]).toBe("FAQPage");
      await expectNoHorizontalScroll(page);
    });
  }

  test("event page has no automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("michtav-ahava.html");
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(res.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe("legal pages", () => {
  for (const slug of ["privacy", "terms", "negishut"]) {
    test(`${slug} renders`, async ({ page }) => {
      await page.goto(`${slug}.html`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("header a.brand")).toHaveAttribute("href", "index.html");
      await expectNoHorizontalScroll(page);
    });
  }
});
