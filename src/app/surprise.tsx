/* Entry point for every surprise page: demos/*.html, demos/preview.html (the sketch)
   and real customer gifts. The page defines window.DEMO in a classic inline script. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PALETTES, isPalette } from "@/lib/envelope/palettes";
import { initTracking } from "@/lib/track";
import { SurpriseApp } from "@/features/surprise/SurpriseApp";
import "@/styles/surprise.scss";

const demo = window.DEMO;
if (demo) {
  // the palette's theme (overridable per surprise) → CSS variables for the whole page
  const theme = { ...(isPalette(demo.palette) ? PALETTES[demo.palette].theme : {}), ...(demo.theme || {}) };
  for (const [k, v] of Object.entries(theme)) document.documentElement.style.setProperty("--" + k, v);
  initTracking({ isGift: demo.mode === "gift" });
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <SurpriseApp demo={demo} />
    </StrictMode>,
  );
}
