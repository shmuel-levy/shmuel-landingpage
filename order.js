/* =========================================================
   Matanot: טופס ההזמנה + בניית סקיצה
   השאלות: order-config.js · מחירים ומבצע: config.js
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE, O = window.ORDER, ENV = window.MatanotEnvelope, I = window.MatanotIcons;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var ico = function (n, c) { return I.svg(n, c); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion"); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ---------- מחיר ומבצע ---------- */
  var promo = S.promo && S.promo.active && Date.now() < new Date(S.promo.endsAt).getTime() ? S.promo : null;
  function planPrice(p) { return promo ? Math.round(p.price * (1 - promo.percent / 100)) : p.price; }

  /* ---------- הגדרות ---------- */
  var STEPS = [
    { id: "type", label: "סוג" },
    { id: "story", label: "הסיפור" },
    { id: "design", label: "עיצוב" },
    { id: "details", label: "פרטים" },
    { id: "sketch", label: "סקיצה" },
  ];
  var ADDR = ["פנייה לנקבה", "פנייה לזכר", "פנייה לרבים"];
  var DEF_PALETTE = { partner: "blush", proposal: "lilac", birthday: "gold", sorry: "peach", baby: "mint", friend: "gold", thanks: "gold", family: "ink", other: "blush" };
  var DEF_LINER = { partner: "hearts", proposal: "dots", birthday: "confetti", sorry: "confetti", baby: "dots", friend: "confetti", thanks: "dots", family: "stripes", other: "dots" };
  var DEF_MOOD = { partner: "romantic", proposal: "emotional", birthday: "happy", sorry: "romantic", baby: "happy", friend: "happy", thanks: "happy", family: "emotional", other: "romantic" };
  var DRAFT = "matanot-order-draft";
  // לאיזו קבוצה בשלב הסיפור שייכת כל שאלה (מה שלא מופיע כאן נכנס ל"הסיפור שלכם")
  var STORY_GROUPS = [
    { id: "story", icon: "hearts", title: "הסיפור שלכם", desc: "כמה פרטים קטנים שהופכים את זה לאישי." },
    { id: "moments", icon: "images", title: "רגעים לאלבום", desc: "כיתוב קצר לכל תמונה. את התמונות מוסיפים בשלב הבא." },
    { id: "play", icon: "sparkle", title: "המשחקים בדרך", desc: "השאלות, החידון וההפתעות הקטנות." },
    { id: "finale", icon: "gift", title: "הסוף", desc: "מה מחכה בסוף המסע." },
    { id: "letter", icon: "letter", title: "המכתב", desc: "כמה מילים מהלב. אפשר בנקודות, אני מנסח." },
  ];
  var GROUP_OF = {
    memories: "moments",
    question: "play", quiz: "play", noTexts: "play", reveal: "play", revealText: "play", promises: "play", makeUp: "play", makeUpText: "play", notes: "play", gift: "play",
    finale: "finale", finaleWhen: "finale", finaleWhere: "finale", proposalPlan: "finale", placeTime: "finale", whoKnows: "finale", dueDate: "finale",
    letter: "letter", letterHelp: "letter",
  };
  function groupOf(id) { return GROUP_OF[id] || "story"; }
  var EXTRAS = ["כפתור תגובה בסוף: יוכלו לענות לי בווטסאפ בלחיצה", "תזכורת ממני שבועיים לפני התאריך, בשנה הבאה"];
  var VOICE_AT = ["מיד כשהמעטפה נפתחת", "רגע לפני הסוף"];
  var VOICE_MAX = 90; // שניות
  // רעיון קטן למה להגיד בהקלטה, לפי סוג ההפתעה
  var VOICE_IDEA = {
    partner: "למשל: מה הרגשת כשראית אותה בפעם הראשונה. או סתם \"היי, תקשיבי עד הסוף\".",
    proposal: "למשל: כמה מילים לפני השאלה הגדולה. בקול שלך זה שווה פי אלף.",
    birthday: "למשל: \"מזל טוב!\", או שיר יום הולדת מזויף במיוחד.",
    sorry: "למשל: \"סליחה\" אחד אמיתי, בלי תירוצים.",
    baby: "למשל: \"יש לנו משהו לספר לכם...\"",
    friend: "למשל: הבדיחה הפנימית שלכם, בקול.",
    thanks: "למשל: הילדים אומרים \"תודה\" ביחד. נשמע מושלם גם מטלפון.",
    family: "למשל: \"אמא, רק רציתי להגיד...\"",
    other: "כמה מילים בקול שלכם. זה הכל.",
  };
  function fmtTime(sec) { sec = Math.max(0, Math.round(sec || 0)); return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); }
  function intlPhone(p) { var dg = String(p || "").replace(/[^\d]/g, "").replace(/^972/, "0"); return /^0\d{8,9}$/.test(dg) ? "972" + dg.slice(1) : ""; }

  var state = { type: null, step: 0, data: {}, photos: [], voice: null, visited: 0 };
  function track(name, params) { try { if (window.mtTrack) window.mtTrack(name, params || {}); } catch (e) { /* */ } }
  function typeDef(id) { return O.types.filter(function (t) { return t.id === (id || state.type); })[0]; }

  /* ---------- שדות משותפים ---------- */
  var COMMON_TOP = [
    { id: "recipient", type: "text", label: "איך קוראים למי שמקבל/ת את ההפתעה?", required: true, placeholder: "למשל: נועה", autocomplete: "off" },
    { id: "address", type: "chips", label: "איך לפנות אליו/ה באתר?", required: true, options: ADDR, hint: "כדי שהטקסטים ייכתבו נכון: \"לחצי\", \"לחץ\" או \"לחצו\"." },
    { id: "from", type: "text", label: "איך לחתום בסוף?", required: true, placeholder: "למשל: שלך, דני" },
  ];
  var COMMON_BOTTOM = [
    { id: "tone", type: "multi", label: "באיזה טון?", options: O.tones },
  ];
  var DETAILS = [
    { id: "deadline", noHelp: true, type: "date", label: "עד מתי ההפתעה צריכה להיות מוכנה?", required: true, hint: "ככה אני יודע לתעדף. צריכים היום? בחרו אקספרס למטה." },
    { id: "name", type: "text", label: "השם שלכם", required: true, autocomplete: "name" },
    { id: "phone", type: "tel", label: "טלפון לחזרה", required: true, autocomplete: "tel", placeholder: "050-0000000", validate: "phone" },
    { id: "extras", type: "multi", label: "עוד שני דברים קטנים", options: EXTRAS },
    { id: "notes", noHelp: true, type: "textarea", label: "משהו נוסף שחשוב שאדע?", placeholder: "שיר מסוים, צבע שהיא אוהבת, תאריך מיוחד..." },
    { id: "source", type: "chips", label: "איך הגעתם אליי? (רשות)", options: ["אינסטגרם", "טיקטוק", "פייסבוק", "גוגל", "חבר/ה המליצו", "קיבלתי הפתעה כזו", "אחר"] },
  ];

  /* ---------- בוחר תאריך (במקום mm/dd/yyyy של הדפדפן) ----------
     כפתור שמציג את התאריך בעברית, קיצורים ("מחר", "בעוד שבוע"), ולוח שנה שנפתח בתוך הטופס.
     מקלדת: חיצים בין ימים (ימינה = אחורה, כמו בעברית), PageUp/PageDown חודשים, Enter בוחר, Esc סוגר.
     הערך נשמר כ-YYYY-MM-DD ב-state.data */
  var DP_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  var DP_DAYS_LONG = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  var DP_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var dpView = {}; // לכל שדה: איזה חודש מוצג
  function isoOf(dt) { return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
  function fromIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function today0() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function addDays(dt, n) { var x = new Date(dt); x.setDate(x.getDate() + n); return x; }
  function dpMax(f) { return addDays(today0(), f.id === "dueDate" ? 300 : 365); }
  function dpRel(dt) {
    var n = Math.round((dt - today0()) / 864e5);
    return n === 0 ? "היום" : n === 1 ? "מחר" : n === 2 ? "מחרתיים" : n < 14 ? "בעוד " + n + " ימים" : n < 60 ? "בעוד " + Math.round(n / 7) + " שבועות" : "בעוד " + Math.round(n / 30) + " חודשים";
  }
  function dpLabel(dt) { return "יום " + DP_DAYS_LONG[dt.getDay()] + ", " + dt.getDate() + " ב" + DP_MONTHS[dt.getMonth()]; }
  function dpQuick(f) { return f.id === "deadline" ? [[1, "מחר"], [3, "בעוד 3 ימים"], [7, "בעוד שבוע"], [14, "בעוד שבועיים"]] : []; }
  function datePicker(f, id, describe, v) {
    var dt = fromIso(v);
    var face = dt ? '<span class="dp__val"><b>' + esc(dpLabel(dt)) + "</b><small>" + esc(dpRel(dt)) + "</small></span>" : '<span class="dp__val dp__val--empty">בחרו תאריך</span>';
    return '<div class="dp" data-dp="' + f.id + '">' +
      '<button type="button" class="input dp__btn" id="' + id + '" data-dp-open="' + f.id + '" aria-expanded="false" aria-controls="' + id + '-pop" aria-describedby="' + describe + '">' +
        '<span class="dp__ico" aria-hidden="true">' + ico("calendar") + "</span>" + face + '<span class="dp__chev" aria-hidden="true">' + ico("arrow-left") + "</span></button>" +
      (dpQuick(f).length ? '<div class="dp__quick" role="group" aria-label="קיצורים לתאריך">' + dpQuick(f).map(function (q) {
        var on = v && v === isoOf(addDays(today0(), q[0]));
        return '<button type="button" class="dp__q" data-dp-quick="' + f.id + '" data-n="' + q[0] + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(q[1]) + "</button>";
      }).join("") + "</div>" : "") +
      '<div class="dp__pop" id="' + id + '-pop" role="dialog" aria-label="בחירת תאריך: ' + esc(f.label) + '" hidden></div>' +
      "</div>";
  }
  function dpRender(fid) {
    var f = fieldDefAll(fid), pop = $("#f-" + fid + "-pop");
    if (!f || !pop) return;
    var sel = fromIso(state.data[fid]), min = today0(), max = dpMax(f);
    var view = dpView[fid] || (sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date(min.getFullYear(), min.getMonth(), 1));
    dpView[fid] = view;
    var y = view.getFullYear(), m = view.getMonth();
    var first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    var opts = "";
    for (var i = 0; i <= Math.ceil((max - min) / (30 * 864e5)); i++) {
      var mm = new Date(min.getFullYear(), min.getMonth() + i, 1);
      opts += '<option value="' + mm.getFullYear() + "-" + mm.getMonth() + '"' + (mm.getFullYear() === y && mm.getMonth() === m ? " selected" : "") + ">" + DP_MONTHS[mm.getMonth()] + " " + mm.getFullYear() + "</option>";
    }
    var prevOk = new Date(y, m, 0) >= min, nextOk = new Date(y, m + 1, 1) <= max;
    var cells = "";
    for (var b = 0; b < first.getDay(); b++) cells += '<span class="dp__blank" aria-hidden="true"></span>';
    var focusIso = state.data[fid] && sel && sel.getMonth() === m && sel.getFullYear() === y ? state.data[fid] : null;
    if (!focusIso) { var t0 = today0(); focusIso = t0.getMonth() === m && t0.getFullYear() === y ? isoOf(t0) : isoOf(first); }
    for (var dd = 1; dd <= days; dd++) {
      var dt = new Date(y, m, dd), iso = isoOf(dt), off = dt < min || dt > max;
      var isSel = sel && iso === isoOf(sel), isToday = iso === isoOf(today0());
      cells += '<button type="button" class="dp__day' + (isSel ? " is-sel" : "") + (isToday ? " is-today" : "") + (dt.getDay() === 6 ? " is-sat" : "") + '" data-dp-day="' + fid + '" data-iso="' + iso + '"' +
        (off ? " disabled" : "") + ' tabindex="' + (iso === focusIso ? "0" : "-1") + '" aria-pressed="' + (isSel ? "true" : "false") + '" aria-label="' + dpLabel(dt) + " " + y + (isToday ? ", היום" : "") + '">' + dd + "</button>";
    }
    pop.innerHTML = '<div class="dp__head">' +
      '<button type="button" class="dp__nav" data-dp-nav="' + fid + '" data-d="-1" aria-label="החודש הקודם"' + (prevOk ? "" : " disabled") + ">" + ico("arrow-right") + "</button>" +
      '<select class="dp__month" data-dp-month="' + fid + '" aria-label="חודש">' + opts + "</select>" +
      '<button type="button" class="dp__nav" data-dp-nav="' + fid + '" data-d="1" aria-label="החודש הבא"' + (nextOk ? "" : " disabled") + ">" + ico("arrow-left") + "</button></div>" +
      '<div class="dp__week" aria-hidden="true">' + DP_DAYS.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>" +
      '<div class="dp__grid" role="group" aria-label="' + DP_MONTHS[m] + " " + y + '">' + cells + "</div>" +
      '<p class="dp__foot"><button type="button" class="link-btn dp__close" data-dp-close="' + fid + '">סגירה</button></p>';
  }
  function fieldDefAll(fid) {
    var T = typeDef();
    return DETAILS.concat(T ? T.fields : []).filter(function (x) { return x.id === fid; })[0];
  }
  function dpOpen(fid, focusDay) {
    var pop = $("#f-" + fid + "-pop"), btn = $("#f-" + fid);
    if (!pop) return;
    $$(".dp__pop:not([hidden])").forEach(function (p) { if (p !== pop) dpClose(p.id.replace(/^f-|-pop$/g, ""), false); });
    dpRender(fid);
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.closest(".dp").classList.add("is-open");
    if (focusDay !== false) { var d0 = $('.dp__day[tabindex="0"]', pop); if (d0) d0.focus({ preventScroll: true }); }
    pop.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }
  function dpClose(fid, refocus) {
    var pop = $("#f-" + fid + "-pop"), btn = $("#f-" + fid);
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.closest(".dp").classList.remove("is-open");
    if (refocus !== false) btn.focus({ preventScroll: true });
  }
  function dpSet(fid, iso) {
    state.data[fid] = iso;
    var f = fieldDefAll(fid), wrap = $('[data-field="' + fid + '"]');
    var dt = fromIso(iso), btn = $("#f-" + fid);
    $(".dp__val", btn).outerHTML = '<span class="dp__val"><b>' + esc(dpLabel(dt)) + "</b><small>" + esc(dpRel(dt)) + "</small></span>";
    $$('[data-dp-quick="' + fid + '"]').forEach(function (q) { q.setAttribute("aria-pressed", isoOf(addDays(today0(), +q.getAttribute("data-n"))) === iso ? "true" : "false"); });
    btn.closest(".dp").classList.remove("is-pulse"); void btn.offsetWidth; btn.closest(".dp").classList.add("is-pulse");
    if (wrap && wrap.classList.contains("has-error")) validateField(wrap);
    var st = $("#helpStatus"); if (st) st.textContent = "נבחר: " + dpLabel(dt) + ", " + dpRel(dt);
    saveDraft();
    if (f && f.id === "deadline") track("deadline_set", { days: Math.round((dt - today0()) / 864e5) });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var op = t.closest("[data-dp-open]"), day = t.closest("[data-dp-day]"), nav = t.closest("[data-dp-nav]"), q = t.closest("[data-dp-quick]"), cl = t.closest("[data-dp-close]");
    if (op) { var fid = op.getAttribute("data-dp-open"); if ($("#f-" + fid + "-pop").hidden) dpOpen(fid); else dpClose(fid); return; }
    if (day && !day.disabled) { var f2 = day.getAttribute("data-dp-day"); dpSet(f2, day.getAttribute("data-iso")); dpClose(f2); return; }
    if (nav && !nav.disabled) { var f3 = nav.getAttribute("data-dp-nav"), v3 = dpView[f3]; dpView[f3] = new Date(v3.getFullYear(), v3.getMonth() + +nav.getAttribute("data-d"), 1); dpRender(f3); var n2 = $('[data-dp-nav="' + f3 + '"][data-d="' + nav.getAttribute("data-d") + '"]'); if (n2 && !n2.disabled) n2.focus(); else $('.dp__day[tabindex="0"]', $("#f-" + f3 + "-pop")).focus(); return; }
    if (q) { var f4 = q.getAttribute("data-dp-quick"); dpSet(f4, isoOf(addDays(today0(), +q.getAttribute("data-n")))); dpView[f4] = null; dpClose(f4, false); return; }
    if (cl) { dpClose(cl.getAttribute("data-dp-close")); return; }
    // לחיצה מחוץ ללוח סוגרת אותו
    $$(".dp.is-open").forEach(function (dp) { if (!dp.contains(t)) dpClose(dp.getAttribute("data-dp"), false); });
  });
  document.addEventListener("change", function (e) {
    var s = e.target.closest && e.target.closest("[data-dp-month]");
    if (!s) return;
    var fid = s.getAttribute("data-dp-month"), p = s.value.split("-");
    dpView[fid] = new Date(+p[0], +p[1], 1);
    dpRender(fid);
    $('[data-dp-month="' + fid + '"]').focus();
  });
  document.addEventListener("keydown", function (e) {
    var pop = e.target.closest && e.target.closest(".dp__pop");
    if (!pop) return;
    var fid = pop.id.replace(/^f-|-pop$/g, "");
    if (e.key === "Escape") { e.preventDefault(); dpClose(fid); return; }
    var day = e.target.closest(".dp__day");
    if (!day) return;
    var step = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    var cur = fromIso(day.getAttribute("data-iso")), next = null;
    if (step) next = addDays(cur, step);
    else if (e.key === "PageDown") next = new Date(cur.getFullYear(), cur.getMonth() + 1, Math.min(cur.getDate(), 28));
    else if (e.key === "PageUp") next = new Date(cur.getFullYear(), cur.getMonth() - 1, Math.min(cur.getDate(), 28));
    else if (e.key === "Home") next = addDays(cur, -cur.getDay());
    else if (e.key === "End") next = addDays(cur, 6 - cur.getDay());
    if (!next) return;
    e.preventDefault();
    var f = fieldDefAll(fid);
    if (next < today0() || next > dpMax(f)) return;
    var iso = isoOf(next), btn = $('.dp__day[data-iso="' + iso + '"]', pop);
    if (!btn) { dpView[fid] = new Date(next.getFullYear(), next.getMonth(), 1); dpRender(fid); btn = $('.dp__day[data-iso="' + iso + '"]', pop); }
    $$(".dp__day", pop).forEach(function (b) { b.tabIndex = -1; });
    if (btn) { btn.tabIndex = 0; btn.focus(); }
  });

  /* ---------- בניית שדה ---------- */
  function val(id) { return state.data[id]; }
  // שדה + כפתור "רעיון" (אם יש הצעות לשדה הזה)
  function field(f) {
    var h = fieldRaw(f), hb = helpBtn(f);
    if (!hb) return h;
    FIELD_DEF[f.id] = f;
    var iL = h.indexOf("</label>"), iG = h.indexOf("</legend>");
    var tag = iG < 0 || (iL > -1 && iL < iG) ? "</label>" : "</legend>";
    return h.replace(tag, tag + hb).replace(/class="field( |")/, function (m, c) { return 'class="field has-help' + c; });
  }
  function fieldRaw(f) {
    var id = "f-" + f.id;
    var req = f.required ? '<span class="req" aria-hidden="true"> *</span><span class="sr-only"> (חובה)</span>' : "";
    var hint = f.hint ? '<p class="field__hint" id="' + id + '-hint">' + esc(f.hint) + "</p>" : "";
    var err = '<p class="field__error" id="' + id + '-err" hidden></p>';
    var describe = (f.hint ? id + "-hint " : "") + id + "-err";
    var v = val(f.id);
    var common = ' data-key="' + f.id + '" aria-describedby="' + describe + '"' + (f.required ? ' aria-required="true"' : "");
    var ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "";

    if (f.type === "date") {
      return '<div class="field" data-field="' + f.id + '"><label class="field__label" for="' + id + '">' + esc(f.label) + req + "</label>" + hint +
        datePicker(f, id, describe, v) + err + "</div>";
    }
    if (f.type === "text" || f.type === "tel" || f.type === "number" || f.type === "date") {
      var extra = "";
      if (f.type === "date") extra += ' min="' + new Date().toISOString().slice(0, 10) + '"';
      if (f.type === "number") extra += ' inputmode="numeric" min="' + (f.min || 0) + '" max="' + (f.max || 999) + '"';
      if (f.type === "tel") extra += ' inputmode="tel" dir="ltr"';
      if (f.autocomplete) extra += ' autocomplete="' + f.autocomplete + '"';
      return '<div class="field" data-field="' + f.id + '"><label class="field__label" for="' + id + '">' + esc(f.label) + req + "</label>" + hint +
        '<input class="input" id="' + id + '" type="' + f.type + '"' + common + ph + extra + ' value="' + esc(v || "") + '" maxlength="' + (f.max && f.type !== "number" ? f.max : 140) + '">' + err + "</div>";
    }
    if (f.type === "textarea") {
      return '<div class="field" data-field="' + f.id + '"><label class="field__label" for="' + id + '">' + esc(f.label) + req + "</label>" + hint +
        '<textarea class="input input--area" id="' + id + '" rows="4" maxlength="1200"' + common + ph + ">" + esc(v || "") + "</textarea>" +
        (f.starters ? '<div class="starters" role="group" aria-label="משפטים שאפשר להוסיף למכתב">' + f.starters.map(function (t) {
          return '<button type="button" class="starter" data-starter="' + esc(t) + '" data-for="' + id + '">' + ico("plus") + esc(t) + "</button>";
        }).join("") + "</div>" : "") + err + "</div>";
    }
    if (f.type === "chips" || f.type === "multi") {
      var multi = f.type === "multi";
      var arr = multi ? (v || []) : [v];
      return '<fieldset class="field field--group" data-field="' + f.id + '" aria-describedby="' + describe + '"><legend class="field__label">' + esc(f.label) + req + "</legend>" + hint +
        '<div class="chips">' + f.options.map(function (o, i) {
          var on = arr.indexOf(o) > -1;
          return '<label class="chip"><input type="' + (multi ? "checkbox" : "radio") + '" name="' + id + '" value="' + esc(o) + '" data-key="' + f.id + '"' + (on ? " checked" : "") + (f.required && !multi && i === 0 ? ' aria-required="true"' : "") + "><span>" + ico("check", "chip__check") + esc(o) + "</span></label>";
        }).join("") + "</div>" + err + "</fieldset>";
    }
    if (f.type === "list") {
      var list = v || [];
      var rows = "";
      for (var i = 0; i < f.count; i++) {
        rows += '<div class="list-row"><span class="list-row__n" aria-hidden="true">' + (i + 1) + '</span><input class="input" id="' + id + "-" + i + '" type="text" data-key="' + f.id + '" data-i="' + i + '" aria-label="' + esc(f.label) + ", שורה " + (i + 1) + '"' + ph + ' value="' + esc(list[i] || "") + '" maxlength="140"></div>';
      }
      return '<fieldset class="field field--group" data-field="' + f.id + '"><legend class="field__label">' + esc(f.label) + "</legend>" + hint + '<div class="list">' + rows + "</div></fieldset>";
    }
    if (f.type === "quiz") {
      var qs = v || [];
      var blocks = "";
      for (var q = 0; q < f.count; q++) {
        var Q = qs[q] || {};
        var n = q + 1, base = id + "-" + q;
        blocks += '<div class="qblock"><p class="qblock__n">שאלה ' + n + "</p>" +
          '<label class="mini-label" for="' + base + '-q">השאלה</label><input class="input" id="' + base + '-q" data-key="' + f.id + '" data-i="' + q + '" data-part="q" value="' + esc(Q.q || "") + '" placeholder="למשל: מה ההזמנה הקבועה שלי בבית קפה?" maxlength="140">' +
          '<div class="qblock__answers">' +
          '<div><label class="mini-label" for="' + base + '-a">' + ico("check") + 'תשובה נכונה</label><input class="input" id="' + base + '-a" data-key="' + f.id + '" data-i="' + q + '" data-part="a" value="' + esc(Q.a || "") + '" maxlength="60"></div>' +
          '<div><label class="mini-label" for="' + base + '-w1">תשובה שגויה</label><input class="input" id="' + base + '-w1" data-key="' + f.id + '" data-i="' + q + '" data-part="w1" value="' + esc(Q.w1 || "") + '" maxlength="60"></div>' +
          '<div><label class="mini-label" for="' + base + '-w2">עוד תשובה שגויה</label><input class="input" id="' + base + '-w2" data-key="' + f.id + '" data-i="' + q + '" data-part="w2" value="' + esc(Q.w2 || "") + '" maxlength="60"></div>' +
          "</div></div>";
      }
      return '<fieldset class="field field--group" data-field="' + f.id + '"><legend class="field__label">' + esc(f.label) + "</legend>" + hint + blocks + "</fieldset>";
    }
    if (f.type === "notes") {
      var ns = v || [];
      var nrows = "";
      for (var k = 0; k < f.count; k++) {
        var N = ns[k] || {};
        var parts = f.parts || ["text", "from"], phs = f.ph || ["מה כתוב בפתק", "ממי"], labs = f.partLabels || ["הטקסט", "ממי"];
        var wideFirst = !f.parts;
        nrows += '<div class="note-row' + (wideFirst ? "" : " note-row--pair") + '"><span class="list-row__n" aria-hidden="true">' + (k + 1) + "</span>" +
          '<input class="input' + (wideFirst ? "" : " input--from") + '" id="' + id + "-" + k + '-a" data-key="' + f.id + '" data-i="' + k + '" data-part="' + parts[0] + '" aria-label="' + (k + 1) + ", " + esc(labs[0]) + '" placeholder="' + esc(phs[0]) + '" value="' + esc(N[parts[0]] || "") + '" maxlength="120">' +
          '<input class="input' + (wideFirst ? " input--from" : "") + '" id="' + id + "-" + k + '-b" data-key="' + f.id + '" data-i="' + k + '" data-part="' + parts[1] + '" aria-label="' + (k + 1) + ", " + esc(labs[1]) + '" placeholder="' + esc(phs[1]) + '" value="' + esc(N[parts[1]] || "") + '" maxlength="160"></div>';
      }
      return '<fieldset class="field field--group" data-field="' + f.id + '"><legend class="field__label">' + esc(f.label) + "</legend>" + hint + '<div class="list">' + nrows + "</div></fieldset>";
    }
    return "";
  }

  /* ---------- שלב 1: סוג ---------- */
  function renderType() {
    $("#step-type .types").innerHTML = O.types.map(function (t, i) {
      return '<label class="type-card" style="--i:' + i + '"><input type="radio" name="type" value="' + t.id + '"' + (state.type === t.id ? " checked" : "") + ">" +
        '<span class="type-card__ico" aria-hidden="true">' + ico(t.icon) + "</span>" +
        '<span class="type-card__text"><b>' + esc(t.label) + "</b><small>" + esc(t.desc) + "</small></span>" +
        '<span class="type-card__tick" aria-hidden="true">' + ico("check") + "</span></label>";
    }).join("");
  }

  /* ---------- שלב 2: הסיפור ---------- */
  function renderStory() {
    var T = typeDef();
    if (!T) return;
    $("#storyType").innerHTML = ico(T.icon) + esc(T.label);
    // השאלות מחולקות לקבוצות מתקפלות: רואים כותרת, הסבר קצר וכמה מולא
    var main = T.fields.filter(function (f) { return !f.more; }), more = T.fields.filter(function (f) { return f.more; });
    var groups = [{ id: "who", icon: "users", title: "למי ההפתעה", desc: "שם, פנייה וחתימה. 30 שניות.", fields: COMMON_TOP }];
    STORY_GROUPS.forEach(function (g) {
      var fs = main.filter(function (f) { return groupOf(f.id) === g.id; });
      if (fs.length) groups.push({ id: g.id, icon: g.icon, title: g.title, desc: g.desc, fields: fs });
    });
    if (more.length) groups.push({ id: "more", icon: "wand", title: "עוד רעיונות", desc: T.moreLabel || "רשות. למי שרוצה להוסיף עוד.", fields: more });
    groups.push({ id: "tone", icon: "music", title: "הטון", desc: "רומנטי, מצחיק, מרגש? עוזר לי לכתוב נכון.", fields: COMMON_BOTTOM });
    $("#step-story .fields").innerHTML = groups.map(function (g, i) {
      return acc(g.id, g.icon, g.title, g.desc, '<div class="fields">' + g.fields.map(field).join("") + "</div>", { open: i === 0, req: g.fields.some(function (f) { return f.required; }), fields: g.fields });
    }).join("");
    updateAcc();
  }

  /* ---------- אקורדיון: קבוצה מתקפלת עם סטטוס ---------- */
  var ACC_FIELDS = {};
  function acc(id, icon, title, desc, inner, o) {
    o = o || {};
    if (o.fields) ACC_FIELDS[id] = o.fields;
    return '<details class="acc" data-acc="' + id + '"' + (o.open ? " open" : "") + ">" +
      '<summary class="acc__sum"><span class="acc__ico" aria-hidden="true">' + ico(icon) + "</span>" +
      '<span class="acc__t"><b>' + esc(title) + (o.req ? '<span class="acc__req">חובה</span>' : "") + "</b><small>" + esc(desc) + "</small></span>" +
      '<span class="acc__state" data-acc-state="' + id + '"></span><span class="acc__chev" aria-hidden="true">' + ico("plus") + "</span></summary>" +
      '<div class="acc__body">' + inner + "</div></details>";
  }
  function isFilled(v) { return v != null && (Array.isArray(v) ? v.some(function (x) { return x && (typeof x === "object" ? Object.keys(x).some(function (k) { return String(x[k] || "").trim(); }) : String(x).trim()); }) : String(v).trim() !== ""); }
  // הסטטוס הקטן בכל כותרת: כמה מולא, או מה נבחר
  function updateAcc() {
    var d = state.data;
    $$("[data-acc-state]").forEach(function (el) {
      var id = el.getAttribute("data-acc-state"), txt = "", done = false;
      if (ACC_FIELDS[id] && STEPS[state.step].id === "story") {
        var fs = ACC_FIELDS[id], n = fs.filter(function (f) { return isFilled(d[f.id]); }).length;
        var reqOk = fs.every(function (f) { return !f.required || isFilled(d[f.id]); });
        done = n > 0 && reqOk;
        txt = n ? n + "/" + fs.length : "";
      } else if (id === "look") txt = (ENV.palettes[d.palette] || {}).label || "";
      else if (id === "parts") { var c = chosenParts().length; txt = c + "/" + maxParts(); done = c > 0; }
      else if (id === "music") txt = (O.moods.filter(function (m) { return m.id === d.mood; })[0] || {}).label || "";
      else if (id === "photos") { txt = state.photos.length ? state.photos.length + " תמונות" : ""; done = !!state.photos.length; }
      else if (id === "voice") { txt = state.voice ? fmtTime(state.voice.dur) : ""; done = !!state.voice; }
      else if (id === "plan") txt = (S.pricing.plans.filter(function (p) { return p.id === d.plan; })[0] || {}).name || "";
      else if (id === "addons") { txt = (d.addons || []).length ? (d.addons || []).length + " נבחרו" : ""; done = !!(d.addons || []).length; }
      else if (id === "you") { done = !!(d.name && d.phone && d.deadline); txt = done ? "מוכן" : ""; }
      el.textContent = txt;
      el.closest(".acc").classList.toggle("is-done", done);
    });
  }

  /* ---------- כפתור "רעיון" ---------- */
  var helpIdx = {}, helping = false;
  function helpList(fid) {
    var H = O.help || {}, T = typeDef();
    return (T && H[T.id] && H[T.id][fid]) || (H.common && H.common[fid]) || null;
  }
  // [נקבה|זכר|רבים] לפי הפנייה שנבחרה
  function gtxt(s) {
    var k = state.data.address === ADDR[1] ? 1 : state.data.address === ADDR[2] ? 2 : 0;
    return String(s).replace(/\[([^\]]*)\]/g, function (_, alt) { var p = alt.split("|"); return p[k] != null ? p[k] : p[0]; });
  }
  function helpBtn(f) {
    if (f.noHelp || ["text", "textarea", "list", "notes", "quiz"].indexOf(f.type) < 0 || !helpList(f.id)) return "";
    return '<button type="button" class="help-btn" data-help="' + f.id + '">' + ico("wand") + '<span class="help-btn__t">רעיון</span><span class="sr-only"> ל' + esc(f.label) + "</span></button>";
  }
  var FIELD_DEF = {};
  function applyHelp(fid) {
    var list = helpList(fid), f = FIELD_DEF[fid];
    if (!list || !f) return;
    var k = helpIdx[fid] || 0, first = null, filledN = 0;
    var set = function (inp, v) { if (!inp) return; inp.value = v; helping = true; inp.dispatchEvent(new Event("input", { bubbles: true })); helping = false; first = first || inp; };
    if (f.type === "text" || f.type === "textarea") {
      var el = $("#f-" + fid), v = gtxt(list[k % list.length]);
      if (f.type === "textarea" && el.value.trim() && !el.dataset.fromHelp) v = el.value.replace(/\s+$/, "") + "\n" + v;
      set(el, v); el.dataset.fromHelp = "1"; helpIdx[fid] = k + 1;
    } else if (f.type === "list") {
      var ins = $$('input[data-key="' + fid + '"]'), empty = ins.filter(function (i) { return !i.value.trim(); });
      var target = empty.length ? empty : ins;
      var used = ins.map(function (i) { return i.value; });
      var pool = list.map(gtxt).filter(function (x) { return used.indexOf(x) < 0; });
      if (!empty.length) pool = list.map(gtxt).slice(k % list.length).concat(list.map(gtxt).slice(0, k % list.length));
      target.forEach(function (inp, i) { if (pool[i] != null) set(inp, pool[i]); });
      helpIdx[fid] = k + 1;
    } else if (f.type === "notes" || f.type === "quiz") {
      var parts = f.type === "quiz" ? ["q", "a", "w1", "w2"] : (f.parts || ["text", "from"]);
      var cur = state.data[fid] || [];
      for (var i = 0; i < f.count; i++) {
        var row = cur[i] || {};
        if (row[parts[0]] && String(row[parts[0]]).trim()) { filledN++; continue; }
        var sug = list[(k + i) % list.length];
        parts.forEach(function (p) { set($('[data-key="' + fid + '"][data-i="' + i + '"][data-part="' + p + '"]'), gtxt(sug[p] || "")); });
        if (f.type === "quiz") break; // שאלה אחת בכל לחיצה
      }
      helpIdx[fid] = k + 1;
    }
    var b = $('[data-help="' + fid + '"] .help-btn__t');
    if (b) b.textContent = "רעיון אחר";
    if (first) { first.focus(); first.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
    var st = $("#helpStatus");
    if (st) { st.textContent = ""; var said = filledN === f.count && f.type !== "text" && f.type !== "textarea" ? "כל השורות כבר מלאות. אפשר לערוך אותן." : "הוספנו רעיון. אפשר לערוך אותו כמו שבא לכם."; setTimeout(function () { st.textContent = said; }, 50); }
    track("help_idea", { field: fid, type: state.type });
  }

  /* ---------- שלב 3: עיצוב ---------- */
  function renderDesign() {
    var T = typeDef();
    if (!T) return;
    var d = state.data;
    if (!d.palette) d.palette = DEF_PALETTE[T.id];
    if (!d.liner) d.liner = DEF_LINER[T.id];
    if (!d.mood) d.mood = DEF_MOOD[T.id];
    if (!d.elements) d.elements = defaultParts();
    var pals = Object.keys(ENV.palettes);
    var PD = partsDef();
    var chip = function (id, rec) {
      var e = O.elements.filter(function (x) { return x.id === id; })[0];
      if (!e) return "";
      return '<label class="chip chip--ico chip--part"><input type="checkbox" name="elements" value="' + e.id + '" data-key="elements"' + (d.elements.indexOf(e.id) > -1 ? " checked" : "") + "><span>" + ico(e.icon) + esc(e.label) + (rec ? '<em class="chip__rec">מומלץ</em>' : "") + "</span></label>";
    };
    var look =
      '<fieldset class="field field--group"><legend class="field__label">פלטת צבעים</legend><div class="swatches">' +
      pals.map(function (k) {
        var p = ENV.palettes[k];
        return '<label class="swatch"><input type="radio" name="palette" value="' + k + '" data-key="palette"' + (d.palette === k ? " checked" : "") + ">" +
          '<span class="swatch__chip" style="--a:' + p.swatch[0] + ";--b:" + p.swatch[1] + ";--c:" + p.swatch[2] + '" aria-hidden="true"><i></i><i></i><i></i></span><span class="swatch__label">' + esc(p.label) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<fieldset class="field field--group liners-field"><legend class="field__label">הבטנה בתוך המעטפה</legend><div class="liners">' +
      Object.keys(ENV.liners).map(function (k) {
        return '<label class="liner"><input type="radio" name="liner" value="' + k + '" data-key="liner"' + (d.liner === k ? " checked" : "") + '><span class="liner__chip env--liner-' + k + '" aria-hidden="true"><span class="env__liner"></span></span><span>' + esc(ENV.liners[k]) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<div class="field"><label class="field__label" for="f-mark">האות על חותם השעווה</label><p class="field__hint" id="f-mark-hint">בדרך כלל האות הראשונה של השם. ריק = לב.</p>' +
      '<input class="input input--short" id="f-mark" type="text" maxlength="2" data-key="mark" aria-describedby="f-mark-hint" value="' + esc(d.mark != null ? d.mark : (d.recipient || "").trim().charAt(0)) + '"></div>';
    var parts =
      '<fieldset class="field field--group parts-field" aria-describedby="partsHint"><legend class="sr-only">החלקים בהפתעה</legend>' +
      '<p class="field__hint" id="partsHint">סימנו את מה שהכי עובד ב' + esc(T.label) + ". עד " + maxParts() + " חלקים, כדי שלכל רגע יהיה מקום לנשום.</p>" +
      '<div class="chips chips--elements">' + PD.rec.map(function (id) { return chip(id, true); }).join("") + "</div>" +
      (PD.more.length ? '<details class="more-parts"><summary>' + ico("plus") + "עוד " + PD.more.length + " חלקים שמתאימים</summary>" +
        '<div class="chips chips--elements">' + PD.more.map(function (id) { return chip(id, false); }).join("") + "</div></details>" : "") +
      '<p class="parts-count" id="partsCount" aria-live="polite"></p></fieldset>' +
      '<div class="path"><p class="path__label">' + ico("eye") + "ככה זה ייראה, לפי הסדר:</p>" +
      '<p class="path__hint" id="pathHint">' + ico("grip") + "גררו חלק כדי להחליף מקום, או השתמשו בחצים. המעטפה תמיד פותחת והמכתב תמיד סוגר.</p>" +
      '<ol class="path__list" id="partsPath" aria-describedby="pathHint"></ol>' +
      '<button type="button" class="link-btn path__reset" id="pathReset" hidden>' + ico("replay") + "חזרה לסדר המומלץ</button>" +
      '<p class="sr-only" id="pathStatus" aria-live="polite"></p></div>';
    var music =
      '<fieldset class="field field--group"><legend class="sr-only">מוזיקה</legend><div class="chips">' +
      O.moods.map(function (m) {
        return '<label class="chip chip--ico"><input type="radio" name="mood" value="' + m.id + '" data-key="mood"' + (d.mood === m.id ? " checked" : "") + "><span>" + ico(m.icon) + esc(m.label) + "</span></label>";
      }).join("") + '</div><button type="button" class="link-btn" id="listenBtn">' + ico("music") + "להשמיע דוגמה</button></fieldset>" +
      field({ id: "song", type: "text", label: "שיר מסוים? (בחבילת פרימיום)", placeholder: "שם השיר והזמר", noHelp: true });
    var photos =
      '<div class="field"><p class="field__hint" id="photosHint">התמונות נשארות בטלפון שלכם ומשמשות רק לסקיצה. אותן שולחים לי אחר כך בווטסאפ.</p>' +
      '<div class="photos-pick"><input type="file" id="photoInput" class="file-input" accept="image/*" multiple aria-label="הוספת תמונות" aria-describedby="photosHint">' +
      '<label for="photoInput" class="btn btn--ghost btn--sm">' + ico("upload") + "הוספת תמונות</label>" +
      '<ul class="thumbs" id="thumbs" aria-label="התמונות שנבחרו"></ul></div></div>';
    var voice =
      '<div class="field voice-field"><p class="field__hint" id="voiceHint">ההקלטה נשמרת רק בטלפון שלכם, עד שתשלחו לי אותה.</p>' +
      '<div class="rec" id="rec" role="group" aria-label="הקלטה קולית" aria-describedby="voiceHint"></div>' +
      '<p class="sr-only" id="recStatus" aria-live="polite"></p></div>';
    var html =
      acc("look", "palette", "המראה של המעטפה", "צבעים, בטנה ואות על החותם.", look, { open: true }) +
      acc("parts", "sparkle", "מה יהיה בפנים", "החלקים שמי שמקבל עובר, לפי הסדר.", parts, { open: !isMobile() }) +
      acc("voice", "mic", "הודעה קולית", "לא אוהבים לכתוב? מקליטים כמה מילים. עד דקה וחצי.", voice) +
      acc("photos", "images", "תמונות לסקיצה", "רשות. לראות איך זה ייראה עם התמונות שלכם.", photos) +
      acc("music", "music", "מוזיקה", "מה מתנגן כשהמעטפה נפתחת.", music);
    $("#step-design .fields").innerHTML = html;
    ENV.applyPalette($("#step-design .fields"), d.palette);
    renderThumbs();
    renderRec();
    syncParts();
    updateAcc();
  }

  /* ---------- הקלטה קולית ---------- */
  var Rec = { media: null, stream: null, chunks: [], t0: 0, timer: null, raf: 0, actx: null, busy: false };
  function recSupported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
  function recMime() {
    var opts = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
    for (var i = 0; i < opts.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(opts[i])) return opts[i];
    return "";
  }
  function audioExt(type) { return /mp4|m4a|aac/.test(type) ? "m4a" : /ogg/.test(type) ? "ogg" : /mpeg|mp3/.test(type) ? "mp3" : /wav/.test(type) ? "wav" : "webm"; }
  function recSay(t) { var s = $("#recStatus"); if (s) { s.textContent = ""; setTimeout(function () { s.textContent = t; }, 50); } }
  function recError(t) {
    var box = $("#recErr");
    if (box) { box.hidden = false; box.innerHTML = ico("x") + "<span>" + esc(t) + "</span>"; }
    recSay(t);
  }
  function renderRec() {
    var host = $("#rec");
    if (!host) return;
    setTimeout(function () { if ($("#partsPath")) syncParts(); }, 0);
    var T = typeDef(), d = state.data, v = state.voice;
    var upload = '<input type="file" id="voiceFile" class="file-input" accept="audio/*" aria-label="העלאת קובץ הקלטה מהטלפון">';
    var err = '<p class="rec__err" id="recErr" role="alert" hidden></p>';
    if (Rec.media) {
      host.innerHTML = '<div class="rec__live">' +
        '<button type="button" class="rec__btn is-on" id="recStop">' + ico("stop") + '<span>סיום הקלטה</span></button>' +
        '<div class="rec__meter" aria-hidden="true"><span class="rec__dot"></span><span class="rec__bars">' + new Array(13).join("<i></i>") + "</span></div>" +
        '<p class="rec__time"><span id="recTime">0:00</span> / ' + fmtTime(VOICE_MAX) + "</p></div>" + err;
      return;
    }
    if (v) {
      host.innerHTML = '<div class="rec__done">' +
        '<audio controls preload="metadata" src="' + v.url + '" aria-label="ההקלטה שלכם"></audio>' +
        '<p class="rec__meta">' + ico("check") + "הוקלט · " + fmtTime(v.dur) + "</p>" +
        '<div class="rec__actions"><button type="button" class="btn btn--ghost btn--sm" id="recAgain">' + ico("replay") + 'הקלטה מחדש</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" id="recDel">' + ico("trash") + "מחיקה</button></div></div>" + err +
        field({ id: "voiceAt", type: "chips", label: "מתי ההקלטה מתנגנת?", options: VOICE_AT }) +
        field({ id: "voiceCaption", type: "text", label: "כמה מילים על מה שאמרתם (רשות)", hint: "יופיע ככתובית מתחת להקלטה, בשביל מי שלא יכול לשמוע ברגע זה.", placeholder: "למשל: רק רציתי שתשמעי את זה בקול שלי" });
      return;
    }
    host.innerHTML = '<p class="rec__idea">' + ico("sparkle") + esc(VOICE_IDEA[T ? T.id : "other"]) + "</p>" +
      '<div class="rec__start">' +
      (recSupported() ? '<button type="button" class="rec__btn" id="recStart">' + ico("mic") + "<span>להתחיל להקליט</span></button>" : "") +
      upload + '<label for="voiceFile" class="btn btn--ghost btn--sm">' + ico("upload") + (recSupported() ? "או להעלות הקלטה" : "העלאת הקלטה מהטלפון") + "</label></div>" + err;
    if (!recSupported()) recError("הדפדפן הזה לא מאפשר להקליט ישירות. אפשר להקליט בטלפון (למשל בהודעה קולית או בהקלטות) ולהעלות כאן את הקובץ.");
  }
  function startRec() {
    if (Rec.busy || Rec.media) return;
    Rec.busy = true;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      Rec.busy = false;
      var mime = recMime();
      var mr;
      try { mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch (e) { mr = new MediaRecorder(stream); }
      Rec.media = mr; Rec.stream = stream; Rec.chunks = []; Rec.t0 = Date.now();
      mr.ondataavailable = function (e) { if (e.data && e.data.size) Rec.chunks.push(e.data); };
      mr.onstop = function () {
        var dur = (Date.now() - Rec.t0) / 1000;
        var type = (mr.mimeType || mime || "audio/webm").split(";")[0];
        stopStream();
        Rec.media = null;
        if (dur < 1 || !Rec.chunks.length) { renderRec(); recError("ההקלטה קצרה מדי. נסו שוב, ודברו קצת יותר."); $("#recStart") && $("#recStart").focus(); return; }
        setVoice(new Blob(Rec.chunks, { type: type }), dur, "recorded");
      };
      mr.start(250);
      renderRec();
      meter(stream);
      $("#recStop").focus();
      recSay("מקליט. לחצו על \"סיום הקלטה\" כשתסיימו.");
      Rec.timer = setInterval(function () {
        var sec = (Date.now() - Rec.t0) / 1000, el = $("#recTime");
        if (el) el.textContent = fmtTime(sec);
        if (sec >= VOICE_MAX) stopRec();
        else if (Math.floor(sec) === VOICE_MAX - 10) recSay("נשארו 10 שניות");
      }, 250);
    }).catch(function (err) {
      Rec.busy = false;
      var n = err && err.name;
      recError(n === "NotAllowedError" || n === "SecurityError"
        ? "לא קיבלנו אישור להשתמש במיקרופון. אפשר לאשר בהגדרות הדפדפן ולנסות שוב, או להעלות הקלטה מהטלפון."
        : n === "NotFoundError" ? "לא מצאנו מיקרופון במכשיר הזה. אפשר להעלות הקלטה מהטלפון."
          : "ההקלטה לא עבדה בדפדפן הזה (קורה בדפדפן שבתוך אינסטגרם או טיקטוק). פתחו את הקישור בכרום או בספארי, או העלו הקלטה מהטלפון.");
    });
  }
  function stopRec() {
    clearInterval(Rec.timer);
    cancelAnimationFrame(Rec.raf);
    if (Rec.media && Rec.media.state !== "inactive") Rec.media.stop();
  }
  function stopStream() {
    if (Rec.stream) Rec.stream.getTracks().forEach(function (t) { t.stop(); });
    Rec.stream = null;
    if (Rec.actx) { try { Rec.actx.close(); } catch (e) { /* */ } Rec.actx = null; }
  }
  // מד עוצמה קטן בזמן ההקלטה, כדי לראות שהמיקרופון שומע
  function meter(stream) {
    if (reduced()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      Rec.actx = new AC();
      var an = Rec.actx.createAnalyser();
      an.fftSize = 64;
      Rec.actx.createMediaStreamSource(stream).connect(an);
      var buf = new Uint8Array(an.frequencyBinCount);
      var loop = function () {
        var bars = $$(".rec__bars i");
        if (!bars.length || !Rec.media) return;
        an.getByteFrequencyData(buf);
        bars.forEach(function (b, i) { var v = buf[(i + 1) % buf.length] / 255; b.style.transform = "scaleY(" + (0.15 + v * 0.95).toFixed(2) + ")"; });
        Rec.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { /* בלי מד */ }
  }
  function setVoice(blob, dur, how) {
    clearVoice(true);
    state.voice = { blob: blob, url: URL.createObjectURL(blob), dur: dur, type: blob.type || "audio/webm" };
    var d = state.data;
    d.elements = d.elements || (typeDef() ? typeDef().elements.slice() : []);
    if (d.elements.indexOf("voice") < 0) d.elements.push("voice");
    var cb = $('input[name="elements"][value="voice"]');
    if (cb) cb.checked = true;
    if (!d.voiceAt) d.voiceAt = VOICE_AT[0];
    saveDraft();
    IDB.put("voice", { blob: blob, dur: dur, type: state.voice.type });
    renderRec();
    renderPath();
    var again = $("#recAgain");
    if (again) again.focus();
    recSay("ההקלטה נשמרה, " + fmtTime(dur) + " דקות. אפשר להאזין לה כאן.");
    track("voice_added", { how: how, seconds: Math.round(dur) });
  }
  function clearVoice(silent) {
    if (state.voice) URL.revokeObjectURL(state.voice.url);
    state.voice = null;
    if (!silent) {
      IDB.del("voice");
      var d = state.data;
      if (d.elements) d.elements = d.elements.filter(function (x) { return x !== "voice"; });
      var cb = $('input[name="elements"][value="voice"]');
      if (cb) cb.checked = false;
      saveDraft();
      renderPath();
    }
  }
  function addVoiceFile(f) {
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(m4a|mp3|wav|ogg|opus|aac|webm)$/i.test(f.name)) { recError("זה לא נראה כמו קובץ שמע. בחרו הקלטה (m4a, mp3, wav)."); return; }
    if (f.size > 15 * 1024 * 1024) { recError("הקובץ גדול מדי (מעל 15MB). נסו הקלטה קצרה יותר."); return; }
    var url = URL.createObjectURL(f), a = new Audio();
    var done = function (dur) { URL.revokeObjectURL(url); setVoice(f, dur, "upload"); };
    a.preload = "metadata";
    a.onloadedmetadata = function () { done(isFinite(a.duration) ? a.duration : 0); };
    a.onerror = function () { done(0); };
    a.src = url;
  }

  // אחסון ההקלטה בדפדפן (IndexedDB), כדי שלא תיעלם ברענון
  var IDB = {
    db: function () {
      return new Promise(function (res, rej) {
        if (!window.indexedDB) return rej(new Error("no idb"));
        var r = indexedDB.open("matanot", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
    },
    run: function (mode, fn) {
      return this.db().then(function (db) {
        return new Promise(function (res, rej) {
          var tx = db.transaction("files", mode), req = fn(tx.objectStore("files"));
          tx.oncomplete = function () { res(req && req.result); db.close(); };
          tx.onerror = function () { rej(tx.error); db.close(); };
        });
      }).catch(function () { return null; });
    },
    put: function (k, v) { return this.run("readwrite", function (s) { return s.put(v, k); }); },
    get: function (k) { return this.run("readonly", function (s) { return s.get(k); }); },
    del: function (k) { return this.run("readwrite", function (s) { return s.delete(k); }); },
  };

  /* ---------- החלקים: המלצה לפי סוג, ותקרה כדי שההפתעה תישאר ממוקדת ---------- */
  function isMobile() { return window.matchMedia("(max-width: 639px)").matches; }
  function partsDef() {
    var T = typeDef();
    return (O.parts && O.parts[T.id]) || { rec: T.elements.filter(function (x) { return x !== "envelope" && x !== "final"; }), more: [] };
  }
  function allowedParts() { var P = partsDef(); return P.rec.concat(P.more); }
  function planParts(id) { var p = S.pricing.plans.filter(function (x) { return x.id === (id || "premium"); })[0]; return (p && p.parts) || 5; }
  function maxParts() { return Math.max.apply(null, S.pricing.plans.map(function (p) { return p.parts || 5; })); }
  // מה שנבחר, לפי הסדר המומלץ, וקטוע לפי החבילה
  function chosenParts(all) {
    var al = allowedParts(), d = state.data;
    var c = (d.elements || defaultParts()).filter(function (x) { return al.indexOf(x) > -1; });
    c.sort(function (a, b) { return al.indexOf(a) - al.indexOf(b); });
    return all ? c : c.slice(0, planParts(d.plan || "premium"));
  }
  // ברירת מחדל: המומלצים, ועוד חלק אם כבר כתבו לו תוכן בשלב הסיפור
  function defaultParts() {
    var d = state.data, al = allowedParts(), list = partsDef().rec.slice();
    var BY_DATA = { reasons: "reasons", openWhen: "openwhen", coupons: "coupons", wheel: "wheel", quiz: "quiz", notes: "notes", promises: "notes", gift: "scratch" };
    Object.keys(BY_DATA).forEach(function (k) {
      var p = BY_DATA[k];
      if (isFilled(d[k]) && al.indexOf(p) > -1 && list.indexOf(p) < 0 && list.length < maxParts()) list.push(p);
    });
    return list;
  }
  var STEP_LABEL = { envelope: ["envelope", "המעטפה"], message: ["letter", "הודעה אישית"], voice: ["mic", "הודעה קולית"], choice: ["question", "שאלה"] };
  function stepLabel(s) {
    if (s.type === "final") return s.variant === "ticket" ? ["ticket", "כרטיס טיסה"] : s.variant === "invite" ? ["glass", "הזמנה רשמית"] : ["letter", "המכתב בסוף"];
    if (STEP_LABEL[s.type]) return STEP_LABEL[s.type];
    var e = O.elements.filter(function (x) { return x.id === s.type; })[0];
    return e ? [e.icon, e.label.replace(/"/g, "")] : ["sparkle", s.type];
  }
  function syncParts() {
    var d = state.data, max = maxParts(), n = chosenParts(true).length, full = n >= max;
    $$('input[name="elements"]').forEach(function (i) {
      var lock = full && !i.checked;
      i.disabled = lock;
      i.closest(".chip").classList.toggle("is-locked", lock);
    });
    var c = $("#partsCount");
    if (c) c.textContent = full ? "בחרתם " + n + " מתוך " + max + ". רוצים חלק אחר? הורידו אחד קודם." : "נבחרו " + n + " מתוך " + max + " (בחבילה הבסיסית: " + planParts("basic") + ")";
    renderPath();
    updateAcc();
  }

  /* ---------- הסדר: המעטפה תמיד ראשונה והמכתב תמיד אחרון, כל מה שבאמצע אפשר לגרור ---------- */
  // מפתח קבוע לכל שלב לפי הסדר המומלץ (photos, reasons, message2 אם יש שניים...)
  function keyStepsAndOrder(steps) {
    var seen = {};
    steps.forEach(function (s) { var n = seen[s.type] = (seen[s.type] || 0) + 1; s._k = n > 1 ? s.type + n : s.type; });
    var ord = state.data.order;
    if (!ord || !ord.length || steps.length < 4) return steps;
    var mid = steps.slice(1, -1), pos = function (s) { return ord.indexOf(s._k); };
    // מה שהמשתמש סידר תופס את המקומות שלו לפי הסדר שלו; חלק חדש נכנס במקום המומלץ שלו
    var known = mid.filter(function (s) { return pos(s) > -1; }).sort(function (a, b) { return pos(a) - pos(b); });
    var j = 0;
    mid = mid.map(function (s) { return pos(s) > -1 ? known[j++] : s; });
    mid.forEach(function (s, i) { if (s.type === "runaway" && s.cta === "לפרטים" && i < mid.length - 1) s.cta = "ממשיכים"; });
    return [steps[0]].concat(mid, [steps[steps.length - 1]]);
  }
  function renderPath() {
    var path = $("#partsPath");
    if (!path) return;
    var steps = buildDemo().steps, last = steps.length - 1, total = steps.length;
    path.innerHTML = steps.map(function (s, i) {
      var l = stepLabel(s), head = '<span class="path__n" aria-hidden="true">' + (i + 1) + '</span><span class="path__ico" aria-hidden="true">' + ico(l[0]) + '</span><span class="path__name">' + esc(l[1]) + "</span>";
      if (i === 0 || i === last) return '<li class="path__item is-fixed" style="--i:' + i + '"><span class="path__grip" aria-hidden="true"></span>' + head + '<span class="path__pin">' + ico("lock") + (i === 0 ? "תמיד ראשונה" : "תמיד בסוף") + "</span></li>";
      return '<li class="path__item" data-k="' + esc(s._k) + '" data-name="' + esc(l[1]) + '" style="--i:' + i + '"><span class="path__grip" aria-hidden="true">' + ico("grip") + "</span>" + head +
        '<span class="path__mv"><button type="button" data-mv="-1">' + ico("chev-up") + '</button><button type="button" data-mv="1">' + ico("chev-down") + "</button></span></li>";
    }).join("");
    path.setAttribute("data-total", total);
    renumberPath();
    requestAnimationFrame(function () { path.classList.add("is-ready"); });
    var rs = $("#pathReset");
    if (rs) rs.hidden = !(state.data.order && state.data.order.length);
  }
  function movables() { return $$("#partsPath .path__item:not(.is-fixed)"); }
  function renumberPath() {
    var all = $$("#partsPath .path__item"), mv = movables(), total = all.length;
    all.forEach(function (li, i) { var n = li.querySelector(".path__n"); if (n) n.textContent = i + 1; });
    mv.forEach(function (li, i) {
      var name = li.getAttribute("data-name"), place = all.indexOf(li) + 1;
      var up = li.querySelector('[data-mv="-1"]'), dn = li.querySelector('[data-mv="1"]');
      up.disabled = i === 0; dn.disabled = i === mv.length - 1;
      up.setAttribute("aria-label", "להקדים את " + name + " (עכשיו במקום " + place + " מתוך " + total + ")");
      dn.setAttribute("aria-label", "לדחות את " + name + " (עכשיו במקום " + place + " מתוך " + total + ")");
    });
  }
  function saveOrder(li) {
    state.data.order = movables().map(function (x) { return x.getAttribute("data-k"); });
    renumberPath();
    var rs = $("#pathReset");
    if (rs) rs.hidden = false;
    if (li) {
      var place = $$("#partsPath .path__item").indexOf(li) + 1;
      var st = $("#pathStatus");
      if (st) { st.textContent = ""; setTimeout(function () { st.textContent = li.getAttribute("data-name") + " עבר למקום " + place; }, 50); }
      li.classList.remove("is-moved"); void li.offsetWidth; li.classList.add("is-moved");
    }
    saveDraft();
  }
  function moveBy(li, dir) {
    var mv = movables(), i = mv.indexOf(li), j = i + dir;
    if (j < 0 || j >= mv.length) return;
    var before = li.getBoundingClientRect().top;
    li.parentNode.insertBefore(li, dir < 0 ? mv[j] : mv[j].nextSibling);
    flip(li, before);
    saveOrder(li);
  }
  // אנימציה קטנה: הפריט "מחליק" מהמקום הישן לחדש
  function flip(li, before) {
    if (reduced()) return;
    var dy = before - li.getBoundingClientRect().top;
    if (!dy) return;
    li.style.transition = "none"; li.style.transform = "translateY(" + dy + "px)";
    void li.offsetWidth;
    li.style.transition = ""; li.style.transform = "";
  }
  // גרירה עם אצבע או עכבר (Pointer Events: עובד גם בטלפון, שם גוררים מהידית)
  var Drag = null;
  function pathDown(e) {
    var li = e.target.closest(".path__item");
    if (!li || li.classList.contains("is-fixed") || e.target.closest(".path__mv") || e.button > 0) return;
    if (e.pointerType !== "mouse" && !e.target.closest(".path__grip")) return; // בטלפון: נגיעה בשורה עדיין גוללת את הדף
    e.preventDefault();
    Drag = { li: li, list: li.parentNode, id: e.pointerId, y0: e.clientY + window.scrollY, moved: false, start: movables().indexOf(li) };
    try { li.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    li.classList.add("is-drag");
    Drag.list.classList.add("is-dragging");
    if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) try { navigator.vibrate(8); } catch (err) { /* */ }
  }
  function pathMove(e) {
    if (!Drag || e.pointerId !== Drag.id) return;
    var li = Drag.li, cy = e.clientY;
    // גלילה אוטומטית ליד הקצוות
    if (cy < 70) window.scrollBy(0, -10); else if (cy > window.innerHeight - 70) window.scrollBy(0, 10);
    var mv = movables(), i = mv.indexOf(li), nb = null, down = false;
    if (mv[i + 1]) { var r1 = mv[i + 1].getBoundingClientRect(); if (cy > r1.top + r1.height / 2) { nb = mv[i + 1]; down = true; } }
    if (!nb && mv[i - 1]) { var r0 = mv[i - 1].getBoundingClientRect(); if (cy < r0.top + r0.height / 2) nb = mv[i - 1]; }
    if (nb) {
      var nTop = nb.getBoundingClientRect().top, t0 = li.offsetTop;
      Drag.list.insertBefore(li, down ? nb.nextSibling : nb);
      Drag.y0 += li.offsetTop - t0;
      flip(nb, nTop);
      Drag.moved = true;
      renumberPath();
    }
    var dy = cy + window.scrollY - Drag.y0;
    if (Math.abs(dy) > 3) Drag.moved = true;
    li.style.transition = "none";
    li.style.transform = "translateY(" + dy + "px)";
  }
  function pathUp(e) {
    if (!Drag || e.pointerId !== Drag.id) return;
    var D = Drag; Drag = null;
    var li = D.li;
    li.classList.remove("is-drag");
    D.list.classList.remove("is-dragging");
    li.style.transition = ""; li.style.transform = "";
    if (movables().indexOf(li) !== D.start) saveOrder(li);
  }

  function renderThumbs() {
    var ul = $("#thumbs");
    if (!ul) return;
    setTimeout(updateAcc, 0);
    ul.innerHTML = state.photos.map(function (p, i) {
      return '<li><img src="' + p.url + '" alt="תמונה ' + (i + 1) + '" width="72" height="72"><button type="button" class="thumb__x" data-rm="' + i + '" aria-label="הסרת תמונה ' + (i + 1) + '">' + ico("x") + "</button></li>";
    }).join("");
  }

  /* ---------- שלב 4: פרטים ---------- */
  function renderDetails() {
    var d = state.data;
    if (!d.plan) d.plan = "premium";
    if (!d.addons) d.addons = [];
    if (!d.extras) d.extras = [EXTRAS[0]];
    var P = S.pricing;
    var byId = function (id) { return DETAILS.filter(function (f) { return f.id === id; })[0]; };
    var planHtml = '<fieldset class="field field--group"><legend class="sr-only">חבילה</legend><div class="plan-pick">' +
      P.plans.map(function (p) {
        var now = planPrice(p);
        return '<label class="plan-opt' + (p.popular ? " plan-opt--pop" : "") + '"><input type="radio" name="plan" value="' + p.id + '" data-key="plan"' + (d.plan === p.id ? " checked" : "") + ">" +
          "<span><b>" + esc(p.name) + "</b><small>" + esc(p.description) + "</small></span>" +
          '<span class="plan-opt__price">' + (promo ? '<del><span class="sr-only">במקום </span>' + p.price + " ₪</del>" : "") + "<strong>" + now + " ₪</strong></span></label>";
      }).join("") + "</div></fieldset>" + '<p class="plan-note" id="planNote" hidden></p>';
    var addonsHtml = '<fieldset class="field field--group"><legend class="sr-only">תוספות</legend><div class="addon-pick">' +
      P.addons.map(function (a) {
        return '<label class="addon-opt"><input type="checkbox" name="addons" value="' + a.id + '" data-key="addons"' + (d.addons.indexOf(a.id) > -1 ? " checked" : "") + ">" +
          '<span class="addon-opt__box" aria-hidden="true">' + ico("check") + "</span>" + ico(a.icon, "addon-opt__ico") + "<span>" + esc(a.name) + '</span><strong dir="ltr">+' + a.price + " ₪</strong></label>";
      }).join("") + "</div></fieldset>";
    var you = '<div class="fields">' + ["deadline", "name", "phone"].map(function (id) { return field(byId(id)); }).join("") + "</div>";
    var extra = '<div class="fields">' + ["extras", "notes", "source"].map(function (id) { return field(byId(id)); }).join("") + "</div>";
    var html =
      acc("plan", "star", "חבילה", "כמה חלקים, כמה תמונות וכמה סבבי תיקונים.", planHtml, { open: true }) +
      acc("you", "call", "הפרטים שלכם", "עד מתי צריך, ואיך לחזור אליכם.", you, { open: true, req: true }) +
      acc("addons", "plus", "תוספות", "דומיין אישי, אנימציה מיוחדת או אקספרס.", addonsHtml) +
      acc("extra", "sparkle", "עוד כמה דברים קטנים", "כפתור תגובה, תזכורת לשנה הבאה והערות.", extra) +
      '<div class="total" aria-live="polite" id="total"></div>';
    $("#step-details .fields").innerHTML = html;
    updateTotal();
    updateAcc();
  }
  function totals() {
    var d = state.data, P = S.pricing;
    var plan = P.plans.filter(function (p) { return p.id === d.plan; })[0] || P.plans[0];
    var adds = P.addons.filter(function (a) { return (d.addons || []).indexOf(a.id) > -1; });
    var sum = planPrice(plan) + adds.reduce(function (s, a) { return s + a.price; }, 0);
    var full = plan.price + adds.reduce(function (s, a) { return s + a.price; }, 0);
    return { plan: plan, adds: adds, sum: sum, full: full };
  }
  function updateTotal() {
    var el = $("#total");
    if (!el) return;
    var t = totals();
    var pn = $("#planNote");
    if (pn) {
      var all = chosenParts(true), lim = planParts(state.data.plan);
      var lbl = function (id) { var e = O.elements.filter(function (x) { return x.id === id; })[0]; return e ? e.label.replace(/"/g, "") : id; };
      pn.hidden = all.length <= lim;
      if (all.length > lim) pn.innerHTML = ico("sparkle") + "<span>בחבילה הזו נכנסים " + lim + " חלקים: " + esc(all.slice(0, lim).map(lbl).join(", ")) + ". <b>" + esc(all.slice(lim).map(lbl).join(", ")) + "</b> נכנס" + (all.length - lim > 1 ? "ים" : "") + " רק בפרימיום.</span>";
    }
    el.innerHTML = '<span>סה"כ משוער</span><strong>' + t.sum + " ₪</strong>" + (promo && t.full > t.sum ? '<small>חסכתם ' + (t.full - t.sum) + " ₪ במבצע</small>" : "");
  }

  /* ---------- תצוגת המעטפה החיה ---------- */
  var livePal = null;
  function updateLive() {
    var host = $("#liveEnv");
    if (!host) return;
    var d = state.data, T = typeDef();
    var pal = d.palette || (T ? DEF_PALETTE[T.id] : "blush");
    var mark = d.mark != null ? d.mark : (d.recipient || "").trim().charAt(0);
    host.innerHTML = ENV.html({
      label: "הדגמת פתיחת המעטפה", mark: mark, liner: d.liner || (T ? DEF_LINER[T.id] : "dots"),
      to: d.recipient ? "ל" + d.recipient : "",
      cardIcon: T ? T.icon : "heart", cardTitle: d.recipient ? "ל" + d.recipient : "למי שאתם אוהבים", cardText: T ? T.label : "",
    });
    ENV.applyPalette(host.firstChild, pal);
    var theme = ENV.palettes[pal].theme;
    var screen = $("#liveScreen");
    screen.style.background = theme.bg;
    screen.style.setProperty("--ink-live", theme.ink);
    $("#liveTo").textContent = d.recipient ? "" : "השם יופיע על המעטפה";
    if (livePal !== pal) { livePal = pal; screen.classList.remove("is-swap"); void screen.offsetWidth; screen.classList.add("is-swap"); }
  }

  /* ---------- איסוף ערכים ---------- */
  function onInput(e) {
    var t = e.target, key = t.getAttribute("data-key");
    if (!key) return;
    var d = state.data;
    if (t.type === "checkbox") {
      var arr = $$('input[data-key="' + key + '"]').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
      d[key] = arr;
    } else if (t.hasAttribute("data-i")) {
      var i = +t.getAttribute("data-i"), part = t.getAttribute("data-part");
      d[key] = d[key] || [];
      if (part) { d[key][i] = d[key][i] || {}; d[key][i][part] = t.value; } else d[key][i] = t.value;
    } else if (t.type === "radio") {
      if (t.checked) d[key] = t.value;
    } else d[key] = t.value;

    if (key === "palette") ENV.applyPalette($("#step-design .fields"), d.palette);
    if (key === "addons" || key === "plan") updateTotal();
    if (key === "elements") syncParts();
    if (key === "voiceAt" && d.order) { d.order = d.order.filter(function (x) { return x !== "voice"; }); renderPath(); }
    if (key === "recipient" && d.mark == null) { var m = $("#f-mark"); if (m) m.value = (t.value || "").trim().charAt(0); }
    if (t.closest(".field") && t.closest(".field").classList.contains("has-error")) validateField(t.closest("[data-field]"));
    if (["palette", "liner", "mark", "recipient"].indexOf(key) > -1) updateLive();
    if (!helping && t.dataset) delete t.dataset.fromHelp;
    updateAcc();
    saveDraft();
  }
  var saveTimer;
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { store(DRAFT, { type: state.type, data: state.data, visited: state.visited }); }, 300);
  }

  /* ---------- בדיקות ---------- */
  function fieldDefs() {
    var T = typeDef();
    var id = STEPS[state.step].id;
    if (id === "story") return COMMON_TOP.concat(T.fields, COMMON_BOTTOM);
    if (id === "details") return DETAILS;
    return [];
  }
  function problem(f) {
    var v = state.data[f.id];
    if (f.required && (v == null || String(v).trim() === "")) {
      return f.type === "chips" ? "צריך לבחור אחת מהאפשרויות" : "צריך למלא את השדה הזה";
    }
    if (f.validate === "phone" && v) {
      var digits = String(v).replace(/[^\d+]/g, "").replace(/^\+972/, "0");
      if (!/^0\d{8,9}$/.test(digits)) return "מספר טלפון לא תקין. למשל: 050-1234567";
    }
    if (f.type === "date" && v) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(v) < today) return "התאריך כבר עבר";
    }
    return "";
  }
  function validateField(wrap) {
    if (!wrap) return true;
    var f = fieldDefs().filter(function (x) { return x.id === wrap.getAttribute("data-field"); })[0];
    if (!f) return true;
    var msg = problem(f);
    var err = $("#f-" + f.id + "-err");
    wrap.classList.toggle("has-error", !!msg);
    $$("input,textarea,.dp__btn", wrap).forEach(function (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); });
    if (err) { err.hidden = !msg; err.innerHTML = msg ? ico("x") + esc(msg) : ""; }
    return !msg;
  }
  function validateStep() {
    var sec = $("#step-" + STEPS[state.step].id);
    var box = $(".wz-errors", sec);
    var bad = [];
    if (STEPS[state.step].id === "type" && !state.type) bad.push({ id: "type", label: "בחרו סוג הפתעה", target: 'input[name="type"]' });
    fieldDefs().forEach(function (f) {
      var wrap = $('[data-field="' + f.id + '"]', sec);
      if (!validateField(wrap)) bad.push({ id: f.id, label: f.label + ": " + problem(f), target: "#f-" + f.id + ', input[name="f-' + f.id + '"]' });
    });
    if (!bad.length) { box.hidden = true; box.innerHTML = ""; return true; }
    $$(".acc", sec).forEach(function (a) { if ($(".has-error", a)) a.open = true; });
    box.hidden = false;
    box.innerHTML = '<h3 class="wz-errors__title">' + ico("x") + "רגע, חסר משהו (" + bad.length + ")</h3><ul>" +
      bad.map(function (b) { return '<li><a href="#" data-target="' + esc(b.target) + '">' + esc(b.label) + "</a></li>"; }).join("") + "</ul>";
    box.focus();
    return false;
  }

  /* ---------- מעבר בין שלבים ---------- */
  function go(n, opts) {
    opts = opts || {};
    if (n < 0 || n >= STEPS.length) return;
    if (Rec.media) stopRec();
    if (!opts.silent || n > 0) track("order_step", { step: STEPS[n].id, n: n + 1, type: state.type || "" });
    state.step = n;
    state.visited = Math.max(state.visited, n);
    var id = STEPS[n].id;
    if (id === "story") renderStory();
    if (id === "design") renderDesign();
    if (id === "details") renderDetails();
    if (id === "sketch") renderSketch();
    $$(".wz-step").forEach(function (s) {
      var on = s.id === "step-" + id;
      s.hidden = !on;
      if (on && !reduced()) { s.classList.remove("is-in"); void s.offsetWidth; s.classList.add("is-in"); }
    });
    $("#wizard").setAttribute("data-step", id);
    document.body.setAttribute("data-step", id);
    $$(".stepper li").forEach(function (li, i) {
      li.classList.toggle("is-done", i < n);
      li.classList.toggle("is-current", i === n);
      var b = $("button", li);
      b.disabled = i > state.visited || (i > 0 && !state.type);
      if (i === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    $("#progressFill").style.width = (n / (STEPS.length - 1)) * 100 + "%";
    updateLive();
    saveDraft();
    if (!opts.silent) {
      var h = $("#step-" + id + " h2");
      var top = $("#wizard").getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: reduced() ? "auto" : "smooth" });
      setTimeout(function () { h.focus({ preventScroll: true }); }, reduced() ? 0 : 200);
    }
  }

  /* =========================================================
     הסקיצה: הופכים את הטופס לאתר הפתעה אמיתי
     ========================================================= */
  function lines(s) { return String(s || "").split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function filled(a) { return (a || []).filter(function (x) { return x && String(x).trim(); }); }
  function buildDemo() {
    var d = state.data, T = typeDef(), t = T.id;
    var G = function (f, m, p) { return d.address === ADDR[0] ? f : d.address === ADDR[1] ? m : p; };
    var name = (d.recipient || "").trim() || "אהובה";
    var nick = (d.nickname || "").trim() || name;
    var sign = (d.from || "").trim();
    var el = chosenParts();
    var has = function (x) { return x === "envelope" || x === "final" || el.indexOf(x) > -1; };
    var pics = state.photos.map(function (p) { return p.url; });
    var caps = filled(d.memories);
    var letter = lines(d.letter);
    var steps = [];
    var used = {};
    function push(s) { used[s.type] = true; steps.push(s); }

    var CARD = {
      partner: ["שאלה קטנה", "רק כן או כן"], proposal: ["ל" + name, "תפתח" + G("י", "", "ו") + " לאט"], birthday: ["מזל טוב!", d.age ? "סוף סוף " + d.age : "יום מיוחד"],
      sorry: ["דגל לבן", "מגיע בשלום"], baby: ["חדשות טובות", G("תשבי רגע", "תשב רגע", "תשבו רגע")], friend: ["דחוף!!!", "לפתוח עכשיו"],
      thanks: [d.group ? "מ" + d.group : "תודה", "באהבה"], family: ["ל" + name, "מכל הלב"], other: [d.occasion || "הפתעה", "בשבילך"],
    }[t];
    var TITLE = {
      partner: "מישהו רוצה לשאול אותך משהו", proposal: "יש לי משהו להגיד לך", birthday: "יש לך דואר!", sorry: "אפשר רגע?",
      baby: "יש לנו חדשות...", friend: "דחוף!!! " + G("תפתחי", "תפתח", "תפתחו"), thanks: "יש לך דואר", family: "מישהו חושב עליך", other: "יש לך הודעה",
    }[t];
    push({ type: "envelope", to: "ל" + name, title: TITLE, mark: d.mark != null ? d.mark : name.charAt(0), card: { icon: T.icon, title: CARD[0], text: CARD[1] }, hint: G("הקישי על החותם", "הקש על החותם", "הקישו על החותם") });

    function album(title, sub) {
      var n = Math.max(caps.length, pics.length);
      if (!n) n = 3;
      var items = [];
      for (var i = 0; i < Math.min(n, 8); i++) items.push({ src: pics[i] || "", caption: caps[i] || "רגע " + (i + 1) });
      return { type: "photos", icon: "camera", title: title, sub: sub, items: items, doneText: "ואלה רק חלק קטן" };
    }
    function quiz(title, fallback) {
      var qs = (d.quiz || []).filter(function (q) { return q && q.q && q.a; }).map(function (q) {
        var opts = [q.a, q.w1, q.w2].filter(Boolean);
        var shift = (q.q.length % opts.length);
        var rot = opts.slice(shift).concat(opts.slice(0, shift));
        return { q: q.q, options: rot, correct: rot.indexOf(q.a), right: "נכון!", wrong: "לא בדיוק... " + G("נסי", "נסה", "נסו") + " שוב" };
      });
      if (!qs.length) qs = fallback;
      return { type: "quiz", icon: "question", title: title, questions: qs, doneText: "טוב, ברור. ממשיכים...", cta: "ממשיכים" };
    }
    function finalLetter(icon, title, fallback) {
      return { type: "final", variant: "card", icon: icon, title: title, text: letter.length ? letter : fallback, sign: sign };
    }
    var defaultQuiz = [{ q: "מי הכי מכיר" + G("ה", "", "ים") + " אותך?", options: ["אני", "אני", "גם אני"], correct: -1, right: "ברור שאני" }];

    if (t === "partner") {
      push({ type: "message", icon: "hearts", title: nick + ", " + (d.together ? d.together + " ביחד" : "יש לי משהו בשבילך"),
        text: filled([d.howMet, d.insideJoke ? "ו... \"" + d.insideJoke + "\"" : ""]).concat(d.howMet || d.insideJoke ? [] : ["הכנתי לך משהו קטן. " + G("מוכנה?", "מוכן?", "מוכנים?")]) });
      if (has("photos")) push(album("הרגעים שלנו"));
      var whys = filled(d.loves).concat(filled(d.reasons));
      if (has("reasons")) push({ type: "reasons", title: G("למה דווקא את?", "למה דווקא אתה?", "למה דווקא אתם?"), sub: G("הקישי", "הקש", "הקישו") + " על כל קלף", items: whys.length ? whys.slice(0, 8) : ["הצחוק שלך", "החיבוקים", "שאת" + G("", "ה", "ם") + " תמיד שם", "הכל"] });
      var ows = (d.openWhen || []).filter(function (o) { return o && o.when; });
      if (has("openwhen")) push({ type: "openwhen", title: "מעטפות לימים שאני לא לידך", prefix: G("תפתחי כש...", "תפתח כש...", "תפתחו כש..."), items: ows.length ? ows.map(function (o) { return { when: o.when, text: o.text || "..." }; }) : [{ when: G("את עצובה", "אתה עצוב", "אתם עצובים"), text: "אני בדרך עם שוקולד." }, { when: G("את מתגעגעת", "אתה מתגעגע", "אתם מתגעגעים"), text: "גם אני. תתקשר" + G("י", "", "ו") + "." }] });
      if (has("coupons")) push({ type: "coupons", title: "פנקס שוברים", items: filled(d.coupons).length ? filled(d.coupons) : ["עיסוי של 20 דקות", "בחירת הסרט", "ארוחת בוקר במיטה"] });
      if (has("wheel")) push({ type: "wheel", key: "date", title: G("סובבי את הגלגל", "סובב את הגלגל", "סובבו את הגלגל"), sub: "מה שיוצא, זה הדייט שלנו", reply: "סגור. אני מארגן", options: filled(d.wheel).length > 1 ? filled(d.wheel).slice(0, 8) : ["פיקניק", "מסעדה", "סרט", "ים בשקיעה", "הפתעה"] });
      if (has("runaway")) push({ type: "runaway", icon: "smile-heart", title: d.question || "נצא לדייט?", yes: "כן!", no: "לא", hint: "רמז: יש רק תשובה אחת נכונה",
        noTexts: [G("בטוחה?", "בטוח?", "בטוחים?"), G("תחשבי שוב", "תחשוב שוב", "תחשבו שוב"), "כמעט...", "אין מצב", "נו באמת"],
        after: "ידעתי!!!", afterIcon: "hearts", afterText: "עכשיו רק נשאר לסגור פרטים...", cta: "לפרטים" });
    }
    if (t === "proposal") {
      if (has("photos")) push(album("הרגעים שלנו"));
      push({ type: "message", icon: "hearts", title: (d.together ? d.together + ". " : "") + "אלפי רגעים.", text: filled([d.howMet]).concat(["ובכל אחד מהם הבנתי עוד קצת כמה אני רוצה את כל השאר איתך."]) });
      if (has("hold")) push({ type: "hold", title: G("תחזיקי את הלב", "תחזיק את הלב", "תחזיקו את הלב"), sub: "עד שהוא מתמלא", hint: "לאט... עוד קצת...", doneText: "בדיוק ככה הלב שלי מרגיש איתך", cta: "ועכשיו..." });
    }
    if (t === "birthday") {
      push({ type: "message", icon: "cake", title: "מזל טוב, " + nick + "!", text: filled([d.age ? d.age + "! ואיך " + G("את", "אתה", "אתם") + " עדיין נראה" + G("ית", "", "ים") + " ככה?" : "", d.hobbies ? "הכנתי משהו קטן, עם הרבה " + d.hobbies + "." : "הכנתי לך משהו קטן."]) });
      if (has("quiz")) push(quiz("כמה " + G("את מכירה", "אתה מכיר", "אתם מכירים") + " אותי?", defaultQuiz));
      if (has("photos")) push(album("ארכיון הסודות", "תמונות שאסור שאף אחד יראה"));
      if (has("candles")) push({ type: "candles", title: G("תכבי את הנרות!", "תכבה את הנרות!", "תכבו את הנרות!"), sub: "הקישו על כל נר ובקשו משאלה", count: 5, doneText: "המשאלה בדרך!", cta: "יש עוד משהו" });
      if (d.gift) push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את המתנה", sub: "עם האצבע, על כל הכרטיס", reveal: { icon: "gift", text: d.gift, small: "מזל טוב!" }, cta: "ועוד משהו אחד" });
    }
    if (t === "sorry") {
      push({ type: "message", icon: "sad", title: "סליחה. באמת.", text: ["אין לי תירוץ טוב, אז במקום תירוץ הכנתי לך את זה."] });
      if (has("notes") && filled(d.promises).length) push({ type: "notes", icon: "note", title: "הבטחות לעתיד", items: filled(d.promises).map(function (x) { return { text: x, from: "" }; }) });
      if (has("scratch")) push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את הפיצוי", sub: "עם האצבע, על כל הכרטיס", reveal: { icon: "gift", text: d.makeUpText || d.makeUp || "פיצוי ענק בדרך", small: "בתוקף מיידי" }, cta: "עסקה טובה" });
      if (has("runaway")) push({ type: "runaway", icon: "hand-heart", title: G("סולחת לי?", "סולח לי?", "סולחים לי?"), yes: G("סולחת", "סולח", "סולחים"), no: G("לא סולחת", "לא סולח", "לא סולחים"),
        noTexts: filled(d.noTexts).length ? filled(d.noTexts) : ["רגע...", "הכפתור לא מסכים", "נו בבקשה"] });
    }
    if (t === "baby") {
      var aud = d.audience || "";
      var reveal = d.revealText || (aud.indexOf("הורים") > -1 ? "אתם הולכים להיות סבא וסבתא!" : aud.indexOf("אחים") > -1 ? "אתם הולכים להיות דודים!" : aud.indexOf("זוג") > -1 ? "אנחנו הולכים להיות הורים!" : "אנחנו בהריון!");
      var small = d.gender === "בן" ? "וזה בן!" : d.gender === "בת" ? "וזו בת!" : "נפגשים בקרוב";
      if (has("quiz") || (d.reveal || "").indexOf("טריוויה") > -1) push(quiz("חידון משפחתי קטן", [{ q: "מה הכי חסר אצלנו בבית?", options: ["עוד כרית לספה", "מישהו קטן שיעשה הרבה רעש", "מכונת קפה חדשה"], correct: 1, right: "בדיוק!!", wrong: "כמעט... תחשבו קטן יותר" }]));
      if ((d.reveal || "").indexOf("לב") > -1) {
        push({ type: "hold", title: "תחזיקו את הלב", sub: "עד שהוא מתמלא", doneText: reveal + " " + small, cta: "ומתי?" });
      } else push({ type: "scratch", icon: "sparkle", title: "גרדו כאן", sub: "עם האצבע, לאט לאט...", cover1: "#B9DCCB", cover2: "#EAF7F1", reveal: { icon: "baby", text: reveal, small: small }, cta: "ומתי?" });
      if (has("countdown") || d.dueDate) push({ type: "countdown", icon: "hourglass", title: "עד שנכיר", sub: "כל שנייה נחשבת", date: d.dueDate ? d.dueDate + "T09:00:00" : null, daysFromNow: 180 });
    }
    if (t === "friend") {
      push({ type: "message", icon: "users", title: nick + "!", text: filled([d.howMet, d.insideJoke ? "\"" + d.insideJoke + "\"" : ""]).concat(d.howMet ? [] : ["הכנתי לך משהו. בלי לשאול שאלות."]) });
      if (has("quiz")) push(quiz("כמה " + G("את מכירה", "אתה מכיר", "אתם מכירים") + " אותי?", defaultQuiz));
      if (has("photos")) push(album("ארכיון הסודות", "תמונות שאסור שאף אחד יראה"));
    }
    if (t === "thanks") {
      push({ type: "message", icon: "hand-heart", title: "תודה, " + name, text: filled([d.special]).concat(d.special ? [] : ["על כל מה שנתת השנה."]) });
      if (has("photos")) push(album("השנה שלנו"));
      var notes = (d.notes || []).filter(function (n) { return n && n.text; });
      if (has("notes")) push({ type: "notes", icon: "note", title: "מה רצינו להגיד", items: notes.length ? notes.map(function (n) { return { text: n.text, from: n.from || "" }; }) : [{ text: "את הכי טובה", from: "מכולנו" }, { text: "תודה על הסבלנות", from: "" }] });
    }
    if (t === "family") {
      if (has("photos")) push(album("זוכר" + G("ת", "", "ים") + "?"));
      if (has("notes")) push({ type: "notes", icon: "heart", title: "מה אנחנו הכי אוהבים בך", items: (filled(d.loves).length ? filled(d.loves) : ["הכל"]).map(function (x) { return { text: x, from: "" }; }) });
      if (has("hold")) push({ type: "hold", title: G("תחזיקי את הלב", "תחזיק את הלב", "תחזיקו את הלב"), sub: "עד שהוא מתמלא", doneText: "ככה אנחנו מרגישים כלפיך", cta: "ועוד משהו" });
    }
    if (t === "other") {
      push({ type: "message", icon: "wand", title: d.occasion || "הפתעה!", text: lines(d.idea).slice(0, 3) });
      if (caps.length || pics.length) push(album("רגעים"));
    }

    // חלקים שנבחרו ועוד לא הופיעו: גרסה כללית שלהם, רק כדי לראות איך זה נראה
    var EXTRA = {
      runaway: { type: "runaway", icon: "smile-heart", title: "רק שאלה קטנה...", yes: "כן!", no: "לא", noTexts: ["בטוח?", "נסו שוב", "כמעט..."] },
      quiz: quiz("שאלה קטנה", defaultQuiz),
      scratch: { type: "scratch", icon: "gift", title: "גרדו לגלות", reveal: { icon: "gift", text: "ההפתעה שלכם כאן", small: "" } },
      checklist: { type: "checklist", icon: "checklist", title: "רשימה קטנה", sub: "סמנו כל שורה", cta: "סיימתי", items: [{ icon: "smile", label: "חיוך" }, { icon: "heart", label: "לב פתוח" }, { icon: "sparkle", label: "מוכנים להפתעה" }] },
      photos: album("רגעים"),
      countdown: { type: "countdown", icon: "hourglass", title: "הספירה התחילה", sub: "עד הרגע הגדול", daysFromNow: 14 },
      hold: { type: "hold", title: "החזיקו את הלב", sub: "עד שהוא מתמלא", cta: "ממשיכים" },
      candles: { type: "candles", title: "כבו את הנרות!", count: 5, cta: "ממשיכים" },
      notes: { type: "notes", icon: "note", title: "קיר פתקים", items: [{ text: "פתק ראשון", from: "" }, { text: "פתק שני", from: "" }] },
      reasons: { type: "reasons", title: "כמה סיבות קטנות", items: ["סיבה ראשונה", "סיבה שנייה", "סיבה שלישית", "ועוד אחת"] },
      openwhen: { type: "openwhen", title: "מעטפות לרגעים מיוחדים", prefix: "פתחו כש...", items: [{ when: "צריך חיוך", text: "הנה הוא." }, { when: "מתגעגעים", text: "גם אני." }] },
      wheel: { type: "wheel", key: "date", title: "סובבו את הגלגל", options: ["פרס 1", "פרס 2", "פרס 3", "הפתעה"] },
      coupons: { type: "coupons", title: "פנקס שוברים", items: ["שובר ראשון", "שובר שני"] },
    };
    if (t === "proposal") used.runaway = true; // מגיע בסוף, לפני השאלה
    if (t === "partner" && d.finale === "מתנה") used.scratch = true;
    el.forEach(function (x) { if (EXTRA[x] && !used[x]) push(EXTRA[x]); });

    // ההודעה הקולית: מיד אחרי המעטפה, או רגע לפני הסוף
    if (state.voice) {
      var v = state.voice;
      var vs = { type: "voice", icon: "mic", title: "השארתי לך הודעה", sub: G("לחצי", "לחץ", "לחצו") + " על הכפתור. הכי טוב עם אוזניות", from: sign || "", src: v ? v.url : "", duration: v ? v.dur : 0, caption: (d.voiceCaption || "").trim(), cta: "ממשיכים" };
      if (d.voiceAt === VOICE_AT[1]) push(vs); else { used.voice = true; steps.splice(1, 0, vs); }
    }

    // הסיום
    var fin;
    if (t === "partner") {
      var f = d.finale || "";
      if (f === "דייט") fin = { type: "final", variant: "invite", icon: "glass", title: "זה רשמי!", lines: (used.wheel ? [{ icon: "sparkle", label: "מה", value: "{date}" }] : []).concat([{ icon: "calendar", label: "מתי", value: d.finaleWhen || "בקרוב מאוד" }, { icon: "pin", label: "איפה", value: d.finaleWhere || "הפתעה" }, { icon: "sparkle", label: "דרס קוד", value: "מה שמרגיש הכי טוב" }]), note: sign || "מחכה לזה" };
      else if (f.indexOf("טיסה") > -1) fin = { type: "final", variant: "ticket", title: "הכרטיס שלך", ticket: { from: { code: "TLV", city: "תל אביב" }, to: { code: "???", city: d.finaleWhere || "יעד: הפתעה" }, fields: [{ label: G("נוסעת", "נוסע", "נוסעים"), value: nick }, { label: "מתי", value: d.finaleWhen || "בקרוב" }, { label: "שער", value: "7" }, { label: "מושב", value: "ליד שלי" }], note: letter[0] || "את השאר " + G("תגלי", "תגלה", "תגלו") + " בשדה." } };
      else {
        if (f === "מתנה") push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את המתנה", reveal: { icon: "gift", text: d.finaleWhere || "המתנה שלך", small: d.finaleWhen || "" }, cta: "ועוד משהו" });
        fin = finalLetter("hearts", nick + ",", ["תודה שאת" + G("", "ה", "ם") + " " + G("את", "אתה", "אתם") + ".", "שלך, היום ובכל יום."]);
      }
    } else if (t === "proposal") {
      if ((d.proposalPlan || "").indexOf("מוביל") > -1) fin = { type: "final", variant: "invite", icon: "pin", title: G("בואי אליי", "בוא אליי", "בואו אליי"), lines: [{ icon: "pin", label: "איפה ומתי", value: d.placeTime || "המיקום בדרך אלייך" }], note: sign };
      else {
        if (has("runaway")) push({ type: "runaway", icon: "ring", title: G("תתחתני איתי?", "תתחתן איתי?", "תתחתנו איתי?"), yes: "כן!!!", no: "לא", noTexts: ["רגע מה?", G("נסי", "נסה", "נסו") + " שוב", "אין אופציה כזו", "הכפתור מסרב"] });
        fin = finalLetter("ring", "אמרת כן!", ["האהבה של חיי.", "מהיום, לנצח."]);
      }
    } else if (t === "birthday") fin = finalLetter("party", "מזל טוב, " + nick + "!", ["שתהיה לך שנה של צחוקים, הרפתקאות ורק דברים טובים."]);
    else if (t === "sorry") fin = finalLetter("flower", G("תודה שאת כזו", "תודה שאתה כזה", "תודה שאתם כאלה"), ["מבטיח להשתפר. באמת."]);
    else if (t === "baby") fin = finalLetter("heart", "אנחנו כל כך מתרגשים", ["תודה שאתם המשפחה הכי טובה בעולם."]);
    else if (t === "friend") fin = finalLetter("star", "אוהב" + G("ת", "", "ים") + " אותך, " + nick, ["תודה שאת" + G("", "ה", "ם") + " שם בכל רגע, הטוב והמביך."]);
    else if (t === "thanks") fin = finalLetter("flower", "תודה, " + name, ["על הסבלנות, החיבוקים והלב הענק."]);
    else if (t === "family") fin = finalLetter("home", "אוהבים אותך", ["תודה על הכל."]);
    else fin = finalLetter("sparkle", d.occasion || "באהבה", ["כמה מילים מהלב יופיעו כאן."]);
    if (!fin.sign && sign) fin.sign = sign;
    push(fin);
    steps = keyStepsAndOrder(steps); // הסדר שהמשתמש גרר (המעטפה והסוף לא זזים)

    return {
      palette: d.palette || DEF_PALETTE[t], liner: d.liner || DEF_LINER[t],
      mood: d.mood && d.mood !== "none" ? d.mood : "romantic", music: d.mood !== "none",
      deco: { partner: ["heart", "sparkle", "letter", "star"], proposal: ["heart", "ring", "sparkle", "star"], birthday: ["balloon", "party", "star", "cake"], sorry: ["heart", "flower", "flag", "sparkle"], baby: ["star", "cloud", "heart", "baby"], friend: ["star", "party", "heart", "sparkle"], thanks: ["flower", "sun", "sprout", "heart"], family: ["home", "heart", "flower", "star"], other: ["sparkle", "heart", "star", "gift"] }[t],
      steps: steps, mode: "sketch", orderType: t,
      // הדמות שמסיימת כל פעילות: לפי סוג ההפתעה, ויום נישואין / חתונה = חופה
      fx: /נישואין|חתונה/.test(String(d.occasion || "")) ? "chuppah" : undefined,
      reply: (d.extras || []).indexOf(EXTRAS[0]) > -1 && intlPhone(d.phone) ? { phone: intlPhone(d.phone), name: String(d.name || "").trim().split(/\s+/)[0] || sign } : null,
    };
  }

  /* ---------- הודעת הווטסאפ ---------- */
  function message() {
    var d = state.data, T = typeDef(), t = totals();
    var out = ["היי שמואל! מילאתי את טופס ההזמנה באתר וראיתי סקיצה. הנה הפרטים:", ""];
    var add = function (label, v) { if (v != null && String(v).trim() !== "") out.push("*" + label + ":* " + String(v).trim()); };
    add("סוג ההפתעה", T.label);
    add("למי", d.recipient);
    add("פנייה", d.address);
    add("חתימה", d.from);
    out.push("");
    out.push("*הסיפור*");
    T.fields.forEach(function (f) {
      var v = d[f.id];
      if (f.type === "list" || f.type === "multi") { v = filled(v); if (v.length) out.push("• " + f.label + ": " + v.join(" / ")); }
      else if (f.type === "quiz") { (v || []).filter(function (q) { return q && q.q; }).forEach(function (q, i) { out.push("• שאלה " + (i + 1) + ": " + q.q + " | נכונה: " + (q.a || "-") + " | שגויות: " + filled([q.w1, q.w2]).join(", ")); }); }
      else if (f.type === "notes") { var pp = f.parts || ["text", "from"]; (v || []).filter(function (n) { return n && n[pp[0]]; }).forEach(function (n) { out.push("• " + f.label.replace(/"/g, "") + ": " + n[pp[0]] + (n[pp[1]] ? " | " + n[pp[1]] : "")); }); }
      else if (v && String(v).trim()) out.push("• " + f.label + ": " + String(v).trim().replace(/\n+/g, " / "));
    });
    if (filled(d.tone).length) out.push("• טון: " + d.tone.join(", "));
    out.push("");
    out.push("*עיצוב*");
    out.push("• פלטה: " + ENV.palettes[d.palette].label + " · בטנה: " + ENV.liners[d.liner] + " · חותם: " + (d.mark || "לב"));
    out.push("• מוזיקה: " + O.moods.filter(function (m) { return m.id === d.mood; })[0].label + (d.song ? " · שיר: " + d.song : ""));
    out.push("• חלקים: " + O.elements.filter(function (e) { return (d.elements || []).indexOf(e.id) > -1 || e.id === "envelope" || e.id === "final"; }).map(function (e) { return e.label.replace(/"/g, ""); }).join(", "));
    try { out.push("• הסדר" + (d.order && d.order.length ? " (סידרתי בעצמי)" : "") + ": " + buildDemo().steps.map(function (s) { return stepLabel(s)[1]; }).join(" ← ")); } catch (e) { /* */ }
    if (state.photos.length) out.push("• תמונות: " + state.photos.length + " (שולח/ת כאן בצ'אט)");
    if (state.voice) out.push("• הודעה קולית: " + fmtTime(state.voice.dur) + ", " + (d.voiceAt || VOICE_AT[0]) + " (שולח/ת את הקובץ כאן בצ'אט)" + (d.voiceCaption ? " · כתובית: " + d.voiceCaption : ""));
    out.push("");
    add("חבילה", t.plan.name + ", " + planPrice(t.plan) + " ₪" + (promo ? " (במקום " + t.plan.price + " ₪, " + promo.title + ")" : ""));
    if (t.adds.length) add("תוספות", t.adds.map(function (a) { return a.name + " +" + a.price + " ₪"; }).join(", "));
    add('סה"כ משוער', t.sum + " ₪");
    add("צריך עד", d.deadline ? d.deadline.split("-").reverse().join(".") : "");
    add("שם", d.name);
    add("טלפון", d.phone);
    var ex = d.extras || [];
    if (ex.indexOf(EXTRAS[0]) > -1) add("כפתור תגובה", "כן, לטלפון שלי");
    if (ex.indexOf(EXTRAS[1]) > -1) add("תזכורת לשנה הבאה", "כן" + (d.deadline ? ", לפני " + d.deadline.split("-").reverse().slice(0, 2).join(".") : ""));
    add("הערות", d.notes);
    var src = window.mtSource ? window.mtSource() : null;
    add("הגעתי דרך", filled([d.source, src ? src.label : ""]).join(" · "));
    return out.join("\n");
  }

  /* ---------- שלב 5: סקיצה ---------- */
  /* הסקיצה מראה רק חצי: המעטפה והחלקים הראשונים. השאר והסוף נעולים עד הגרסה האמיתית */
  function lockHalf(demo) {
    var st = demo.steps, fin = st[st.length - 1], mid = st.slice(1, -1);
    var show = mid.length <= 1 ? mid.length : Math.ceil(mid.length / 2);
    var hidden = mid.slice(show).concat([fin]);
    var d = state.data;
    demo.steps = [st[0]].concat(mid.slice(0, show), [{
      type: "locked", icon: "lock", title: "וזה רק חצי",
      sub: "את ההמשך אני בונה ביד, עם המילים והתמונות שלכם. ככה הוא יחכה ל" + ((d.recipient || "").trim() || "מי שמקבל") + ":",
      items: hidden.map(function (s) { var l = stepLabel(s); return { icon: l[0], label: l[1] }; }).concat(demo.reply ? [{ icon: "reply", label: "כפתור תגובה אליכם" }] : []),
      teaser: { title: fin.title || "", sign: fin.sign || (d.from || "") },
    }]);
    return demo;
  }
  function renderSketch() {
    var demo = lockHalf(buildDemo());
    store("matanot-sketch", demo);
    var frame = $("#sketchFrame");
    frame.src = "demos/preview.html?v=" + Date.now();
    var d = state.data, T = typeDef(), t = totals();
    var rows = [
      ["סוג", T.label], ["למי", d.recipient], ["חתימה", d.from],
      ["עיצוב", ENV.palettes[d.palette].label + ", בטנת " + ENV.liners[d.liner]],
      ["חבילה", t.plan.name + (t.adds.length ? " + " + t.adds.length + " תוספות" : "")],
      ["עד", d.deadline ? d.deadline.split("-").reverse().join(".") : ""],
    ];
    $("#summary").innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
      '<div class="summary__total"><dt>סה"כ משוער</dt><dd>' + t.sum + " ₪" + (promo && t.full > t.sum ? " <small>(חסכתם " + (t.full - t.sum) + " ₪)</small>" : "") + "</dd></div>";
    var msg = message();
    $$("[data-send]").forEach(function (a) { a.href = "https://wa.me/" + S.contact.phoneIntl + "?text=" + encodeURIComponent(msg); });
    $("#msgPreview").textContent = msg;
    var vb = $("#voiceSend");
    vb.hidden = !state.voice;
    if (state.voice) $("#voiceSendLen").textContent = fmtTime(state.voice.dur);
    track("sketch_view", { type: T.id, plan: d.plan, value: t.sum, voice: !!state.voice, photos: state.photos.length });
  }

  // שליחת קובץ ההקלטה: בטלפון נפתח חלון השיתוף (ישר לווטסאפ), במחשב יורד קובץ
  function shareVoice() {
    var v = state.voice;
    if (!v) return;
    var name = "matanot-voice-" + (String(state.data.recipient || "").trim().replace(/\s+/g, "-") || "hakalata") + "." + audioExt(v.type);
    var file = null;
    try { file = new File([v.blob], name, { type: v.type }); } catch (e) { /* דפדפן ישן */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "ההקלטה להפתעה", text: "ההקלטה להפתעה של " + (state.data.recipient || "") }).then(function () { track("voice_shared", { how: "share" }); }, function () { /* בוטל */ });
      return;
    }
    var a = document.createElement("a");
    a.href = v.url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    $("#copyStatus").textContent = "ההקלטה ירדה למכשיר. צרפו אותה בשיחת הווטסאפ איתי.";
    track("voice_shared", { how: "download" });
  }

  /* ---------- תמונות ---------- */
  function addPhotos(files) {
    Array.prototype.slice.call(files || []).forEach(function (f) {
      if (!/^image\//.test(f.type) || state.photos.length >= 15) return;
      state.photos.push({ url: URL.createObjectURL(f), name: f.name });
    });
    renderThumbs();
    $("#photoStatus").textContent = "נבחרו " + state.photos.length + " תמונות";
  }

  /* =========================================================
     הפעלה
     ========================================================= */
  function init() {
    // שלד השלבים
    $("#stepper").innerHTML = STEPS.map(function (s, i) {
      return '<li><button type="button" data-go="' + i + '"><span class="stepper__n" aria-hidden="true">' + (i + 1) + "</span><span>" + esc(s.label) + '</span><span class="sr-only"> (שלב ' + (i + 1) + " מתוך " + STEPS.length + ")</span></button></li>";
    }).join("");
    if (promo) {
      $("#orderPromo").hidden = false;
      $("#orderPromo").innerHTML = ico("percent") + "<span><b>" + esc(promo.title) + ":</b> " + esc(promo.text) + " עד " + esc(promo.endsLabel) + ". המחיר המוזל כבר מחושב בטופס.</span>";
    }

    // שחזור טיוטה / פרמטרים בכתובת
    var params = new URLSearchParams(location.search);
    var draft = store(DRAFT);
    var startAt = 0;
    if (draft && draft.type && typeDef(draft.type)) {
      state.type = draft.type; state.data = draft.data || {}; state.visited = Math.min(draft.visited || 1, 3);
      $("#draftNote").hidden = false;
    }
    var pt = params.get("type");
    if (pt && typeDef(pt) && pt !== state.type) { state.type = pt; state.data = {}; state.visited = 1; $("#draftNote").hidden = true; }
    var pp = params.get("plan");
    if (pp && S.pricing.plans.some(function (p) { return p.id === pp; })) state.data.plan = pp;
    if (state.type) startAt = 1;
    renderType();

    // הקלטה מהביקור הקודם (נשמרת בדפדפן בלבד). בלי טיוטה, אין סיבה לשמור אותה
    if (draft && draft.type) {
      IDB.get("voice").then(function (v) {
        if (!v || !v.blob || state.voice) return;
        state.voice = { blob: v.blob, url: URL.createObjectURL(v.blob), dur: v.dur || 0, type: v.type || v.blob.type };
        renderRec();
        if (STEPS[state.step].id === "sketch") renderSketch();
      });
    } else IDB.del("voice");

    var form = $("#wizard");
    form.addEventListener("input", onInput);
    form.addEventListener("change", function (e) {
      if (e.target.name === "type") {
        if (state.type !== e.target.value) {
          var keep = { plan: state.data.plan, name: state.data.name, phone: state.data.phone, recipient: state.data.recipient, address: state.data.address, from: state.data.from };
          state.data = keep;
        }
        state.type = e.target.value;
        state.visited = Math.max(state.visited, 1);
        saveDraft(); updateLive();
        $("#step-type .wz-errors").hidden = true;
        return;
      }
      if (e.target.id === "photoInput") { addPhotos(e.target.files); e.target.value = ""; return; }
      if (e.target.id === "voiceFile") { addVoiceFile(e.target.files && e.target.files[0]); e.target.value = ""; return; }
      onInput(e);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    form.addEventListener("pointerdown", pathDown);
    document.addEventListener("pointermove", pathMove);
    document.addEventListener("pointerup", pathUp);
    document.addEventListener("pointercancel", pathUp);
    form.addEventListener("click", function (e) {
      var nx = e.target.closest("[data-next]"), bk = e.target.closest("[data-back]"), rm = e.target.closest("[data-rm]"), errLink = e.target.closest(".wz-errors a");
      if (nx) { if (validateStep()) go(state.step + 1); }
      if (bk) go(state.step - 1);
      if (rm) {
        var i = +rm.getAttribute("data-rm");
        URL.revokeObjectURL(state.photos[i].url);
        state.photos.splice(i, 1);
        renderThumbs();
        $("#photoStatus").textContent = "התמונה הוסרה. נשארו " + state.photos.length;
        var nextFocus = $("#thumbs [data-rm]") || $('label[for="photoInput"]');
        nextFocus.focus();
      }
      if (errLink) {
        e.preventDefault();
        var tg = $(errLink.getAttribute("data-target"));
        if (tg) { var dd = tg.closest("details"); if (dd) dd.open = true; tg.focus(); tg.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); }
      }
      if (e.target.closest("#listenBtn")) playSample();
      var hb = e.target.closest("[data-help]");
      if (hb) applyHelp(hb.getAttribute("data-help"));
      if (e.target.closest("#recStart")) startRec();
      if (e.target.closest("#recStop")) stopRec();
      if (e.target.closest("#recAgain")) { clearVoice(); renderRec(); if (recSupported()) startRec(); else $('label[for="voiceFile"]').focus(); }
      if (e.target.closest("#recDel")) { clearVoice(); renderRec(); recSay("ההקלטה נמחקה"); var s0 = $("#recStart") || $('label[for="voiceFile"]'); if (s0) s0.focus(); }
      if (e.target.closest("#shareVoice")) shareVoice();
      var mvb = e.target.closest("[data-mv]");
      if (mvb) {
        var mli = mvb.closest(".path__item"), dir = +mvb.getAttribute("data-mv");
        moveBy(mli, dir);
        var again = mli.querySelector('[data-mv="' + dir + '"]:not(:disabled)') || mli.querySelector("[data-mv]:not(:disabled)");
        if (again) again.focus();
      }
      if (e.target.closest("#pathReset")) {
        delete state.data.order;
        saveDraft(); renderPath();
        var ps = $("#pathStatus"); if (ps) ps.textContent = "חזרנו לסדר המומלץ";
        var f0 = $("#partsPath [data-mv]:not(:disabled)"); if (f0) f0.focus();
      }
      var st = e.target.closest("[data-starter]");
      if (st) {
        var ta = $("#" + st.getAttribute("data-for"));
        var add = st.getAttribute("data-starter");
        ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, "") + "\n" : "") + add + " ";
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        st.classList.add("is-used");
      }
    });
    $("#stepper").addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (!b || b.disabled) return;
      var n = +b.getAttribute("data-go");
      if (n > state.step && !validateStep()) return;
      go(n);
    });
    $("#restart").addEventListener("click", function () {
      store(DRAFT, null); store("matanot-sketch", null);
      clearVoice();
      state = { type: null, step: 0, data: {}, photos: [], voice: null, visited: 0 };
      $("#draftNote").hidden = true;
      renderType(); go(0);
    });
    $("#liveEnv").addEventListener("click", function (e) {
      var env = e.target.closest(".env");
      if (!env) return;
      var scr = $("#liveScreen");
      scr.classList.add("is-opening");
      ENV.open(env, function () { ENV.reset(env); scr.classList.remove("is-opening"); }, { hold: 1800 });
    });
    $("#copyMsg").addEventListener("click", function () {
      var txt = message(), btn = $("#copyMsg");
      track("copy_summary", { type: state.type });
      var done = function () { btn.innerHTML = ico("check") + "הועתק!"; $("#copyStatus").textContent = "הסיכום הועתק. אפשר להדביק בווטסאפ."; setTimeout(function () { btn.innerHTML = ico("copy") + "העתקת הסיכום"; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
      function fallback() { var ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (er) { /* */ } ta.remove(); }
    });
    $$("[data-send]").forEach(function (a) { a.addEventListener("click", function () {
      $("#sentNote").hidden = false;
      $("#sentVoice").hidden = !state.voice;
      store(DRAFT, null);
      var t = totals();
      track("send_whatsapp", { type: state.type, plan: t.plan.id, value: t.sum, currency: "ILS", voice: !!state.voice });
    }); });
    $("#fullPreview").addEventListener("click", function (e) {
      e.preventDefault();
      window.open("demos/preview.html", "_blank");
    });

    // צילום מסך כשהסקיצה פתוחה: מסתירים אותה לרגע (במחשב)
    var veilSketch = function (e) {
      if (STEPS[state.step].id !== "sketch") return;
      var k = e.key || "";
      if (k === "PrintScreen" || ((e.metaKey || e.ctrlKey) && e.shiftKey && /^[345sS]$/.test(k))) {
        try { $("#sketchFrame").contentWindow.mtVeil(3000); } catch (er) { /* */ }
        try { if (navigator.clipboard) navigator.clipboard.writeText(""); } catch (er) { /* */ }
      }
    };
    document.addEventListener("keydown", veilSketch);
    document.addEventListener("keyup", veilSketch);

    go(startAt, { silent: true });
  }

  // דוגמת שמע קצרה לפי המוזיקה שנבחרה
  var actx = null;
  function playSample() {
    var mood = state.data.mood || "romantic";
    if (mood === "none") return;
    var M = { romantic: [0.3, [0, 4, 7, 12, 11, 7, 4, 7]], happy: [0.2, [0, 4, 7, 4, 9, 7, 4, 0, 2, 5, 9, 5]], emotional: [0.38, [-3, 0, 4, 9, 7, 4, 0, 4]] }[mood];
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      actx.resume();
      var t0 = actx.currentTime + 0.05, master = actx.createGain();
      master.gain.value = 0.07; master.connect(actx.destination);
      M[1].forEach(function (semi, i) {
        var o = actx.createOscillator(), g = actx.createGain(), when = t0 + i * M[0];
        o.type = "sine"; o.frequency.value = 523.25 * Math.pow(2, semi / 12);
        o.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.9, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + 1.2);
        o.start(when); o.stop(when + 1.3);
      });
    } catch (e) { /* בלי שמע */ }
  }

  init();
})();
