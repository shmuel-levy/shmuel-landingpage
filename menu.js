/* =========================================================
   Matanot: תפריט המבורגר, בכל העמודים ובכל גודל מסך
   נפתח כחלונית מהצד (dialog): המקלדת נשארת בתוך התפריט, Esc סוגר,
   והמיקוד חוזר לכפתור.
   ========================================================= */
(function () {
  "use strict";
  var I = window.MatanotIcons;
  if (!I) return;
  var ico = function (n) { return I.svg(n); };
  var S = window.SITE || {};
  var phone = (S.contact && S.contact.phoneIntl) || "972585943018";
  var phoneShow = (S.contact && S.contact.phoneDisplay) || "058-594-3018";
  var onHome = /(^\/$|index\.html$|\/$)/.test(location.pathname) && document.getElementById("top");
  var base = onHome ? "" : "index.html";

  var LINKS = [
    { href: base + "#top", icon: "home", label: "עמוד הבית" },
    { href: base + "#how", icon: "sparkle", label: "איך זה עובד" },
    { href: base + "#examples", icon: "images", label: "דוגמאות" },
    { href: base + "#him", icon: "pencil", label: "מכתב לבת הזוג" },
    { href: base + "#pricing", icon: "tag", label: "מחירים ומבצע" },
    { href: base + "#about", icon: "smile", label: "מי אני" },
    { href: base + "#faq", icon: "question", label: "שאלות נפוצות" },
  ];

  var header = document.querySelector(".header__inner");
  if (!header) return;
  var host = header.querySelector(".header__actions") || header;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "burger";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "siteMenu");
  btn.setAttribute("aria-label", "תפריט");
  btn.innerHTML = '<span class="burger__lines" aria-hidden="true"><i></i><i></i><i></i></span>';
  host.appendChild(btn);

  var d = document.createElement("dialog");
  d.className = "drawer";
  d.id = "siteMenu";
  d.setAttribute("aria-labelledby", "siteMenuTitle");
  d.innerHTML =
    '<div class="drawer__inner">' +
      '<div class="drawer__head"><span class="brand"><img class="brand__mark" src="images/favicon.png" alt="" width="40" height="40"><span class="brand__text"><b lang="en" id="siteMenuTitle">Matanot</b><small>הפתעות בקישור</small></span></span>' +
      '<button type="button" class="drawer__close" aria-label="סגירת התפריט">' + ico("x") + "</button></div>" +
      '<nav class="drawer__nav" aria-label="תפריט ראשי"><ul>' +
        LINKS.map(function (l, i) { return '<li><a href="' + l.href + '" style="--i:' + i + '"><span class="tile tile--' + ((i % 6) + 1) + '" aria-hidden="true">' + ico(l.icon) + "</span>" + l.label + "</a></li>"; }).join("") +
      "</ul></nav>" +
      '<a class="btn btn--primary btn--lg btn--block drawer__cta" href="order.html">' + ico("wand") + "לבנות סקיצה עכשיו</a>" +
      '<div class="drawer__contact">' +
        '<a class="drawer__wa" href="https://wa.me/' + phone + '" target="_blank" rel="noopener">' + ico("whatsapp") + 'ווטסאפ<span class="sr-only"> (נפתח בחלון חדש)</span></a>' +
        '<a href="tel:+' + phone + '">' + ico("call") + '<span dir="ltr">' + phoneShow + "</span></a>" +
      "</div>" +
      '<div class="drawer__legal"><a href="negishut.html">הצהרת נגישות</a><a href="privacy.html">מדיניות פרטיות</a></div>' +
    "</div>";
  document.body.appendChild(d);

  function open() {
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    btn.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
  }
  function close() { if (d.open) d.close(); }
  d.addEventListener("close", function () {
    btn.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    btn.focus({ preventScroll: true });
  });
  btn.addEventListener("click", function () { d.open ? close() : open(); });
  d.querySelector(".drawer__close").addEventListener("click", close);
  // לחיצה על הרקע סוגרת
  d.addEventListener("click", function (e) {
    var r = d.getBoundingClientRect();
    if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) close();
  });
  // קישור בתוך העמוד: סוגרים ואז גוללים
  d.querySelectorAll('.drawer__nav a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var target = document.querySelector(a.getAttribute("href"));
      close();
      if (target) {
        target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        history.replaceState(null, "", a.getAttribute("href"));
        var h = target.querySelector("h1, h2");
        if (h) { h.setAttribute("tabindex", "-1"); setTimeout(function () { h.focus({ preventScroll: true }); }, 450); }
      }
    });
  });
})();
