/* =========================================================
   Matanot: מדידה ומקור הגעה
   - Google Analytics 4 ו-Meta Pixel נטענים רק אם יש מזהה ב-config.js (analytics)
   - מקור ההגעה (utm_source / src / אתר מפנה) נשמר בדפדפן 30 יום,
     ונכנס להודעת הווטסאפ מטופס ההזמנה ("הגעתי דרך")
   - בהפתעות אמיתיות ללקוחות (mode: "gift") לא נטען כלום
   שימוש: mtTrack("event_name", { ... })
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE || {}, A = S.analytics || {};
  var gift = window.DEMO && window.DEMO.mode === "gift";
  var KEY = "matanot-src", DAYS = 30;
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { q = { get: function () { return null; } }; }
  var debug = q.get("debug") === "track";

  /* ---------- מקור הגעה ---------- */
  var NAMES = { ig: "אינסטגרם", instagram: "אינסטגרם", tiktok: "טיקטוק", tt: "טיקטוק", fb: "פייסבוק", facebook: "פייסבוק", google: "גוגל", wa: "ווטסאפ", whatsapp: "ווטסאפ", gift: "הפתעה שקיבלו", youtube: "יוטיוב" };
  function fromReferrer() {
    var r = document.referrer;
    if (!r) return "";
    try { var h = new URL(r).hostname; } catch (e) { return ""; }
    if (h === location.hostname) return "";
    if (/instagram/.test(h)) return "instagram";
    if (/tiktok/.test(h)) return "tiktok";
    if (/facebook|fb\.com|fb\.me/.test(h)) return "facebook";
    if (/google\./.test(h)) return "google";
    if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
    if (/youtube/.test(h)) return "youtube";
    return h.replace(/^www\./, "");
  }
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && Date.now() - v.at < DAYS * 864e5) return v;
    } catch (e) { /* */ }
    return null;
  }
  if (!gift) {
    var src = q.get("utm_source") || q.get("src") || q.get("ref");
    var camp = q.get("utm_campaign") || "";
    var cur = read();
    // קישור פנימי (עמוד אירוע / דוגמה) לא דורס מקור חיצוני כמו אינסטגרם
    var internal = src && /^(page|demo)-/.test(src);
    if (internal && cur) src = "";
    // קמפיין חיצוני מפורש תמיד גובר. אחרת נשמר המקור הראשון (30 יום)
    if (src || (!cur && fromReferrer())) {
      var s = (src || fromReferrer()).toLowerCase().slice(0, 40);
      try { localStorage.setItem(KEY, JSON.stringify({ src: s, camp: camp.slice(0, 60), at: Date.now(), page: location.pathname.split("/").pop() || "index" })); } catch (e) { /* */ }
    }
  }
  window.mtSource = function () {
    var v = read();
    if (!v) return null;
    var base = v.src.indexOf("demo-") === 0 ? "דוגמה באתר (" + v.src.slice(5) + ")" : v.src.indexOf("page-") === 0 ? "עמוד באתר (" + v.src.slice(5) + ")" : NAMES[v.src] || v.src;
    return { src: v.src, camp: v.camp, label: base + (v.camp ? " / " + v.camp : "") };
  };

  /* ---------- טעינת הכלים (רק עם מזהה) ---------- */
  function inject(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  if (!gift && A.ga4 && /^G-[A-Z0-9]+$/.test(A.ga4)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", A.ga4, { anonymize_ip: true });
    inject("https://www.googletagmanager.com/gtag/js?id=" + A.ga4);
  }
  if (!gift && A.metaPixel && /^\d{6,20}$/.test(A.metaPixel)) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", A.metaPixel);
    window.fbq("track", "PageView");
  }

  /* ---------- אירועים ---------- */
  // אירועים שיש להם שם קבוע אצל Meta (לפרסום ממומן)
  var META = { send_whatsapp: "Lead", sketch_view: "ViewContent", order_start: "InitiateCheckout" };
  window.mtTrack = function (name, params) {
    if (gift) return;
    params = params || {};
    try {
      if (window.gtag && A.ga4) window.gtag("event", name, params);
      if (window.fbq && A.metaPixel) {
        if (META[name]) window.fbq("track", META[name], params.value ? { value: params.value, currency: params.currency || "ILS", content_category: params.type || "" } : {});
        else window.fbq("trackCustom", name, params);
      }
    } catch (e) { /* המדידה לא עוצרת את האתר */ }
    if (debug && window.console) console.log("[track]", name, params);
  };

  // לחיצות שמודדים אוטומטית בכל העמודים
  var started = false;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    var label = (a.textContent || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (/wa\.me/.test(h) && !a.hasAttribute("data-send")) window.mtTrack("whatsapp_click", { label: label, page: location.pathname.split("/").pop() || "index" });
    else if (/order\.html/.test(h)) window.mtTrack("cta_order", { label: label, page: location.pathname.split("/").pop() || "index" });
    else if (/demos\/[a-z]+\.html/.test(h)) window.mtTrack("demo_open", { demo: h.split("/").pop().replace(".html", "") });
    else if (/^tel:/.test(h)) window.mtTrack("phone_click", {});
  }, true);
  // בטופס: הבחירה הראשונה בסוג ההפתעה = התחלת הזמנה
  document.addEventListener("change", function (e) {
    if (!started && e.target && e.target.name === "type") { started = true; window.mtTrack("order_start", { type: e.target.value }); }
  });
})();
