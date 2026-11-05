/* תפריט נגישות: גודל טקסט (3 רמות), ניגודיות, הדגשת קישורים, גופן קריא, עצירת אנימציות,
   ריווח, גווני אפור, סמן גדול, הדגשת פוקוס והדגשת כותרות.
   ההעדפות נשמרות בדפדפן של המבקר בלבד. */
(function () {
  "use strict";
  var KEY = "matanot-a11y";
  var root = document.documentElement;
  var KEYS = ["contrast", "links", "readable", "no-motion", "spacing", "grayscale", "cursor", "focus", "headings"];
  var NAMES = { "text-lg": "הגדלת טקסט", contrast: "ניגודיות גבוהה", links: "הדגשת קישורים", readable: "גופן קריא", "no-motion": "עצירת אנימציות", spacing: "ריווח שורות", grayscale: "גווני אפור", cursor: "סמן גדול", focus: "הדגשת פוקוס", headings: "הדגשת כותרות" };
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { prefs = {}; }

  function apply() {
    KEYS.forEach(function (k) { root.classList.toggle("a11y-" + k, !!prefs[k]); });
    var lv = +prefs["text-lg"] || 0;
    root.classList.toggle("a11y-text-lg", lv === 1);
    root.classList.toggle("a11y-text-xl", lv === 2);
  }
  apply(); // מוקדם ככל האפשר, לפני הציור

  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* מצב פרטי */ } }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("a11yToggle");
    var panel = document.getElementById("a11yPanel");
    if (!toggle || !panel) return;
    var buttons = panel.querySelectorAll("[data-a11y]");
    var status = document.getElementById("a11yStatus");

    function say(t) { if (!status) return; status.textContent = ""; setTimeout(function () { status.textContent = t; }, 50); }
    function sync() {
      buttons.forEach(function (b) {
        var k = b.dataset.a11y;
        b.setAttribute("aria-pressed", prefs[k] ? "true" : "false");
        if (k === "text-lg") {
          var lv = +prefs[k] || 0;
          var lab = b.querySelector(".a11y__lvl");
          if (lab) lab.textContent = lv ? " (" + (lv + 1) + "/3)" : "";
        }
      });
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
        if (k === "text-lg") {
          prefs[k] = ((+prefs[k] || 0) + 1) % 3;
          say(prefs[k] ? NAMES[k] + ": רמה " + (prefs[k] + 1) + " מתוך 3" : "גודל טקסט רגיל");
        } else {
          prefs[k] = !prefs[k];
          say(NAMES[k] + (prefs[k] ? " הופעל" : " כובה"));
        }
        apply(); save(); sync();
      });
    });
    document.getElementById("a11yReset").addEventListener("click", function () {
      prefs = {}; apply(); save(); sync(); say("כל ההגדרות אופסו");
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
