/* =========================================================
   Matanot: המעטפה (רכיב משותף לדף הבית, לדוגמאות, לסקיצה ולטופס)
   חותם שעווה שנסדק, דש שנפתח וחושף בטנה מעוצבת, וכרטיס שעולה החוצה,
   מתקרב, ורק אז נכתב עליו הטקסט.
   MatanotEnvelope.html({...})        ←  מחזיר כפתור מעטפה
   MatanotEnvelope.open(btn, done)    ←  מריץ את אנימציית הפתיחה
   MatanotEnvelope.sound = false      ←  בלי צלילים (ברירת מחדל: צלילים עדינים)
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
      env: { paper: "#2E62D3", shade: "#1D3F95", "liner-a": "#F5A9C0", "liner-b": "#16307F", seal: "#D9467A", "seal-hi": "#F58AAE", "seal-deep": "#7A1B3E", card: "#FFFCF8", ink: "#12297A", to: "#FFFFFF" },
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
  // קו השבר: אותו קו שבו שני חצאי החותם נפרדים
  var CRACK = "M54 0L47 21L56 40L46 60L55 79L49 100";
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
  var TAP = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#fff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M9.2 13.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6l5.1.9c1.1.2 1.9 1.2 1.8 2.3l-.5 4.5a3 3 0 0 1-3 2.6h-3.9a3 3 0 0 1-2.4-1.2l-3.3-4.4a1.5 1.5 0 0 1 2.2-2z"/></svg>';

  /* o: { label, mark, liner, to, cardIcon, cardTitle, cardText, cardSign, postmark, cls, palette, hint } */
  function html(o) {
    o = o || {};
    var ic = o.cardIcon && window.MatanotIcons ? '<span class="env__card-medal">' + window.MatanotIcons.svg(o.cardIcon, "env__card-ico") + "</span>" : "";
    var s = seal(o.mark);
    var label = o.label || "פתיחת המעטפה";
    if (o.to && label.indexOf(o.to) < 0) label += ", " + o.to;
    return '<button type="button" class="env env--liner-' + esc(o.liner || "dots") + (o.to ? " env--has-to" : "") + (o.cls ? " " + esc(o.cls) : "") + '"' +
      (o.palette ? ' data-palette="' + esc(o.palette) + '"' : "") + ' aria-label="' + esc(label) + '">' +
      '<span class="env__float">' +
        '<span class="env__back"><span class="env__liner"></span></span>' +
        '<span class="env__glow" aria-hidden="true"></span>' +
        '<span class="env__card"><span class="env__card-in">' + ic +
          (o.cardTitle ? '<b class="env__card-title">' + esc(o.cardTitle) + "</b>" : "") +
          (o.cardText ? '<small class="env__card-text">' + esc(o.cardText) + "</small>" : "") +
          '<i class="env__card-rule"></i>' +
          (o.cardSign ? '<em class="env__card-sign">' + esc(o.cardSign) + "</em>" : "") +
          '</span><span class="env__card-sheen" aria-hidden="true"></span></span>' +
        '<span class="env__pocket"><span class="env__sides"></span><span class="env__bottom-wrap"><span class="env__bottom"></span></span>' +
          (o.postmark === false ? "" : POSTMARK) +
          (o.to ? '<span class="env__to" aria-hidden="true">' + esc(o.to) + "</span>" : "") + "</span>" +
        '<span class="env__flapshade"><i></i></span>' +
        '<span class="env__flap"><span class="env__flap-out"></span><span class="env__flap-in"><span class="env__liner"></span></span></span>' +
        '<span class="env__sheen" aria-hidden="true"></span>' +
        '<span class="env__seal"><span class="env__seal-half env__seal-half--a">' + s + '</span><span class="env__seal-half env__seal-half--b">' + s + "</span>" +
          '<svg class="env__crack" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="' + CRACK + '"/></svg></span>' +
        (o.hint === false ? "" : '<span class="env__tap" aria-hidden="true"><i></i><i></i>' + TAP + "</span>") +
        '<span class="env__fx" aria-hidden="true"></span>' +
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

  /* ---------- צלילים עדינים, נוצרים בדפדפן (בלי קבצים) ---------- */
  var AC = null;
  function audio() {
    if (API.sound === false) return null;
    // דפדפנים לא מנגנים לפני נגיעה ראשונה בעמוד: לא מנסים בכלל (בלי אזהרות)
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = AC || new C();
      if (AC.state === "suspended") AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function noise(c, dur) {
    var b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = b; return src;
  }
  function env(g, t, peak, a, r) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
  }
  var SFX = {
    // סדק בשעווה: נקישה חדה ומעט "גוף"
    crack: function (c, t) {
      var n = noise(c, 0.14), hp = c.createBiquadFilter(), g = c.createGain();
      hp.type = "highpass"; hp.frequency.value = 1900;
      n.connect(hp); hp.connect(g); g.connect(c.destination); env(g, t, 0.22, 0.004, 0.11); n.start(t); n.stop(t + 0.15);
      var o = c.createOscillator(), g2 = c.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
      o.connect(g2); g2.connect(c.destination); env(g2, t, 0.16, 0.004, 0.12); o.start(t); o.stop(t + 0.15);
    },
    // נייר שמחליק החוצה
    paper: function (c, t) {
      var n = noise(c, 0.6), bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = "bandpass"; bp.Q.value = 0.7; bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
      n.connect(bp); bp.connect(g); g.connect(c.destination); env(g, t, 0.07, 0.18, 0.38); n.start(t); n.stop(t + 0.6);
    },
    // צלצול קטן כשהכרטיס מוצג
    chime: function (c, t) {
      [[1318.5, 0], [1975.5, 0.09], [2637, 0.2]].forEach(function (nt) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = nt[0];
        o.connect(g); g.connect(c.destination); env(g, t + nt[1], 0.045, 0.01, 1.1); o.start(t + nt[1]); o.stop(t + nt[1] + 1.2);
      });
    },
  };
  function play(kind) {
    var c = audio();
    if (!c) return;
    try { SFX[kind](c, c.currentTime + 0.01); } catch (e) { /* בלי צליל */ }
  }
  function buzz(ms) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* */ } }

  /* ---------- חלקיקים: פירורי שעווה בשבירה, נצנוצים ולבבות כשהכרטיס יוצא ---------- */
  var SPARK = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5c.9 6.1 3.4 9.1 10.5 10.5-7.1 1.4-9.6 4.4-10.5 10.5C11.1 16.4 8.6 13.4 1.5 12 8.6 10.6 11.1 7.6 12 1.5z"/></svg>';
  var HEARTP = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/></svg>';
  function particles(host, n, kind) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      var d = kind === "crumb" ? 26 + Math.random() * 40 : 70 + Math.random() * 100;
      p.className = "env__p env__p--" + kind + (kind === "spark" && i % 4 === 0 ? " env__p--dot" : "");
      p.style.setProperty("--x", (Math.cos(a) * d).toFixed(1) + "px");
      p.style.setProperty("--y", (Math.sin(a) * d * (kind === "crumb" ? 0.5 : 0.8) + (kind === "crumb" ? 46 : -10)).toFixed(1) + "px");
      p.style.setProperty("--r", (Math.random() * 540 - 270).toFixed(0) + "deg");
      p.style.setProperty("--s", (0.6 + Math.random() * 0.8).toFixed(2));
      p.style.animationDelay = (Math.random() * (kind === "crumb" ? 60 : 260)).toFixed(0) + "ms";
      if (kind === "spark" && i % 4 !== 0) p.innerHTML = i % 4 === 2 ? HEARTP : SPARK;
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  /* ---------- הפתיחה ----------
     0      החותם נלחץ, קו שבר נמתח עליו, המעטפה רועדת קלות (צליל + רטט)
     150    שני חצאי החותם נופלים עם כובד, פירורי שעווה
     420    הדש נפתח בתלת-ממד וחושף את הבטנה
     1080   הכרטיס מחליק החוצה מהכיס (צליל נייר)
     1820   הכרטיס יוצא קדימה וגדל, המעטפה יורדת ונעלמת, הילה ונצנוצים
            הטקסט נכתב על הכרטיס שורה אחרי שורה (צלצול)
     2700   הכרטיס מוצג (done). opts.hold = כמה זמן להמתין לפני done */
  var STEPS = [["is-split", 150], ["is-open", 420], ["is-out", 1080], ["is-lifted", 1820], ["is-presented", 2700]];
  var ALL = ["is-cracked", "is-split", "is-open", "is-out", "is-lifted", "is-presented", "is-instant"];
  var DURATION = 2700;
  var timers = new WeakMap();
  function open(btn, done, opts) {
    if (btn.classList.contains("is-cracked")) return;
    opts = opts || {};
    var t = [];
    timers.set(btn, t);
    if (reduced()) {
      btn.classList.add.apply(btn.classList, ALL);
      if (done) t.push(setTimeout(done, 60 + (opts.hold || 0)));
      return;
    }
    var fx = btn.querySelector(".env__fx"), sl = btn.querySelector(".env__seal");
    btn.classList.add("is-cracked");
    play("crack"); buzz(14);
    STEPS.forEach(function (s) {
      t.push(setTimeout(function () {
        btn.classList.add(s[0]);
        if (s[0] === "is-split" && sl) particles(sl, 11, "crumb");
        if (s[0] === "is-out") play("paper");
        if (s[0] === "is-lifted") { if (fx) particles(fx, 22, "spark"); play("chime"); buzz(8); }
      }, s[1]));
    });
    if (done) t.push(setTimeout(done, DURATION + (opts.hold || 0)));
  }
  function reset(btn) {
    (timers.get(btn) || []).forEach(clearTimeout);
    btn.classList.remove.apply(btn.classList, ALL);
    Array.prototype.forEach.call(btn.querySelectorAll(".env__p"), function (p) { p.remove(); });
  }
  // מצב סופי בלי אנימציה (לתמונות ולתצוגות סטטיות)
  function show(btn) { btn.classList.add.apply(btn.classList, ALL); }

  var API = { html: html, open: open, reset: reset, show: show, applyPalette: applyPalette, palettes: PALETTES, liners: LINERS, seal: seal, duration: DURATION, sound: true, sfx: play };
  window.MatanotEnvelope = API;
})();
