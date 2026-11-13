/* Entry point for the legal pages (privacy, terms, accessibility statement).
   Their text is plain static HTML; React only adds the hamburger menu to the header. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteMenu } from "@/components/layout/SiteMenu";
import { initTracking } from "@/lib/track";
import "@/styles/home.scss";

initTracking();
const host = document.getElementById("menu-root");
if (host) createRoot(host).render(<StrictMode><SiteMenu onHome={false} /></StrictMode>);
