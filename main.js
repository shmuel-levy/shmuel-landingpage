/* בונה את הדף מתוך config.js ומפעיל את האינטראקציות.
   כדי לשנות טקסטים, מחירים או קישורים: config.js. */

/* בחירת מקום לכפתור "לא" שבורח: נקודות קבועות בשולי האזור,
   רק כאלה שלא נוגעות בכפתור "כן" (כולל הגודל שאליו הוא יגדל) */
window.MatanotRun = {
  pick: function (area, no, yes, yesScale, last) {
    var aw = area.clientWidth, ah = area.clientHeight;
    var bw = no.offsetWidth, bh = no.offsetHeight;
    var yw = yes.offsetWidth * yesScale, yh = yes.offsetHeight * yesScale;
    var ycx = yes.offsetLeft + yes.offsetWidth / 2, ycy = yes.offsetTop + yes.offsetHeight / 2;
    var Y = { l: ycx - yw / 2 - 10, r: ycx + yw / 2 + 10, t: ycy - yh / 2 - 8, b: ycy + yh / 2 + 8 };
    var mx = Math.max(0, aw - bw), my = Math.max(0, ah - bh);
    var spots = [[0, 0], [mx, 0], [0, my], [mx, my], [mx / 2, 0], [mx / 2, my], [0, my / 2], [mx, my / 2]];
    var ok = [];
    spots.forEach(function (s, i) {
      var hit = s[0] < Y.r && s[0] + bw > Y.l && s[1] < Y.b && s[1] + bh > Y.t;
      if (!hit && i !== last) ok.push(i);
    });
    if (!ok.length) ok = [last === 0 ? 3 : 0];
    var i = ok[Math.floor(Math.random() * ok.length)];
    return { i: i, x: spots[i][0], y: spots[i][1] };
  },
};

(function () {
  "use strict";
  var S = window.SITE;
  var ENV = window.MatanotEnvelope;
  var root = document.documentElement;
  function motionOff() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("a11y-no-motion");
  }
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- עזרים ---------- */
  function $(sel) { return document.querySelector(sel); }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, S);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ico(n, c) { return window.MatanotIcons.svg(n, c); }
  function waLink(msg) {
    return "https://wa.me/" + S.contact.phoneIntl + "?text=" + encodeURIComponent(msg || S.whatsappMessage);
  }
  var NEW_TAB = '<span class="sr-only"> (נפתח בחלון חדש)</span>';
  function stagger(i, step) { return ' style="--d:' + i * (step || 80) + 'ms"'; }
  function kicker(k) { return k ? '<p class="kicker-pill">' + esc(k) + "</p>" : ""; }

  /* ---------- מבצע ---------- */
  var P = S.promo;
  var promoEnd = P ? new Date(P.endsAt).getTime() : 0;
  var promo = P && P.active && Date.now() < promoEnd ? P : null;
  function planPrice(p) { return promo ? Math.round(p.price * (1 - promo.percent / 100)) : p.price; }
  function left() {
    var ms = Math.max(0, promoEnd - Date.now());
    return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24 };
  }
  function leftText() {
    var l = left();
    if (l.d > 1) return "עוד " + l.d + " ימים";
    if (l.d === 1) return "עוד יום ו-" + l.h + " שעות";
    return "עוד " + Math.max(1, l.h) + " שעות";
  }

  /* ---------- טקסטים ---------- */
  document.querySelectorAll("[data-t]").forEach(function (el) {
    var v = get(el.getAttribute("data-t"));
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-kicker]").forEach(function (el) {
    var v = get(el.getAttribute("data-kicker"));
    if (v) el.outerHTML = kicker(v); else el.remove();
  });

  /* ---------- ניווט, באנר, קישורי הזמנה ---------- */
  $("#nav").innerHTML = S.nav.map(function (n) {
    return '<li><a href="' + esc(n.href) + '">' + esc(n.label) + "</a></li>";
  }).join("");

  var banner = $("#banner");
  if (promo) {
    banner.innerHTML = '<div class="container banner__inner">' + ico("percent", "banner__ico") +
      "<span><b>" + esc(promo.title) + ":</b> " + esc(promo.text) + ' <span class="banner__left">· ' + leftText() + "</span></span>" +
      '<a class="banner__link" href="order.html">לבנות סקיצה' + ico("arrow-left") + "</a></div>";
    banner.hidden = false;
  } else if (S.banner && S.banner.show) {
    banner.innerHTML = '<div class="container banner__inner">' + ico("sparkle", "banner__ico") + "<span>" + esc(S.banner.text) + '</span><a class="banner__link" href="order.html">לטופס' + ico("arrow-left") + "</a></div>";
    banner.hidden = false;
  }

  document.querySelectorAll("[data-order]").forEach(function (a) { a.href = "order.html"; });
  $("#waFloat").href = waLink();
  document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = waLink(); });
  $("#callBtn").href = "tel:+" + S.contact.phoneIntl;
  $("#callText").textContent = S.contact.phoneDisplay;
  $("#year").textContent = new Date().getFullYear();

  var contact = [
    '<li><a href="tel:+' + esc(S.contact.phoneIntl) + '">' + ico("call") + esc(S.contact.phoneDisplay) + "</a></li>",
    '<li><a class="footer__wa" href="' + esc(waLink()) + '" target="_blank" rel="noopener"><span class="wa-icon" aria-hidden="true">' + ico("whatsapp") + "</span>ווטסאפ" + NEW_TAB + "</a></li>",
    '<li><a href="order.html">' + ico("wand") + "טופס הזמנה</a></li>",
  ];
  if (S.contact.email) contact.push('<li><a href="mailto:' + esc(S.contact.email) + '">' + ico("envelope") + esc(S.contact.email) + "</a></li>");
  $("#footerContact").innerHTML = contact.join("");

  /* ---------- HERO ---------- */
  // הכותרת: מילה אחרי מילה
  document.querySelectorAll(".hero__title [data-t]").forEach(function (el, line) {
    var words = el.textContent.split(" ");
    el.innerHTML = words.map(function (w, i) { return '<span class="w" style="--i:' + (line * 3 + i) + '">' + esc(w) + "</span>"; }).join(" ");
  });
  $("#proof").innerHTML = S.hero.proof.map(function (p) {
    return "<li>" + ico("check") + esc(p) + "</li>";
  }).join("");

  /* ---------- רצועת אירועים ---------- */
  var icons = ["heart", "sparkle", "star", "envelope"];
  var occ = S.occasions.map(function (o, i) { return "<span>" + esc(o) + "</span>" + ico(icons[i % icons.length], "marquee__ico"); }).join("");
  $("#marquee").innerHTML = '<div class="marquee__group">' + occ + '</div><div class="marquee__group" aria-hidden="true">' + occ + "</div>";
  var mq = $(".marquee"), mqBtn = $("#marqueePause");
  mqBtn.addEventListener("click", function () {
    var paused = mq.classList.toggle("is-paused");
    mqBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    mqBtn.innerHTML = ico(paused ? "play" : "pause");
    mqBtn.setAttribute("aria-label", paused ? "הפעלת הרצועה הנעה" : "עצירת הרצועה הנעה");
  });

  /* ---------- איך זה עובד ---------- */
  $("#steps").innerHTML = S.steps.items.map(function (s, i) {
    return '<li class="step reveal"' + stagger(i, 140) + ">" +
      '<span class="step__num" aria-hidden="true">0' + (i + 1) + "</span>" +
      '<span class="tile tile--' + (i + 1) + '" aria-hidden="true">' + ico(s.icon) + "</span>" +
      "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
  }).join("");

  /* ---------- בונה הסקיצות (הדגמה) ---------- */
  var B = S.builder;
  $("#builderPoints").innerHTML = B.points.map(function (p) { return "<li>" + ico("check") + esc(p) + "</li>"; }).join("");
  var PRESETS = [
    { to: "נועה", kind: "בן / בת זוג", pal: "blush", liner: "hearts", mark: "נ", icon: "hearts", title: "שאלה קטנה" },
    { to: "אמא", kind: "הורים ומשפחה", pal: "ink", liner: "stripes", mark: "א", icon: "home", title: "מכל הלב" },
    { to: "שירה", kind: "יום הולדת", pal: "gold", liner: "confetti", mark: "ש", icon: "cake", title: "מזל טוב!" },
    { to: "מירי הגננת", kind: "תודה והוקרה", pal: "mint", liner: "dots", mark: "מ", icon: "hand-heart", title: "תודה!" },
    { to: "דניאל", kind: "הצעת נישואין", pal: "lilac", liner: "dots", mark: "ד", icon: "ring", title: "יש לי שאלה" },
  ];
  var swHost = $("#mockSw");
  swHost.innerHTML = Object.keys(ENV.palettes).map(function (k) { return '<i data-pal="' + k + '" style="background:' + ENV.palettes[k].swatch[1] + '"></i>'; }).join("");
  var preset = 0, typingTimer = null;
  function showPreset(n, instant) {
    var p = PRESETS[n % PRESETS.length];
    var host = $("#mockEnv");
    host.innerHTML = ENV.html({ label: "", mark: p.mark, liner: p.liner, cardIcon: p.icon, cardTitle: p.title, cardText: "ל" + p.to, postmark: false });
    var btn = host.firstChild;
    btn.setAttribute("tabindex", "-1"); btn.setAttribute("aria-hidden", "true");
    ENV.applyPalette(btn, p.pal);
    $("#mockScreen").style.background = ENV.palettes[p.pal].theme.bg;
    $("#mockKind").textContent = p.kind;
    $("#mockTo2").textContent = "ל" + p.to;
    swHost.querySelectorAll("i").forEach(function (i) { i.classList.toggle("is-on", i.getAttribute("data-pal") === p.pal); });
    var name = $("#mockTo");
    clearTimeout(typingTimer);
    if (instant) { name.textContent = p.to; return; }
    var k = 0;
    (function type() { name.textContent = p.to.slice(0, ++k); if (k < p.to.length) typingTimer = setTimeout(type, 90); })();
    $("#mock").classList.remove("is-swap"); void $("#mock").offsetWidth; $("#mock").classList.add("is-swap");
  }
  showPreset(0, true);
  var mockTimer = null;
  function mockPlay(on) {
    clearInterval(mockTimer);
    if (on && !motionOff()) mockTimer = setInterval(function () { showPreset(++preset); }, 3400);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { mockPlay(en[0].isIntersecting); }, { threshold: 0.3 }).observe($("#mock"));
  }

  /* ---------- דוגמאות + סינון ---------- */
  var E = S.examples;
  var tabs = $("#tabs");
  tabs.setAttribute("role", "group");
  tabs.innerHTML = E.categories.map(function (c, i) {
    return '<button type="button" class="tab" data-cat="' + esc(c.id) + '" aria-pressed="' + (i === 0) + '">' + (c.icon ? ico(c.icon) : "") + esc(c.label) + "</button>";
  }).join("");

  function catLabel(id) {
    var c = E.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : "";
  }
  $("#examplesList").innerHTML = E.items.map(function (e, i) {
    return '<article class="example reveal tone-' + esc(e.tone) + '" data-cat="' + esc(e.cat) + '"' + stagger(i % 4, 90) + ">" +
      '<div class="example__thumb" aria-hidden="true"><span class="example__glare"></span>' +
      '<div class="mini-phone"><img src="' + esc(e.shot) + '" alt="" width="390" height="760" loading="lazy" decoding="async"></div>' +
      '<span class="example__badge">' + ico(e.icon) + "</span></div>" +
      '<div class="example__body"><span class="tag">' + esc(catLabel(e.cat)) + "</span>" +
      "<h3>" + esc(e.title) + "</h3><p>" + esc(e.text) + "</p>" +
      '<ul class="pills" aria-label="מה יש בפנים">' + e.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<div class="example__links"><a class="example__link" href="' + esc(e.url) + '">פתחו את הדוגמה' + ico("arrow-left") + '<span class="sr-only">: ' + esc(e.title) + "</span></a>" +
      '<a class="example__want" href="order.html?type=' + esc(e.order) + '">רוצה כזה<span class="sr-only">: ' + esc(e.title) + "</span></a></div></div></article>";
  }).join("");

  tabs.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".tab");
    if (!btn) return;
    var cat = btn.dataset.cat;
    tabs.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-pressed", t === btn ? "true" : "false"); });
    var shown = 0;
    document.querySelectorAll(".example").forEach(function (card) {
      var show = cat === "all" || card.dataset.cat === cat;
      card.hidden = !show;
      if (show) { shown++; card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop", "is-visible"); }
    });
    $("#exStatus").textContent = "מוצגות " + shown + " דוגמאות";
    $("#examplesList").scrollTo({ left: 0, behavior: motionOff() ? "auto" : "smooth" });
  });

  // הטיה תלת-ממדית לכרטיסים (רק בעכבר)
  function tilt(selector, max) {
    if (!finePointer) return;
    document.querySelectorAll(selector).forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        if (motionOff()) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", (-y * max).toFixed(2) + "deg");
        card.style.setProperty("--ry", (x * max).toFixed(2) + "deg");
        card.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(0) + "%");
        card.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(0) + "%");
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
        card.classList.remove("is-tilting");
      });
    });
  }
  tilt(".example", 7);

  /* ---------- ארגז כלים ---------- */
  $("#toolboxList").innerHTML = S.toolbox.items.map(function (t, i) {
    return '<li class="tool reveal"' + stagger(i, 45) + '><span class="tile tile--' + ((i % 6) + 1) + '" aria-hidden="true">' + ico(t.icon) + "</span>" + esc(t.title) + "</li>";
  }).join("");

  /* ---------- עליי ---------- */
  var A = S.about;
  $("#aboutParas").innerHTML = A.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  $("#stats").innerHTML = A.stats.map(function (s) {
    return '<div class="stat"><dt>' + esc(s.label) + '</dt><dd><span class="stat__num" data-count="' + esc(s.num) + '">' + esc(s.num) + "</span> " + esc(s.unit) + "</dd></div>";
  }).join("");
  $("#chips").innerHTML = A.chips.map(function (c, i) { return '<li class="chip chip--' + i + '" lang="en">' + esc(c) + "</li>"; }).join("");
  $("#projects").innerHTML = A.projects.map(function (p, i) {
    return '<li class="project reveal"' + stagger(i, 100) + '><h4 lang="en">' + esc(p.name) + "</h4><p>" + esc(p.desc) + "</p>" +
      '<ul class="pills pills--ink">' + p.tags.map(function (t) { return '<li lang="en">' + esc(t) + "</li>"; }).join("") + "</ul></li>";
  }).join("");

  /* ---------- למה ---------- */
  $("#whyList").innerHTML = S.why.items.map(function (w, i) {
    return '<li class="why__item reveal"' + stagger(i) + '><span class="tile tile--' + (i + 2) + '" aria-hidden="true">' + ico(w.icon) + "</span>" +
      "<h3>" + esc(w.title) + "</h3><p>" + esc(w.text) + "</p></li>";
  }).join("");

  /* ---------- המלצות ---------- */
  var T = S.testimonials;
  $("#testimonialsList").innerHTML = T.items.map(function (t, i) {
    return '<li class="review reveal"' + stagger(i, 140) + ">" +
      '<p class="review__time"><span class="review__clock">' + esc(t.time) + "</span>" + esc(t.step) + "</p>" +
      '<figure class="review__card">' +
      '<button type="button" class="review__shot" data-full="' + esc(t.image) + '" data-alt="' + esc(t.alt) + '">' +
      '<img src="' + esc(t.image) + '" alt="' + esc(t.alt) + '" width="' + esc(t.w) + '" height="' + esc(t.h) + '" loading="lazy" decoding="async" />' +
      '<span class="review__zoom" aria-hidden="true">' + ico("search") + 'להגדלה</span><span class="sr-only">הגדלת צילום המסך</span></button>' +
      '<figcaption><blockquote><p>' + esc(t.quote) + '</p></blockquote><span class="review__who">עדי · לקוחה אמיתית</span></figcaption>' +
      "</figure></li>";
  }).join("");

  // הגדלת צילום מסך
  var lb = $("#lightbox"), lbImg = $("#lightboxImg"), lastShot = null;
  $("#testimonialsList").addEventListener("click", function (e) {
    var b = e.target.closest(".review__shot");
    if (!b) return;
    lastShot = b;
    lbImg.src = b.dataset.full;
    lbImg.alt = b.dataset.alt;
    if (lb.showModal) lb.showModal(); else window.open(b.dataset.full, "_blank");
  });
  $("#lightboxClose").addEventListener("click", function () { lb.close(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener("close", function () { if (lastShot) lastShot.focus(); });

  /* ---------- מחירים ---------- */
  var PR = S.pricing;
  if (promo) {
    $("#promoStrip").hidden = false;
    $("#promoStrip").innerHTML = '<span class="promo__tag">-' + promo.percent + "%</span>" +
      '<span class="promo__text"><b>' + esc(promo.title) + "</b>" + esc(promo.text) + " עד " + esc(promo.endsLabel) + "</span>" +
      '<span class="promo__left">' + ico("clock") + '<span id="promoLeft">' + leftText() + "</span></span>";
  }
  $("#plans").innerHTML = PR.plans.map(function (p, i) {
    var now = planPrice(p);
    return '<article class="plan reveal' + (p.popular ? " plan--popular" : "") + '"' + stagger(i, 120) + ">" +
      (p.popular ? '<span class="plan__badge">' + ico("star") + esc(p.popularLabel) + "</span>" : "") +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="plan__price">' + (promo ? '<del class="plan__old"><span class="sr-only">במקום </span>' + p.price + " " + esc(PR.currency) + "</del>" : "") +
      '<span class="plan__now"><span class="plan__num">' + now + '</span><span class="plan__cur">' + esc(PR.currency) + "</span></span>" +
      (promo ? '<span class="plan__save">חוסכים ' + (p.price - now) + " " + esc(PR.currency) + "</span>" : "") + "</p>" +
      '<p class="plan__desc">' + esc(p.description) + "</p>" +
      "<ul>" + p.features.map(function (f) { return "<li>" + ico("check") + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<a class="btn ' + (p.popular ? "btn--primary" : "btn--outline") + ' btn--block" href="order.html?plan=' + esc(p.id) + '">' + esc(p.cta) + ico("arrow-left") + "</a></article>";
  }).join("");
  $("#addons").innerHTML = PR.addons.map(function (a) {
    return "<li>" + ico(a.icon, "addons__ico") + "<span>" + esc(a.name) + "</span><strong>+" + a.price + " " + esc(PR.currency) + "</strong></li>";
  }).join("");
  $("#payNote").innerHTML = ico("card") + esc(PR.payNote);

  /* ---------- שאלות ---------- */
  $("#faqList").innerHTML = S.faq.items.map(function (f, i) {
    return '<details class="faq__item reveal"' + stagger(i, 50) + "><summary>" + esc(f.q) + '<span class="faq__plus" aria-hidden="true">' + ico("plus") + "</span></summary><p>" + esc(f.a) + "</p></details>";
  }).join("");

  // ספירה לאחור של המבצע: מתעדכנת כל דקה
  if (promo) setInterval(function () {
    var t = leftText();
    var a = $("#promoLeft"), b = $(".banner__left");
    if (a) a.textContent = t;
    if (b) b.textContent = "· " + t;
  }, 60000);

  /* ---------- הופעה בגלילה ---------- */
  function revealAll() { document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); }); }
  if ("IntersectionObserver" in window && !motionOff()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else { revealAll(); }

  /* ---------- הדר, פס התקדמות וווטסאפ צף ---------- */
  var header = $("#header"), wa = $("#waFloat"), hero = $("#top"), bar = $("#scrollBar");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    wa.classList.toggle("is-shown", y > hero.offsetHeight * 0.7);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
    if (!motionOff()) root.style.setProperty("--hero-y", Math.min(y, 900).toFixed(0));
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- כפתורים מגנטיים (רק בעכבר) ---------- */
  if (finePointer) {
    document.querySelectorAll(".btn--magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        if (motionOff()) return;
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
  }

  /* =========================================================
     פרופיל: "התמונה נבנית" כמו אתר
     ========================================================= */
  var profile = $("#profile");
  var codeEl = $("#codeType");
  var built = false;
  function typeCode(text, done) {
    if (motionOff()) { codeEl.textContent = text; done && done(); return; }
    var i = 0;
    (function tick() {
      codeEl.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 38 + Math.random() * 40);
      else if (done) done();
    })();
  }
  function countUp() {
    document.querySelectorAll(".stat__num").forEach(function (el) {
      var raw = el.dataset.count, n = parseInt(raw, 10), suffix = raw.replace(/^\d+/, "");
      if (isNaN(n) || motionOff()) return;
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1200);
        el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  function build() {
    if (built) return;
    built = true;
    profile.classList.add("is-built");
    setTimeout(function () { profile.classList.add("is-ready"); }, motionOff() ? 0 : 1600);
    setTimeout(function () { typeCode(A.codeLine); }, motionOff() ? 0 : 1500);
    countUp();
  }
  if ("IntersectionObserver" in window && !motionOff()) {
    var pio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { build(); pio.disconnect(); }
    }, { threshold: 0.3 });
    pio.observe(profile);
  } else { build(); }

  if (finePointer) {
    profile.addEventListener("pointermove", function (e) {
      if (motionOff()) return;
      var r = profile.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      profile.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      profile.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
    });
    profile.addEventListener("pointerleave", function () {
      profile.style.setProperty("--rx", "0deg");
      profile.style.setProperty("--ry", "0deg");
    });
  }

  /* =========================================================
     ההדגמה החיה ב-HERO
     ========================================================= */
  var D = S.hero.demo;
  var phone = $("#demo"), area = $("#choiceArea");
  var noBtn = $("#noBtn"), yesBtn = $("#yesBtn"), confetti = $("#confetti"), status = $("#demoStatus");
  var escapes = 0;
  var envHost = $("#envHost");
  function mountEnvelope() {
    envHost.innerHTML = ENV.html({ label: "פתיחת המעטפה", mark: "M", liner: "hearts", cardIcon: "hearts", cardTitle: D.cardTitle, cardText: D.cardText });
    var env = envHost.firstChild;
    env.id = "envelope";
    ENV.applyPalette(env, "ink");
    env.addEventListener("click", function () {
      if (env.classList.contains("is-cracked")) return;
      status.textContent = "המעטפה נפתחת";
      phone.querySelector(".screen__hint").classList.add("is-hidden");
      ENV.open(env, function () { show("question", "#yesBtn"); status.textContent = D.question; });
    });
  }
  mountEnvelope();

  function show(name, focusSel) {
    phone.querySelectorAll(".screen").forEach(function (s) {
      var on = s.getAttribute("data-screen") === name;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      s.inert = !on;
    });
    if (focusSel) setTimeout(function () { var f = phone.querySelector(focusSel); f && f.focus({ preventScroll: true }); }, 50);
  }
  show("envelope");

  var lastSpot = -1;
  function runAway(e) {
    if (e) e.preventDefault();
    escapes++;
    var yesScale = Math.min(1.3, 1 + escapes * 0.05);
    noBtn.classList.add("is-running"); // קודם יוצא מהזרימה, כדי ש"כן" יתמקם במרכז
    noBtn.textContent = D.noTexts[(escapes - 1) % D.noTexts.length];
    var spot = window.MatanotRun.pick(area, noBtn, yesBtn, yesScale, lastSpot);
    lastSpot = spot.i;
    noBtn.style.left = spot.x + "px";
    noBtn.style.top = spot.y + "px";
    noBtn.style.transform = "scale(" + Math.max(0.6, 1 - escapes * 0.06) + ")";
    yesBtn.style.transform = "scale(" + yesScale + ")";
  }
  noBtn.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") runAway(e); });
  noBtn.addEventListener("pointerdown", runAway);
  noBtn.addEventListener("click", function (e) { runAway(e); status.textContent = "הכפתור ברח. נשאר רק כן"; });

  yesBtn.addEventListener("click", function () {
    show("success", ".link-btn");
    status.textContent = D.successTitle;
    burst(confetti);
  });

  $("#replayBtn").addEventListener("click", function () {
    escapes = 0; lastSpot = -1;
    phone.querySelector(".screen__hint").classList.remove("is-hidden");
    mountEnvelope();
    noBtn.classList.remove("is-running");
    noBtn.removeAttribute("style");
    yesBtn.removeAttribute("style");
    noBtn.textContent = D.no;
    show("envelope", "#envelope");
  });

  var SHAPES = [
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/></svg>',
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c.8 5.6 3 8.3 9 9.5-6 1.2-8.2 3.9-9 9.5-.8-5.6-3-8.3-9-9.5 6-1.2 8.2-3.9 9-9.5z"/></svg>',
  ];
  function burst(host) {
    if (motionOff()) return;
    var colors = ["#F5A9C0", "#1F5BD1", "#FFD6A5", "#E26D93", "#9B7FE0", "#3BB58A", "#FFFFFF"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 56; i++) {
      var s = document.createElement("span");
      var c = colors[i % colors.length];
      if (i % 5 === 0) { s.className = "confetti__bit is-shape"; s.innerHTML = SHAPES[i % 2]; s.style.color = c; }
      else { s.className = "confetti__bit" + (i % 3 === 0 ? " is-dot" : ""); s.style.background = c; }
      var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 150;
      s.style.setProperty("--x", Math.cos(ang) * dist + "px");
      s.style.setProperty("--y", Math.sin(ang) * dist - 60 + "px");
      s.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
      s.style.animationDelay = Math.random() * 120 + "ms";
      frag.appendChild(s);
    }
    host.appendChild(frag);
    setTimeout(function () { host.innerHTML = ""; }, 1900);
  }
})();
