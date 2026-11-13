import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests.
 *  - default: runs against the production build (`vite preview`, port 4173). Run `npm run build` first.
 *  - E2E_TARGET=legacy: runs the same specs against the original vanilla-JS site (LEGACY_DIR),
 *    which is how the React migration was verified to keep behaviour identical.
 */
const legacy = process.env.E2E_TARGET === "legacy";
const port = legacy ? 4300 : 4173;
const ci = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: ci ? 2 : 4,
  retries: ci ? 1 : 0,
  reporter: ci ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${port}/`,
    // Locally we use the installed Google Chrome; CI installs Playwright's Chromium.
    channel: ci ? undefined : "chrome",
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: "desktop", use: { viewport: { width: 1366, height: 900 } } },
  ],
  webServer: legacy
    ? { command: `node e2e/static-server.mjs "${process.env.LEGACY_DIR}" ${port}`, port, reuseExistingServer: true }
    : { command: "npm run preview", port, reuseExistingServer: !ci },
});
