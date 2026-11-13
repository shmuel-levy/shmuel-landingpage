/// <reference types="vitest/config" />
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = __dirname;

/**
 * Multi-page app: every HTML file at the root and in demos/ is an entry.
 * Keeping one HTML file per URL means every public link stays exactly the same
 * (shared surprise links, Google-indexed event pages, ad landing pages).
 */
function htmlEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const dir of ["", "demos"]) {
    for (const f of fs.readdirSync(path.join(root, dir))) {
      if (f.endsWith(".html")) entries[path.join(dir, f.replace(/\.html$/, "")).replace(/\\/g, "/")] = path.join(root, dir, f);
    }
  }
  return entries;
}

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.join(root, "src") } },
  build: {
    target: "es2020",
    rollupOptions: { input: htmlEntries() },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    css: false,
  },
});
