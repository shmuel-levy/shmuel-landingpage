import { test, expect, driveSurprise, expectNoHorizontalScroll, isMobile } from "./fixtures";

const DEMOS = ["date", "love", "anniversary", "trip", "proposal", "sorry", "baby", "bestie", "thanks"];

test.describe("surprise demos", () => {
  test.use({ reducedMotion: "reduce" });

  for (const name of DEMOS) {
    test(`${name}: can be played from the envelope to the final screen`, async ({ page }) => {
      await page.goto(`demos/${name}.html`);
      await expect(page.locator(".demo-flag")).toBeVisible();
      await expect(page.locator(".progress i").first()).toHaveClass("is-current");
      const seen = await driveSurprise(page);
      expect(seen[0]).toBe("envelope");
      expect(seen.at(-1)).toBe("final");
      await expect(page.locator(".step--final .replay")).toBeVisible();
      await expect(page.locator(".madeby")).toHaveAttribute("href", /order\.html\?(type=\w+&)?src=demo-/);
      await expectNoHorizontalScroll(page);
      // replay goes back to the envelope
      await page.locator(".replay").click();
      await expect(page.locator(".step--envelope")).toBeVisible();
    });
  }

  test("embed mode hides the demo chrome", async ({ page }) => {
    await page.goto("demos/date.html?embed=1");
    await expect(page.locator("body")).toHaveClass(/is-embed/);
    await expect(page.locator(".demo-flag")).toBeHidden();
  });

  test("?step= opens directly on a later step", async ({ page }) => {
    await page.goto("demos/love.html?step=2");
    await expect(page.locator(".step--reasons")).toBeVisible();
    await expect(page.locator(".progress i").nth(2)).toHaveClass("is-current");
  });

  test("runaway 'no' button escapes and 'yes' moves on", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "one viewport is enough");
    await page.goto("demos/date.html?step=1");
    await expect(page.locator(".step--runaway")).toBeVisible();
    const no = page.locator(".run-no");
    await no.click({ force: true });
    await expect(no).toHaveClass(/is-running/);
    await page.locator(".run-yes").click();
    await expect(page.locator(".step--runaway .next .btn, .step:not(.step--runaway)").first()).toBeVisible();
  });

  test("sketch preview shows the order's sketch with a watermark", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "matanot-sketch",
        JSON.stringify({
          palette: "blush",
          mode: "sketch",
          steps: [
            { type: "envelope", to: "לנועה", title: "יש לך הודעה", mark: "נ", card: { icon: "heart", title: "שאלה", text: "קטנה" } },
            { type: "message", icon: "hearts", title: "נועה!", text: ["שלום"] },
            { type: "locked", icon: "lock", title: "וזה רק חצי", items: [{ icon: "letter", label: "המכתב בסוף" }], teaser: { title: "נועה,", sign: "דני" } },
          ],
        }),
      );
    });
    await page.goto("demos/preview.html");
    await expect(page.locator(".demo-flag--sketch")).toBeVisible();
    await expect(page.locator(".sketch-wm")).toBeAttached();
    const seen = await driveSurprise(page);
    expect(seen).toEqual(["envelope", "message", "locked"]);
    await expect(page.locator(".locked li")).toHaveCount(1);
  });
});

test.describe("finishing characters (motion on)", () => {
  test("after all reason cards are flipped, a character advances to the next step", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "one viewport is enough");
    await page.goto("demos/love.html?step=2");
    for (const r of await page.locator(".reason").all()) await r.click();
    await expect(page.locator(".fx-layer")).toBeAttached({ timeout: 4000 });
    await expect(page.locator(".step--openwhen")).toBeVisible({ timeout: 9000 });
  });
});
