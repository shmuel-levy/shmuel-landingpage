/* Entry point: the landing page (index.html). Content comes from src/data/site.ts. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initTracking } from "@/lib/track";
import { HomePage } from "@/features/home/HomePage";
import "@/styles/home.scss";

initTracking();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
);
