/* Entry point for the event landing pages. The HTML is pre-rendered at build time
   (scripts/gen-pages.tsx); here React hydrates it to make it interactive. */
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { EVENT_PAGES } from "@/data/pages";
import { initTracking } from "@/lib/track";
import { EventPage } from "@/features/event/EventPage";
import "@/styles/home.scss";

const root = document.getElementById("root")!;
const page = EVENT_PAGES.find((p) => p.slug === root.dataset.slug);
initTracking();
if (page) hydrateRoot(root, <StrictMode><EventPage page={page} /></StrictMode>);
