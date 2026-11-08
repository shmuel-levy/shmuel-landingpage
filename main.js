/* בונה את הדף מתוך config.js ומפעיל את האינטראקציות.
   כדי לשנות טקסטים, מחירים או קישורים: config.js. */

/* בחירת מקום לכפתור "לא" שבורח: נקודות קבועות בשולי האזור,
   רק כאלה שלא נוגעות בכפתור "כן" (כולל הגודל שאליו הוא יגדל) */
window.MatanotRun = {
  pick: function (area, no, yes, yesScale, last, noScale) {
    var aw = area.clientWidth, ah = area.clientHeight;
    var bw = no.offsetWidth, bh = no.offsetHeight;
    var yw = yes.offsetWidth * yesScale, yh = yes.offsetHeight * yesScale;
    var ycx = yes.offsetLeft + yes.offsetWidth / 2, ycy = yes.offsetTop + yes.offsetHeight / 2;
    var Y = { l: ycx - yw / 2 - 10, r: ycx + yw / 2 + 10, t: ycy - yh / 2 - 8, b: ycy + yh / 2 + 8 };
    var mx = Math.max(0, aw - bw), my = Math.max(0, ah - bh);
    var spots = [[0, 0], [mx, 0], [0, my], [mx, my], [mx / 2, 0], [mx / 2, my], [0, my / 2], [mx, my / 2]];
    var ok = [];
    spots.forEach(function (s, i) {
      var ix = (bw * (1 - (noScale || 1))) / 2, iy = (bh * (1 - (noScale || 1))) / 2;
      var hit = s[0] + ix < Y.r && s[0] + bw - ix > Y.l && s[1] + iy < Y.b && s[1] + bh - iy > Y.t;
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

  /* ---------- המבצע: חלון קופץ עדין במקום פס בראש האתר ----------
     כל כמה זמן: config.js → promo.popupEvery ("load" = בכל כניסה ורענון, "session" = פעם בביקור, "week" = פעם בשבוע).
     מופיע אחרי 7 שניות או כשגוללים לדוגמאות. מי שמשחק בהדגמה בטלפון לא יקבל חלון באמצע: הוא יחכה לגלילה.
     מעטפה קטנה נפתחת וחושפת את ההנחה. Esc, לחיצה בחוץ או "אולי אחר כך" סוגרים */
  (function promoPop() {
    var pop = $("#promoPop");
    if (!promo || !pop || typeof pop.showModal !== "function") return;
    var KEY = "matanot-promo-pop", seen = 0, every = promo.popupEvery || "load";
    try { seen = every === "session" ? +sessionStorage.getItem(KEY) || 0 : every === "week" ? +localStorage.getItem(KEY) || 0 : 0; } catch (e) { /* */ }
    // ?promo=1 בכתובת = מציג תמיד, אחרי 1.5 שניות (לבדיקה)
    var force = /[?&]promo=1/.test(location.search);
    if (!force && (seen || /[?&](src|utm_source)=promo/.test(location.search))) {
      if (every !== "week" || Date.now() - seen < 7 * 864e5) return;
    }
    var host = $("#ppopEnv");
    host.innerHTML = ENV.html({ label: "", mark: "%", liner: "confetti", cardIcon: "gift", cardTitle: promo.percent + "% הנחה", cardText: "על כל החבילות", postmark: false });
    var env = host.firstChild;
    env.setAttribute("tabindex", "-1"); env.setAttribute("aria-hidden", "true");
    ENV.applyPalette(env, "blush");
    $("#ppopTitle").textContent = promo.percent + "% הנחה על כל ההפתעות";
    $("#ppopText").textContent = promo.title + " עד " + promo.endsLabel + " · " + leftText() + ". ההנחה כבר מחושבת בטופס.";
    // חלון קטן באמצע, בלי רקע כהה ובלי לחסום: אפשר להמשיך לגלול וללחוץ באתר.
    // לא גונב את המיקוד; קורא המסך מקבל הודעה קצרה. Esc או לחיצה מחוץ לחלון סוגרים
    var shown = false;
    function show() {
      if (shown || document.querySelector("dialog[open]")) return;
      shown = true;
      try { (every === "session" ? sessionStorage : localStorage).setItem(KEY, String(Date.now())); } catch (e) { /* */ }
      pop.show();
      setTimeout(function () { ENV.open(env); }, motionOff() ? 0 : 450);
      var st = $("#a11yStatus") || $("#demoStatus");
      if (st) st.textContent = promo.percent + "% הנחה על כל ההפתעות, עד " + promo.endsLabel + ". אפשר לסגור עם Escape.";
      if (window.mtTrack) window.mtTrack("promo_popup", {});
    }
    function close() {
      if (!pop.open) return;
      pop.classList.add("is-closing");
      setTimeout(function () { pop.classList.remove("is-closing"); pop.close(); }, motionOff() ? 0 : 220);
    }
    pop.addEventListener("click", function (e) { if (e.target.closest("[data-pop-close]")) close(); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" && pop.open) close(); }, true);
    pop.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    document.addEventListener("click", function (e) { if (pop.open && !pop.contains(e.target)) close(); });
    var timer = setTimeout(show, force ? 1500 : 7000);
    // נגעו בהדגמה בטלפון? לא קופצים באמצע. החלון יחכה לגלילה לדוגמאות
    var demoBox = $("#demo");
    if (demoBox && !force) demoBox.addEventListener("pointerdown", function () { clearTimeout(timer); }, { once: true });
    var ex = $("#examples");
    if (ex && "IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io2.disconnect(); clearTimeout(timer); setTimeout(show, 600); } }, { threshold: 0.2 });
      io2.observe(ex);
    }
    // מי שכבר בדרך להזמנה לא צריך חלון
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('a[href*="order.html"]')) { clearTimeout(timer); shown = true; } }, true);
  })();
  if (promo) document.querySelectorAll(".cta-bar__main").forEach(function (a) { a.insertAdjacentHTML("beforeend", '<em class="cta-bar__tag">-' + promo.percent + "%</em>"); });

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
      '<span class="step__num" aria-hidden="true" data-n="0' + (i + 1) + '"></span>' +
      '<span class="tile tile--' + (i + 1) + '" aria-hidden="true">' + ico(s.icon) + "</span>" +
      "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
  }).join("");

  /* ---------- בשבילו + מחולל רעיונות ---------- */
  $("#himPoints").innerHTML = S.him.points.map(function (p, i) {
    return '<li><span class="tile tile--' + [1, 6, 2][i % 3] + '" aria-hidden="true">' + ico(p.icon) + "</span><span><b>" + esc(p.title) + "</b><small>" + esc(p.text) + "</small></span></li>";
  }).join("");
  var IDEAS = S.ideas.items, ideaI = Math.floor(Math.random() * IDEAS.length);
  function showIdea(animate) {
    var it = IDEAS[ideaI % IDEAS.length];
    var card = $("#ideaCard");
    card.innerHTML = '<span class="tile tile--' + ((ideaI % 6) + 1) + '" aria-hidden="true">' + ico(it.icon) + '</span><div><p class="idea__n">רעיון ' + ((ideaI % IDEAS.length) + 1) + " מתוך " + IDEAS.length + '</p><h3 class="idea__title">' + esc(it.title) + "</h3><p>" + esc(it.text) + "</p></div>";
    $("#ideaWant").href = "order.html?type=" + it.type;
    if (animate && !motionOff()) { card.classList.remove("is-new"); void card.offsetWidth; card.classList.add("is-new"); }
  }
  showIdea(false);
  $("#ideaNext").addEventListener("click", function () { ideaI++; showIdea(true); });

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

  // בטלפון: 4 דוגמאות ראשונות, והשאר בלחיצה (בלי גלילה הצידה)
  var exList = $("#examplesList"), exMore = $("#exMore"), FEW = 4;
  function syncMore(cat) {
    var total = E.items.length;
    var collapsed = cat === "all" && exMore.getAttribute("aria-expanded") !== "true";
    exList.classList.toggle("is-collapsed", collapsed);
    exMore.hidden = cat !== "all" || total <= FEW;
    $("#exMoreText").textContent = exMore.getAttribute("aria-expanded") === "true" ? "להציג פחות" : "עוד " + (total - FEW) + " דוגמאות";
  }
  exMore.addEventListener("click", function () {
    var open = exMore.getAttribute("aria-expanded") !== "true";
    exMore.setAttribute("aria-expanded", open ? "true" : "false");
    syncMore("all");
    if (open) { var first = exList.querySelectorAll(".example")[FEW]; if (first) first.querySelector("a").focus({ preventScroll: false }); }
  });
  syncMore("all");

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
    syncMore(cat);
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
  // בטלפון רואים 8, והשאר בלחיצה
  if (S.toolbox.items.length > 8) {
    $("#toolboxList").insertAdjacentHTML("afterend", '<button type="button" class="btn btn--ghost more-btn" id="toolMore" aria-expanded="false" aria-controls="toolboxList">' + ico("plus") + "לכל " + S.toolbox.items.length + " החלקים</button>");
    $("#toolMore").addEventListener("click", function () {
      $("#toolboxList").classList.add("is-all");
      this.remove();
      var li = $("#toolboxList > li:nth-child(9)");
      if (li) { li.setAttribute("tabindex", "-1"); li.focus({ preventScroll: true }); }
    });
  }

  /* ---------- עליי ---------- */
  var A = S.about;
  var paras = A.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; });
  $("#aboutParas").innerHTML = paras.slice(0, 2).join("") + '<div class="about__more" id="aboutMoreText">' + paras.slice(2).join("") + "</div>";
  $("#aboutMore").addEventListener("click", function () {
    var b = this, open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", open ? "true" : "false");
    $("#aboutParas").classList.toggle("is-open", open);
    b.innerHTML = ico(open ? "x" : "plus") + (open ? "לקצר" : "להמשך הסיפור");
  });
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
    return '<article class="plan reveal plan--' + esc(p.id) + (p.popular ? " plan--popular" : "") + '" id="plan-' + esc(p.id) + '"' + stagger(i, 120) + ">" +
      (p.popular ? '<span class="plan__badge">' + ico("star") + esc(p.popularLabel) + "</span>" : "") +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="plan__price">' + (promo ? '<del class="plan__old"><span class="sr-only">במקום </span>' + p.price + " " + esc(PR.currency) + "</del>" : "") +
      '<span class="plan__now"><span class="plan__num">' + now + '</span><span class="plan__cur">' + esc(PR.currency) + "</span></span>" +
      (promo ? '<span class="plan__save">חוסכים ' + (p.price - now) + " " + esc(PR.currency) + "</span>" : "") + "</p>" +
      '<p class="plan__desc">' + esc(p.description) + "</p>" +
      "<ul>" + p.features.map(function (f) { return "<li>" + ico("check") + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<a class="btn ' + (p.popular ? "btn--primary" : "btn--outline") + ' btn--block" href="order.html?plan=' + esc(p.id) + '">' + esc(p.cta) + ico("arrow-left") + "</a></article>";
  }).join("");
  // בטלפון: מתג בין החבילות, כדי שלא יהיה צריך לגלול על שתיהן
  var plansEl = $("#plans"), pop = (PR.plans.filter(function (p) { return p.popular; })[0] || PR.plans[0]).id;
  plansEl.setAttribute("data-show", pop);
  plansEl.insertAdjacentHTML("beforebegin", '<div class="plan-switch" role="group" aria-label="איזו חבילה להציג">' + PR.plans.map(function (p) {
    return '<button type="button" data-plan="' + esc(p.id) + '" aria-pressed="' + (p.id === pop) + '" aria-controls="plan-' + esc(p.id) + '">' + esc(p.name) + " · " + planPrice(p) + " " + esc(PR.currency) + "</button>";
  }).join("") + "</div>");
  document.querySelector(".plan-switch").addEventListener("click", function (e) {
    var b = e.target.closest("[data-plan]");
    if (!b) return;
    plansEl.setAttribute("data-show", b.dataset.plan);
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
  });
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
    var a = $("#promoLeft");
    if (a) a.textContent = t;
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
    var past = y > hero.offsetHeight * 0.7;
    wa.classList.toggle("is-shown", past);
    document.body.classList.toggle("cta-on", past && y < document.documentElement.scrollHeight - window.innerHeight - 260);
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
     ההדגמה החיה ב-HERO: החוויה האמיתית בתוך הטלפון (demos/*.html?embed=1)
     בכניסה קופידון יורה חץ אל החותם והמעטפה נפתחת לבד.
     "הגרלת דוגמה אחרת" מחליף לדוגמה אחרת מתוך config.js → examples
     ========================================================= */
  (function heroDemo() {
    var phone = $("#demo"), screen = $("#demoScreen"), frame = $("#demoFrame"), status = $("#demoStatus");
    if (!phone || !frame) return;
    var VW = 360; // רוחב "המסך" הווירטואלי בתוך הטלפון
    var items = (S.examples && S.examples.items || []).filter(function (x) { return x.url; });
    var order = ["demos/date.html", "demos/anniversary.html", "demos/proposal.html", "demos/bestie.html", "demos/baby.html", "demos/love.html", "demos/sorry.html", "demos/trip.html", "demos/thanks.html"];
    items.sort(function (a, b) { return (order.indexOf(a.url) + 99) % 99 - (order.indexOf(b.url) + 99) % 99; });
    var cur = 0, bag = [], introDone = false, k = 1;

    function fit() {
      k = screen.clientWidth / VW;
      frame.style.width = VW + "px";
      frame.style.height = Math.round(screen.clientHeight / k) + "px";
      frame.style.transform = "scale(" + k.toFixed(4) + ")";
    }
    fit();
    window.addEventListener("resize", fit);

    function setMeta(it) {
      $("#demoNow").textContent = it.title;
      $("#demoFeat").innerHTML = (it.features || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("");
      $("#demoFull").href = it.url;
      $("#demoOrder").href = "order.html?type=" + encodeURIComponent(it.order || "partner") + "&src=hero-" + it.url.split("/").pop().replace(".html", "");
      frame.title = "הדגמה חיה: " + it.title;
      phone.setAttribute("aria-label", "הדגמה חיה של הפתעה: " + it.title);
    }
    if (items[0]) setMeta(items[0]);

    function doc() { try { return frame.contentDocument; } catch (e) { return null; } }
    function onLoad() {
      fit();
      screen.classList.remove("is-loading");
      var d = doc();
      // נגיעה בהדגמה = לא קופצים עם חלון המבצע באמצע
      if (d) d.addEventListener("pointerdown", function () { phone.dispatchEvent(new Event("pointerdown")); introDone = true; }, { once: true });
      if (!introDone) intro();
    }
    frame.addEventListener("load", onLoad);
    // אם ה-iframe כבר נטען לפני שהסקריפט רץ
    var d0 = doc();
    if (d0 && d0.readyState === "complete" && d0.querySelector(".env")) onLoad();

    // קופידון יורה חץ אל החותם, והמעטפה נפתחת
    function sealRect() {
      var d = doc(), s = d && d.querySelector(".env__seal");
      if (!s) return null;
      var fr = frame.getBoundingClientRect(), r = s.getBoundingClientRect();
      return { left: fr.left + r.left * k, top: fr.top + r.top * k, width: r.width * k, height: r.height * k };
    }
    function intro() {
      introDone = true;
      if (motionOff() || !window.MatanotFX) return;
      setTimeout(function () {
        var r = phone.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return; // לא בתצוגה: בלי
        var sr = sealRect();
        if (!sr) return;
        var x = Math.min(innerWidth - 56, r.right + (innerWidth > 979 ? 90 : 4));
        window.MatanotFX.play("cupid", {
          target: sealRect, from: { x: x, y: sr.top - 40 },
          onHit: function () {
            var d = doc(), env = d && d.querySelector(".env");
            if (env && !env.classList.contains("is-cracked")) env.click();
            status.textContent = "המעטפה נפתחת";
          },
        });
      }, 1100);
    }

    // הגרלה: כל הדוגמאות לפני שחוזרים על אחת
    function pick() {
      if (!bag.length) { bag = items.map(function (_, i) { return i; }).filter(function (i) { return i !== cur; }); bag.sort(function () { return Math.random() - 0.5; }); }
      return bag.shift();
    }
    $("#demoShuffle").addEventListener("click", function () {
      if (items.length < 2) return;
      cur = pick();
      var it = items[cur], btn = this;
      btn.classList.remove("is-spin"); void btn.offsetWidth; btn.classList.add("is-spin");
      screen.classList.add("is-loading");
      setMeta(it);
      setTimeout(function () { frame.src = it.url + "?embed=1"; }, motionOff() ? 0 : 220);
      status.textContent = "דוגמה חדשה: " + it.title + ". הקישו על החותם כדי לפתוח";
      if (window.mtTrack) window.mtTrack("hero_shuffle", { demo: it.url });
    });
  })();
})();
