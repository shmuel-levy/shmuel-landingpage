/* =========================================================
   Matanot: המעטפה (רכיב משותף לדף הבית, לדוגמאות ולסקיצה)
   חותם שעווה שנסדק, דש שנפתח וחושף בטנה מעוצבת, וכרטיס שעולה החוצה.
   MatanotEnvelope.html({...})  ←  מחזיר כפתור מעטפה
   MatanotEnvelope.open(btn, done)  ←  מריץ את אנימציית הפתיחה
   ========================================================= */
(function () {
  "use strict";

  /* פלטות צבע: גם למעטפה וגם לאתר ההפתעה כולו */
  var PALETTES = {
    blush: {
      label: "ורוד פודרה",
      env: { paper: "#F6D4DF", shade: "#E7AFC2", "liner-a": "#C24873", "liner-b": "#FBE7EE", seal: "#B83563", "seal-hi": "#EE7DA3", "seal-deep": "#6E1A39", card: "#FFFCF8", ink: "#5A1631" },
      theme: { bg: "linear-gradient(170deg,#FFF8F5,#FCE1EA)", accent: "#E26D93", "accent-deep": "#B83563", ink: "#4A1530", soft: "#FDE6EE" },
      swatch: ["#F6D4DF", "#B83563", "#FFFCF8"],
    },
    ink: {
      label: "כחול דיו",
      env: { paper: "#2E62D3", shade: "#1D3F95", "liner-a": "#F5A9C0", "liner-b": "#16307F", seal: "#D9467A", "seal-hi": "#F58AAE", "seal-deep": "#7A1B3E", card: "#FFFCF8", ink: "#12297A" },
      theme: { bg: "linear-gradient(170deg,#F4F8FF,#DCE7FF)", accent: "#5B8DEF", "accent-deep": "#1F4FB8", ink: "#12297A", soft: "#E6EEFF" },
      swatch: ["#2E62D3", "#D9467A", "#FFFCF8"],
    },
    lilac: {
      label: "לילך",
      env: { paper: "#DCCFF6", shade: "#BBA6EA", "liner-a": "#6E4BC2", "liner-b": "#F3EEFD", seal: "#5B3FA8", "seal-hi": "#9C80E6", "seal-deep": "#2E1A66", card: "#FFFCF8", ink: "#2E1A66" },
      theme: { bg: "linear-gradient(170deg,#FAF7FF,#E6DCFA)", accent: "#9B7FE0", "accent-deep": "#5B3FA8", ink: "#2E1A66", soft: "#EFE8FB" },
      swatch: ["#DCCFF6", "#5B3FA8", "#FFFCF8"],
    },
    peach: {
      label: "אפרסק",
      env: { paper: "#FFD6C0", shade: "#F4B293", "liner-a": "#D9683A", "liner-b": "#FFF3EB", seal: "#C2552A", "seal-hi": "#F2905F", "seal-deep": "#6E2B0E", card: "#FFFCF8", ink: "#4A1F0C" },
      theme: { bg: "linear-gradient(170deg,#FFF8F2,#FFE0CC)", accent: "#F08A5D", "accent-deep": "#AD481D", ink: "#4A1F0C", soft: "#FFE8DA" },
      swatch: ["#FFD6C0", "#C2552A", "#FFFCF8"],
    },
    mint: {
      label: "מנטה",
      env: { paper: "#CBEEDD", shade: "#9BD7BC", "liner-a": "#1E7A58", "liner-b": "#EFFAF5", seal: "#17694B", "seal-hi": "#4DBA8F", "seal-deep": "#093524", card: "#FFFCF8", ink: "#0D3B2B" },
      theme: { bg: "linear-gradient(170deg,#F3FCF8,#D5F1E4)", accent: "#3BB58A", "accent-deep": "#17694B", ink: "#0D3B2B", soft: "#DDF5EA" },
      swatch: ["#CBEEDD", "#17694B", "#FFFCF8"],
    },
    gold: {
      label: "שמנת וזהב",
      env: { paper: "#F3E8CF", shade: "#E0CBA0", "liner-a": "#B08A2E", "liner-b": "#FFF9EC", seal: "#9C7420", "seal-hi": "#DDB65A", "seal-deep": "#4E3707", card: "#FFFDF8", ink: "#3D2C08" },
      theme: { bg: "linear-gradient(170deg,#FFFCF4,#F3E6C8)", accent: "#D4A63A", "accent-deep": "#85600F", ink: "#3D2C08", soft: "#F7EDD5" },
      swatch: ["#F3E8CF", "#9C7420", "#FFFDF8"],
    },
  };
  var LINERS = { dots: "נקודות", stripes: "פסים", hearts: "לבבות", confetti: "קונפטי" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // שפת השעווה: עיגול לא מושלם, כמו חותם אמיתי
  var BLOB = (function () {
    var pts = [];
    for (var i = 0; i < 72; i++) {
      var t = (i / 72) * Math.PI * 2;
      var r = 44 + 2.6 * Math.sin(7 * t + 0.3) + 1.7 * Math.sin(13 * t + 1.2) + 1.1 * Math.sin(3 * t);
      pts.push((50 + r * Math.cos(t)).toFixed(1) + " " + (50 + r * Math.sin(t)).toFixed(1));
    }
    return "M" + pts.join("L") + "Z";
  })();
  var HEART = "M50 66C38 58 31 51 31 43c0-6 4.6-10 10-10 4 0 7 2.2 9 5.5 2-3.3 5-5.5 9-5.5 5.4 0 10 4 10 10 0 8-7 15-19 23z";
  var uid = 0;

  function seal(mark) {
    var id = "sg" + (++uid);
    var m = mark
      ? '<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="\'Frank Ruhl Libre\',\'Suez One\',serif" font-weight="700" font-size="42" fill="#fff" opacity=".28" transform="translate(0 1.2)">' + esc(mark) + "</text>" +
        '<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="\'Frank Ruhl Libre\',\'Suez One\',serif" font-weight="700" font-size="42" style="fill:var(--env-seal-deep)" opacity=".9">' + esc(mark) + "</text>"
      : '<path d="' + HEART + '" fill="#fff" opacity=".28" transform="translate(0 1.2)"/><path d="' + HEART + '" style="fill:var(--env-seal-deep)" opacity=".85"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><radialGradient id="' + id + '" cx="36%" cy="30%" r="78%">' +
      '<stop offset="0" style="stop-color:var(--env-seal-hi)"/><stop offset=".5" style="stop-color:var(--env-seal)"/><stop offset="1" style="stop-color:var(--env-seal-deep)"/></radialGradient></defs>' +
      '<path d="' + BLOB + '" fill="url(#' + id + ')"/>' +
      '<circle cx="50" cy="50" r="30" fill="none" style="stroke:var(--env-seal-deep)" stroke-width="2.6" opacity=".5"/>' +
      '<circle cx="50" cy="51.2" r="30" fill="none" stroke="#fff" stroke-width="1.1" opacity=".28"/>' + m +
      '<ellipse cx="34" cy="27" rx="13" ry="5.5" fill="#fff" opacity=".22" transform="rotate(-32 34 27)"/></svg>';
  }

  var POSTMARK = '<svg class="env__postmark" viewBox="0 0 120 60" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<circle cx="30" cy="30" r="22"/><circle cx="30" cy="30" r="16" stroke-width="1.2"/>' +
    '<path d="M58 18c8-6 14 6 22 0s14 6 22 0 10 4 14 2M58 30c8-6 14 6 22 0s14 6 22 0 10 4 14 2M58 42c8-6 14 6 22 0s14 6 22 0 10 4 14 2"/></g>' +
    '<text x="30" y="31" text-anchor="middle" dominant-baseline="central" font-family="Heebo,Arial,sans-serif" font-weight="800" font-size="8.5" fill="currentColor" letter-spacing=".5">MATANOT</text></svg>';

  function html(o) {
    o = o || {};
    var ic = o.cardIcon && window.MatanotIcons ? window.MatanotIcons.svg(o.cardIcon, "env__card-ico") : "";
    var s = seal(o.mark);
    return '<button type="button" class="env env--liner-' + esc(o.liner || "dots") + (o.cls ? " " + esc(o.cls) : "") + '"' +
      (o.palette ? ' data-palette="' + esc(o.palette) + '"' : "") + ' aria-label="' + esc(o.label || "פתיחת המעטפה") + '">' +
      '<span class="env__float">' +
        '<span class="env__back"><span class="env__liner"></span></span>' +
        '<span class="env__card"><span class="env__card-in">' + ic +
          (o.cardTitle ? '<b class="env__card-title">' + esc(o.cardTitle) + "</b>" : "") +
          (o.cardText ? '<small class="env__card-text">' + esc(o.cardText) + "</small>" : "") +
          '<i class="env__card-rule"></i></span></span>' +
        '<span class="env__pocket"><span class="env__sides"></span><span class="env__bottom-wrap"><span class="env__bottom"></span></span>' + (o.postmark === false ? "" : POSTMARK) + "</span>" +
        '<span class="env__flapshade"><i></i></span>' +
        '<span class="env__flap"><span class="env__flap-out"></span><span class="env__flap-in"><span class="env__liner"></span></span></span>' +
        '<span class="env__seal"><span class="env__seal-half env__seal-half--a">' + s + '</span><span class="env__seal-half env__seal-half--b">' + s + "</span></span>" +
      "</span>" +
      '<span class="env__shadow"></span>' +
      "</button>";
  }

  function applyPalette(el, key) {
    var p = PALETTES[key] || PALETTES.blush;
    Object.keys(p.env).forEach(function (k) { el.style.setProperty("--env-" + k, p.env[k]); });
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
  }

  var timers = new WeakMap();
  function open(btn, done) {
    if (btn.classList.contains("is-cracked")) return;
    if (reduced()) {
      btn.classList.add("is-cracked", "is-open", "is-out", "is-presented");
      if (done) setTimeout(done, 60);
      return;
    }
    var t = [];
    btn.classList.add("is-cracked");
    t.push(setTimeout(function () { btn.classList.add("is-open"); }, 260));
    t.push(setTimeout(function () { btn.classList.add("is-out"); }, 820));
    t.push(setTimeout(function () { btn.classList.add("is-presented"); }, 1450));
    if (done) t.push(setTimeout(done, 1950));
    timers.set(btn, t);
  }
  function reset(btn) {
    (timers.get(btn) || []).forEach(clearTimeout);
    btn.classList.remove("is-cracked", "is-open", "is-out", "is-presented");
  }

  window.MatanotEnvelope = { html: html, open: open, reset: reset, applyPalette: applyPalette, palettes: PALETTES, liners: LINERS, seal: seal };
})();
