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
  var root = document.documentElement;
  function motionOff() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("a11y-no-motion");
  }

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
  function waLink(msg) {
    return "https://wa.me/" + S.contact.phoneIntl + "?text=" + encodeURIComponent(msg || S.whatsappMessage);
  }
  function orderLink(msg) { return S.orderFormUrl || waLink(msg); }
  var NEW_TAB = '<span class="sr-only"> (נפתח בחלון חדש)</span>';
  function stagger(i, step) { return ' style="--d:' + i * (step || 80) + 'ms"'; }

  /* ---------- טקסטים ---------- */
  document.querySelectorAll("[data-t]").forEach(function (el) {
    var v = get(el.getAttribute("data-t"));
    if (v != null) el.textContent = v;
  });

  /* ---------- ניווט, באנר, קישורי הזמנה ---------- */
  $("#nav").innerHTML = S.nav.map(function (n) {
    return '<li><a href="' + esc(n.href) + '">' + esc(n.label) + "</a></li>";
  }).join("");

  if (S.banner && S.banner.show) { $("#banner").textContent = S.banner.text; $("#banner").hidden = false; }

  document.querySelectorAll("[data-order]").forEach(function (a) {
    a.href = orderLink();
    a.target = "_blank";
    a.rel = "noopener";
    a.insertAdjacentHTML("beforeend", NEW_TAB);
  });
  $("#waFloat").href = waLink();
  document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = waLink(); });
  $("#callBtn").href = "tel:+" + S.contact.phoneIntl;
  $("#callText").textContent = S.contact.phoneDisplay;
  $("#year").textContent = new Date().getFullYear();

  var contact = [
    '<li><a href="tel:+' + esc(S.contact.phoneIntl) + '">📞 ' + esc(S.contact.phoneDisplay) + "</a></li>",
    '<li><a class="footer__wa" href="' + esc(waLink()) + '" target="_blank" rel="noopener"><span class="wa-icon" aria-hidden="true"><svg><use href="#i-wa"/></svg></span>ווטסאפ' + NEW_TAB + "</a></li>",
  ];
  if (S.contact.email) contact.push('<li><a href="mailto:' + esc(S.contact.email) + '">✉️ ' + esc(S.contact.email) + "</a></li>");
  if (S.contact.instagram) contact.push('<li><a href="' + esc(S.contact.instagram) + '" target="_blank" rel="noopener">📸 אינסטגרם' + NEW_TAB + "</a></li>");
  $("#footerContact").innerHTML = contact.join("");

  /* ---------- HERO ---------- */
  $("#proof").innerHTML = S.hero.proof.map(function (p) {
    return '<li><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(p) + "</li>";
  }).join("");

  /* ---------- רצועת אירועים ---------- */
  var occ = S.occasions.map(function (o) { return "<span>" + esc(o) + '</span><i aria-hidden="true">♥</i>'; }).join("");
  $("#marquee").innerHTML = '<div class="marquee__group">' + occ + '</div><div class="marquee__group" aria-hidden="true">' + occ + "</div>";

  /* ---------- איך זה עובד ---------- */
  $("#steps").innerHTML = S.steps.items.map(function (s, i) {
    return '<li class="step reveal"' + stagger(i, 120) + ">" +
      '<span class="step__num" aria-hidden="true">' + (i + 1) + "</span>" +
      '<span class="icon-bubble" aria-hidden="true">' + esc(s.icon) + "</span>" +
      "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
  }).join("");

  /* ---------- דוגמאות + סינון ---------- */
  var E = S.examples;
  var tabs = $("#tabs");
  tabs.setAttribute("role", "group");
  tabs.innerHTML = E.categories.map(function (c, i) {
    return '<button type="button" class="tab" data-cat="' + esc(c.id) + '" aria-pressed="' + (i === 0) + '">' + esc(c.label) + "</button>";
  }).join("");

  function catLabel(id) {
    var c = E.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : "";
  }
  $("#examplesList").innerHTML = E.items.map(function (e, i) {
    var link = e.url
      ? '<a class="example__link" href="' + esc(e.url) + '">פתחו את הדוגמה <span aria-hidden="true">←</span><span class="sr-only">: ' + esc(e.title) + "</span></a>"
      : '<span class="example__link is-soon">דוגמה בקרוב ✨</span>';
    return '<article class="example reveal tone-' + esc(e.tone) + '" data-cat="' + esc(e.cat) + '"' + stagger(i % 4, 90) + ">" +
      '<div class="example__thumb" aria-hidden="true"><div class="mini-phone"><span class="mini-phone__emoji">' + esc(e.emoji) + "</span>" +
      '<span class="mini-phone__line"></span><span class="mini-phone__line short"></span><span class="mini-phone__btn"></span></div></div>' +
      '<div class="example__body"><span class="tag">' + esc(catLabel(e.cat)) + "</span>" +
      "<h3>" + esc(e.title) + "</h3><p>" + esc(e.text) + "</p>" +
      '<ul class="pills" aria-label="מה יש בפנים">' + e.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      link + "</div></article>";
  }).join("");

  tabs.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".tab");
    if (!btn) return;
    var cat = btn.dataset.cat;
    tabs.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-pressed", t === btn ? "true" : "false"); });
    document.querySelectorAll(".example").forEach(function (card) {
      var show = cat === "all" || card.dataset.cat === cat;
      card.hidden = !show;
      if (show) { card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop", "is-visible"); }
    });
    $("#examplesList").scrollTo({ left: 0, behavior: "smooth" });
  });

  /* ---------- ארגז כלים ---------- */
  $("#toolboxList").innerHTML = S.toolbox.items.map(function (t, i) {
    return '<li class="tool reveal"' + stagger(i, 45) + '><span aria-hidden="true">' + esc(t.icon) + "</span>" + esc(t.title) + "</li>";
  }).join("");

  /* ---------- עליי ---------- */
  var A = S.about;
  $("#aboutParas").innerHTML = A.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  $("#stats").innerHTML = A.stats.map(function (s) {
    return '<div class="stat"><dt>' + esc(s.label) + '</dt><dd><span class="stat__num" data-count="' + esc(s.num) + '">' + esc(s.num) + "</span> " + esc(s.unit) + "</dd></div>";
  }).join("");
  $("#chips").innerHTML = A.chips.map(function (c, i) { return '<li class="chip chip--' + i + '">' + esc(c) + "</li>"; }).join("");
  $("#projects").innerHTML = A.projects.map(function (p, i) {
    return '<li class="project reveal"' + stagger(i, 100) + "><h4>" + esc(p.name) + "</h4><p>" + esc(p.desc) + "</p>" +
      '<ul class="pills pills--ink">' + p.tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></li>";
  }).join("");
  var links = [];
  if (S.contact.linkedin) links.push('<a href="' + esc(S.contact.linkedin) + '" target="_blank" rel="noopener">לינקדאין' + NEW_TAB + "</a>");
  if (S.contact.github) links.push('<a href="' + esc(S.contact.github) + '" target="_blank" rel="noopener">גיטהאב' + NEW_TAB + "</a>");
  $("#aboutLinks").innerHTML = links.join(" · ");

  /* ---------- למה ---------- */
  $("#whyList").innerHTML = S.why.items.map(function (w, i) {
    return '<li class="why__item reveal"' + stagger(i) + '><span class="icon-bubble" aria-hidden="true">' + esc(w.icon) + "</span>" +
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
      '<span class="review__zoom" aria-hidden="true">🔍 להגדלה</span><span class="sr-only">הגדלת צילום המסך</span></button>' +
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
  var P = S.pricing;
  $("#plans").innerHTML = P.plans.map(function (p, i) {
    return '<article class="plan reveal' + (p.popular ? " plan--popular" : "") + '"' + stagger(i, 120) + ">" +
      (p.popular ? '<span class="plan__badge">' + esc(p.popularLabel) + "</span>" : "") +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="plan__price"><span class="plan__num">' + esc(p.price) + '</span><span class="plan__cur">' + esc(P.currency) + "</span></p>" +
      '<p class="plan__desc">' + esc(p.description) + "</p>" +
      "<ul>" + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<a class="btn ' + (p.popular ? "btn--primary" : "btn--outline") + ' btn--block" target="_blank" rel="noopener" href="' +
      esc(orderLink(p.whatsappMessage)) + '">' + esc(p.cta) + NEW_TAB + "</a></article>";
  }).join("");
  $("#addons").innerHTML = P.addons.map(function (a) {
    return "<li><span>" + esc(a.name) + "</span><strong>" + esc(a.price) + "</strong></li>";
  }).join("");

  /* ---------- שאלות ---------- */
  $("#faqList").innerHTML = S.faq.items.map(function (f, i) {
    return '<details class="faq__item reveal"' + stagger(i, 50) + "><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
  }).join("");

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

  /* ---------- הדר מצל בגלילה + ווטסאפ צף רק אחרי ה-HERO ---------- */
  var header = $("#header"), wa = $("#waFloat"), hero = $("#top");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    wa.classList.toggle("is-shown", window.scrollY > hero.offsetHeight * 0.7);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  // הטיה תלת-ממדית עדינה לפי העכבר
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
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
  var phone = $("#demo"), envelope = $("#envelope"), area = $("#choiceArea");
  var noBtn = $("#noBtn"), yesBtn = $("#yesBtn"), confetti = $("#confetti"), status = $("#demoStatus");
  var escapes = 0;

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

  envelope.addEventListener("click", function () {
    if (envelope.classList.contains("is-open")) return;
    envelope.classList.add("is-open");
    status.textContent = "המעטפה נפתחה. " + D.question;
    setTimeout(function () { show("question", "#yesBtn"); }, motionOff() ? 0 : 1150);
  });

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
  noBtn.addEventListener("click", function (e) { runAway(e); status.textContent = "הכפתור ברח 😉 נשאר רק כן"; });

  yesBtn.addEventListener("click", function () {
    show("success", ".link-btn");
    status.textContent = D.successTitle;
    burst(confetti);
  });

  $("#replayBtn").addEventListener("click", function () {
    escapes = 0; lastSpot = -1;
    envelope.classList.remove("is-open");
    noBtn.classList.remove("is-running");
    noBtn.removeAttribute("style");
    yesBtn.removeAttribute("style");
    noBtn.textContent = D.no;
    show("envelope", "#envelope");
  });

  function burst(host) {
    if (motionOff()) return;
    var bits = ["💖", "💙", "✨", "💕", "💌"];
    var colors = ["#F5A9C0", "#1F5BD1", "#FFD6A5", "#E26D93", "#BFD3FF", "#FFFFFF"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 50; i++) {
      var s = document.createElement("span");
      var emoji = i % 3 === 0;
      s.className = "confetti__bit" + (emoji ? " is-emoji" : "");
      if (emoji) s.textContent = bits[i % bits.length]; else s.style.background = colors[i % colors.length];
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
