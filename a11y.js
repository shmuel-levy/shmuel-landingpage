/* תפריט נגישות: הגדלת טקסט, ניגודיות, הדגשת קישורים, גופן קריא, עצירת אנימציות, ריווח.
   ההעדפות נשמרות בדפדפן של המבקר. */
(function () {
  "use strict";
  var KEY = "matanot-a11y";
  var root = document.documentElement;
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { prefs = {}; }

  function apply() {
    ["text-lg", "contrast", "links", "readable", "no-motion", "spacing"].forEach(function (k) {
      root.classList.toggle("a11y-" + k, !!prefs[k]);
    });
  }
  apply(); // מוקדם ככל האפשר, לפני הציור

  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("a11yToggle");
    var panel = document.getElementById("a11yPanel");
    if (!toggle || !panel) return;
    var buttons = panel.querySelectorAll("[data-a11y]");

    function sync() {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", prefs[b.dataset.a11y] ? "true" : "false"); });
    }
    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      buttons[0].focus();
    }
    function close(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () { panel.hidden ? open() : close(false); });
    document.getElementById("a11yClose").addEventListener("click", function () { close(true); });
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.a11y;
        prefs[k] = !prefs[k];
        apply(); save(); sync();
      });
    });
    document.getElementById("a11yReset").addEventListener("click", function () {
      prefs = {}; apply(); save(); sync();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close(true);
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !document.getElementById("a11y").contains(e.target)) close(false);
    });
    sync();
  });
})();
