/* =========================================================
   Matanot: עמודי אירוע (michtav-ahava.html וכו')
   מחיר ומבצע מתוך config.js, קישורי ווטסאפ, והכפתור הדביק בטלפון
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE || {};
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var promo = S.promo && S.promo.active && Date.now() < new Date(S.promo.endsAt).getTime() ? S.promo : null;

  var phone = (S.contact && S.contact.phoneIntl) || "";
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent((S.whatsappMessage || "היי שמואל!") + " (" + document.title.split("|")[0].trim() + ")");
  });

  var price = document.getElementById("evPrice");
  if (price && S.pricing) {
    var min = Math.min.apply(null, S.pricing.plans.map(function (p) { return p.price; }));
    price.innerHTML = promo
      ? '<span class="ev-price__tag">' + esc(promo.title) + " עד " + esc(promo.endsLabel) + "</span> החל מ-" + Math.round(min * (1 - promo.percent / 100)) + ' ₪ <del><span class="sr-only">במקום </span>' + min + " ₪</del>"
      : "החל מ-" + min + " ₪ · סקיצה מיד, משלמים רק אחרי שאהבתם";
  }

  // הכפתור הדביק (בטלפון) מופיע אחרי שגוללים מעבר לכפתורים הראשיים
  var hero = document.getElementById("top"), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, past = hero && y > hero.offsetHeight * 0.6;
    document.body.classList.toggle("cta-on", !!past && y < document.documentElement.scrollHeight - window.innerHeight - 220);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
