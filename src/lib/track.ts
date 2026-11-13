/* =========================================================
   Analytics + traffic source attribution
   - GA4 and Meta Pixel load only when an id is configured (src/data/site.ts → analytics)
   - The traffic source (utm_source / src / referrer) is kept 30 days in the browser
     and added to the order's WhatsApp message ("הגעתי דרך")
   - Real customer surprises (mode: "gift") load nothing: privacy of the recipient
   ========================================================= */
import { SITE } from "@/data/site";

type Params = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

const KEY = "matanot-src";
const DAYS = 30;
const NAMES: Record<string, string> = {
  ig: "אינסטגרם", instagram: "אינסטגרם", tiktok: "טיקטוק", tt: "טיקטוק", fb: "פייסבוק", facebook: "פייסבוק",
  google: "גוגל", wa: "ווטסאפ", whatsapp: "ווטסאפ", gift: "הפתעה שקיבלו", youtube: "יוטיוב",
};
// events with a standard name at Meta (for paid campaigns)
const META: Record<string, string> = { send_whatsapp: "Lead", sketch_view: "ViewContent", order_start: "InitiateCheckout" };

let gift = false;
let debug = false;
let started = false;
const A = SITE.analytics;

interface Stored { src: string; camp: string; at: number; page: string }

function fromReferrer(): string {
  const r = document.referrer;
  if (!r) return "";
  let h: string;
  try {
    h = new URL(r).hostname;
  } catch {
    return "";
  }
  if (h === location.hostname) return "";
  if (/instagram/.test(h)) return "instagram";
  if (/tiktok/.test(h)) return "tiktok";
  if (/facebook|fb\.com|fb\.me/.test(h)) return "facebook";
  if (/google\./.test(h)) return "google";
  if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
  if (/youtube/.test(h)) return "youtube";
  return h.replace(/^www\./, "");
}

function read(): Stored | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as Stored | null;
    if (v && Date.now() - v.at < DAYS * 864e5) return v;
  } catch {
    /* private mode */
  }
  return null;
}

/** Decide which source to remember (pure, unit-tested). */
export function nextSource(param: string | null, current: Stored | null, referrer: string): string | null {
  let src = param || "";
  // an internal link (event page / demo) doesn't overwrite an external source like Instagram
  if (src && /^(page|demo)-/.test(src) && current) src = "";
  // an explicit external campaign always wins; otherwise the first source is kept (30 days)
  if (src || (!current && referrer)) return (src || referrer).toLowerCase().slice(0, 40);
  return null;
}

/** Human label for a stored source, e.g. "אינסטגרם / valentine". */
export function sourceLabel(v: { src: string; camp?: string }): string {
  const base = v.src.startsWith("demo-")
    ? `דוגמה באתר (${v.src.slice(5)})`
    : v.src.startsWith("page-")
      ? `עמוד באתר (${v.src.slice(5)})`
      : NAMES[v.src] || v.src;
  return base + (v.camp ? " / " + v.camp : "");
}

export function getSource(): { src: string; camp: string; label: string } | null {
  const v = read();
  return v ? { src: v.src, camp: v.camp, label: sourceLabel(v) } : null;
}

function inject(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function track(name: string, params: Params = {}) {
  if (gift) return;
  try {
    if (window.gtag && A.ga4) window.gtag("event", name, params);
    if (window.fbq && A.metaPixel) {
      if (META[name])
        window.fbq("track", META[name], params.value ? { value: params.value, currency: params.currency || "ILS", content_category: params.type || "" } : {});
      else window.fbq("trackCustom", name, params);
    }
  } catch {
    /* tracking never breaks the site */
  }
  if (debug) console.log("[track]", name, params);
}

/** Call once per page. `isGift` disables everything (customer surprises). */
export function initTracking({ isGift = false }: { isGift?: boolean } = {}) {
  gift = isGift;
  const q = new URLSearchParams(location.search);
  debug = q.get("debug") === "track";
  if (gift) return;

  const src = nextSource(q.get("utm_source") || q.get("src") || q.get("ref"), read(), fromReferrer());
  if (src) {
    try {
      const camp = (q.get("utm_campaign") || "").slice(0, 60);
      localStorage.setItem(KEY, JSON.stringify({ src, camp, at: Date.now(), page: location.pathname.split("/").pop() || "index" }));
    } catch {
      /* */
    }
  }

  if (A.ga4 && /^G-[A-Z0-9]+$/.test(A.ga4)) {
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", A.ga4, { anonymize_ip: true });
    inject("https://www.googletagmanager.com/gtag/js?id=" + A.ga4);
  }
  if (A.metaPixel && /^\d{6,20}$/.test(A.metaPixel) && !window.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue!.push(args);
    } as NonNullable<Window["fbq"]>;
    n.queue = [];
    n.loaded = true;
    n.version = "2.0";
    n.push = n;
    window.fbq = n;
    window._fbq = n;
    inject("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", A.metaPixel);
    window.fbq("track", "PageView");
  }

  // clicks measured automatically on every page
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const h = a.getAttribute("href") || "";
      const label = (a.textContent || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60);
      const page = location.pathname.split("/").pop() || "index";
      if (/wa\.me/.test(h) && !a.hasAttribute("data-send")) track("whatsapp_click", { label, page });
      else if (/order\.html/.test(h)) track("cta_order", { label, page });
      else if (/demos\/[a-z]+\.html/.test(h)) track("demo_open", { demo: h.split("/").pop()!.replace(".html", "") });
      else if (/^tel:/.test(h)) track("phone_click", {});
    },
    true,
  );
  // in the order form, the first surprise-type choice = order started
  document.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement | null;
    if (!started && t?.name === "type") {
      started = true;
      track("order_start", { type: t.value });
    }
  });
}
