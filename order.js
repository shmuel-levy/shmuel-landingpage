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

  var state = { type: null, step: 0, data: {}, photos: [], visited: 0 };
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
    { id: "deadline", type: "date", label: "עד מתי ההפתעה צריכה להיות מוכנה?", required: true, hint: "ככה אני יודע לתעדף. צריכים היום? בחרו אקספרס למטה." },
    { id: "name", type: "text", label: "השם שלכם", required: true, autocomplete: "name" },
    { id: "phone", type: "tel", label: "טלפון לחזרה", required: true, autocomplete: "tel", placeholder: "050-0000000", validate: "phone" },
    { id: "notes", type: "textarea", label: "משהו נוסף שחשוב שאדע?", placeholder: "שיר מסוים, צבע שהיא אוהבת, תאריך מיוחד..." },
  ];

  /* ---------- בניית שדה ---------- */
  function val(id) { return state.data[id]; }
  function field(f) {
    var id = "f-" + f.id;
    var req = f.required ? '<span class="req" aria-hidden="true"> *</span><span class="sr-only"> (חובה)</span>' : "";
    var hint = f.hint ? '<p class="field__hint" id="' + id + '-hint">' + esc(f.hint) + "</p>" : "";
    var err = '<p class="field__error" id="' + id + '-err" hidden></p>';
    var describe = (f.hint ? id + "-hint " : "") + id + "-err";
    var v = val(f.id);
    var common = ' data-key="' + f.id + '" aria-describedby="' + describe + '"' + (f.required ? ' aria-required="true"' : "");
    var ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "";

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
        '<textarea class="input input--area" id="' + id + '" rows="4" maxlength="1200"' + common + ph + ">" + esc(v || "") + "</textarea>" + err + "</div>";
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
        nrows += '<div class="note-row"><span class="list-row__n" aria-hidden="true">' + (k + 1) + "</span>" +
          '<input class="input" id="' + id + "-" + k + '-t" data-key="' + f.id + '" data-i="' + k + '" data-part="text" aria-label="פתק ' + (k + 1) + ', הטקסט" placeholder="מה כתוב בפתק" value="' + esc(N.text || "") + '" maxlength="120">' +
          '<input class="input input--from" id="' + id + "-" + k + '-f" data-key="' + f.id + '" data-i="' + k + '" data-part="from" aria-label="פתק ' + (k + 1) + ', ממי" placeholder="ממי" value="' + esc(N.from || "") + '" maxlength="40"></div>';
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
    $("#step-story .fields").innerHTML = COMMON_TOP.concat(T.fields, COMMON_BOTTOM).map(field).join("");
  }

  /* ---------- שלב 3: עיצוב ---------- */
  function renderDesign() {
    var T = typeDef();
    if (!T) return;
    var d = state.data;
    if (!d.palette) d.palette = DEF_PALETTE[T.id];
    if (!d.liner) d.liner = DEF_LINER[T.id];
    if (!d.mood) d.mood = DEF_MOOD[T.id];
    if (!d.elements) d.elements = T.elements.slice();
    var pals = Object.keys(ENV.palettes);
    var html =
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
      '<input class="input input--short" id="f-mark" type="text" maxlength="2" data-key="mark" aria-describedby="f-mark-hint" value="' + esc(d.mark != null ? d.mark : (d.recipient || "").trim().charAt(0)) + '"></div>' +
      '<fieldset class="field field--group"><legend class="field__label">מוזיקה</legend><div class="chips">' +
      O.moods.map(function (m) {
        return '<label class="chip chip--ico"><input type="radio" name="mood" value="' + m.id + '" data-key="mood"' + (d.mood === m.id ? " checked" : "") + "><span>" + ico(m.icon) + esc(m.label) + "</span></label>";
      }).join("") + '</div><button type="button" class="link-btn" id="listenBtn">' + ico("music") + "להשמיע דוגמה</button></fieldset>" +
      field({ id: "song", type: "text", label: "שיר מסוים? (בחבילת פרימיום)", placeholder: "שם השיר והזמר" }) +
      '<fieldset class="field field--group"><legend class="field__label">מה נכניס להפתעה?</legend><p class="field__hint">סימנו בשבילכם את מה שמתאים ל' + esc(T.label) + '. אפשר לשנות.</p><div class="chips chips--elements">' +
      O.elements.map(function (e) {
        var fixed = e.id === "envelope" || e.id === "final";
        return '<label class="chip chip--ico"><input type="checkbox" name="elements" value="' + e.id + '" data-key="elements"' + (d.elements.indexOf(e.id) > -1 || fixed ? " checked" : "") + (fixed ? " disabled" : "") + "><span>" + ico(e.icon) + esc(e.label) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<div class="field"><p class="field__label" id="photosLabel">תמונות לסקיצה (רשות)</p><p class="field__hint" id="photosHint">התמונות נשארות בטלפון שלכם ומשמשות רק לסקיצה. אותן שולחים לי אחר כך בווטסאפ.</p>' +
      '<div class="photos-pick"><input type="file" id="photoInput" class="file-input" accept="image/*" multiple aria-labelledby="photosLabel" aria-describedby="photosHint">' +
      '<label for="photoInput" class="btn btn--ghost btn--sm">' + ico("upload") + "הוספת תמונות</label>" +
      '<ul class="thumbs" id="thumbs" aria-label="התמונות שנבחרו"></ul></div></div>';
    $("#step-design .fields").innerHTML = html;
    ENV.applyPalette($("#step-design .fields"), d.palette);
    renderThumbs();
  }

  function renderThumbs() {
    var ul = $("#thumbs");
    if (!ul) return;
    ul.innerHTML = state.photos.map(function (p, i) {
      return '<li><img src="' + p.url + '" alt="תמונה ' + (i + 1) + '" width="72" height="72"><button type="button" class="thumb__x" data-rm="' + i + '" aria-label="הסרת תמונה ' + (i + 1) + '">' + ico("x") + "</button></li>";
    }).join("");
  }

  /* ---------- שלב 4: פרטים ---------- */
  function renderDetails() {
    var d = state.data;
    if (!d.plan) d.plan = "premium";
    if (!d.addons) d.addons = [];
    var P = S.pricing;
    var html =
      '<fieldset class="field field--group"><legend class="field__label">חבילה</legend><div class="plan-pick">' +
      P.plans.map(function (p) {
        var now = planPrice(p);
        return '<label class="plan-opt' + (p.popular ? " plan-opt--pop" : "") + '"><input type="radio" name="plan" value="' + p.id + '" data-key="plan"' + (d.plan === p.id ? " checked" : "") + ">" +
          "<span><b>" + esc(p.name) + "</b><small>" + esc(p.description) + "</small></span>" +
          '<span class="plan-opt__price">' + (promo ? '<del><span class="sr-only">במקום </span>' + p.price + " ₪</del>" : "") + "<strong>" + now + " ₪</strong></span></label>";
      }).join("") + "</div></fieldset>" +
      '<fieldset class="field field--group"><legend class="field__label">תוספות</legend><div class="addon-pick">' +
      P.addons.map(function (a) {
        return '<label class="addon-opt"><input type="checkbox" name="addons" value="' + a.id + '" data-key="addons"' + (d.addons.indexOf(a.id) > -1 ? " checked" : "") + ">" +
          '<span class="addon-opt__box" aria-hidden="true">' + ico("check") + "</span>" + ico(a.icon, "addon-opt__ico") + "<span>" + esc(a.name) + '</span><strong dir="ltr">+' + a.price + " ₪</strong></label>";
      }).join("") + "</div></fieldset>" +
      DETAILS.map(field).join("") +
      '<div class="total" aria-live="polite" id="total"></div>';
    $("#step-details .fields").innerHTML = html;
    updateTotal();
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
      cardIcon: T ? T.icon : "heart", cardTitle: d.recipient ? "ל" + d.recipient : "למי שאתם אוהבים", cardText: T ? T.label : "",
    });
    ENV.applyPalette(host.firstChild, pal);
    var theme = ENV.palettes[pal].theme;
    var screen = $("#liveScreen");
    screen.style.background = theme.bg;
    screen.style.setProperty("--ink-live", theme.ink);
    $("#liveTo").textContent = d.recipient ? "ל" + d.recipient : "השם יופיע כאן";
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
    if (key === "recipient" && d.mark == null) { var m = $("#f-mark"); if (m) m.value = (t.value || "").trim().charAt(0); }
    if (t.closest(".field") && t.closest(".field").classList.contains("has-error")) validateField(t.closest("[data-field]"));
    if (["palette", "liner", "mark", "recipient"].indexOf(key) > -1) updateLive();
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
    $$("input,textarea", wrap).forEach(function (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); });
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
    var el = d.elements || T.elements;
    var has = function (x) { return el.indexOf(x) > -1; };
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
      if (has("notes")) push({ type: "notes", icon: "heart", title: G("למה דווקא את?", "למה דווקא אתה?", "למה דווקא אתם?"), items: (filled(d.loves).length ? filled(d.loves) : ["הצחוק", "החיבוקים", "הכל"]).map(function (x) { return { text: x, from: "" }; }) });
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
    };
    if (t === "proposal") used.runaway = true; // מגיע בסוף, לפני השאלה
    if (t === "partner" && d.finale === "מתנה") used.scratch = true;
    el.forEach(function (x) { if (EXTRA[x] && !used[x]) push(EXTRA[x]); });

    // הסיום
    var fin;
    if (t === "partner") {
      var f = d.finale || "";
      if (f === "דייט") fin = { type: "final", variant: "invite", icon: "glass", title: "זה רשמי!", lines: [{ icon: "calendar", label: "מתי", value: d.finaleWhen || "בקרוב מאוד" }, { icon: "pin", label: "איפה", value: d.finaleWhere || "הפתעה" }, { icon: "sparkle", label: "דרס קוד", value: "מה שמרגיש הכי טוב" }], note: sign || "מחכה לזה" };
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

    return {
      palette: d.palette || DEF_PALETTE[t], liner: d.liner || DEF_LINER[t],
      mood: d.mood && d.mood !== "none" ? d.mood : "romantic", music: d.mood !== "none",
      deco: { partner: ["heart", "sparkle", "letter", "star"], proposal: ["heart", "ring", "sparkle", "star"], birthday: ["balloon", "party", "star", "cake"], sorry: ["heart", "flower", "flag", "sparkle"], baby: ["star", "cloud", "heart", "baby"], friend: ["star", "party", "heart", "sparkle"], thanks: ["flower", "sun", "sprout", "heart"], family: ["home", "heart", "flower", "star"], other: ["sparkle", "heart", "star", "gift"] }[t],
      steps: steps, mode: "sketch",
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
      else if (f.type === "notes") { (v || []).filter(function (n) { return n && n.text; }).forEach(function (n) { out.push("• פתק: " + n.text + (n.from ? " (" + n.from + ")" : "")); }); }
      else if (v && String(v).trim()) out.push("• " + f.label + ": " + String(v).trim().replace(/\n+/g, " / "));
    });
    if (filled(d.tone).length) out.push("• טון: " + d.tone.join(", "));
    out.push("");
    out.push("*עיצוב*");
    out.push("• פלטה: " + ENV.palettes[d.palette].label + " · בטנה: " + ENV.liners[d.liner] + " · חותם: " + (d.mark || "לב"));
    out.push("• מוזיקה: " + O.moods.filter(function (m) { return m.id === d.mood; })[0].label + (d.song ? " · שיר: " + d.song : ""));
    out.push("• חלקים: " + O.elements.filter(function (e) { return (d.elements || []).indexOf(e.id) > -1 || e.id === "envelope" || e.id === "final"; }).map(function (e) { return e.label.replace(/"/g, ""); }).join(", "));
    if (state.photos.length) out.push("• תמונות: " + state.photos.length + " (שולח/ת כאן בצ'אט)");
    out.push("");
    add("חבילה", t.plan.name + ", " + planPrice(t.plan) + " ₪" + (promo ? " (במקום " + t.plan.price + " ₪, " + promo.title + ")" : ""));
    if (t.adds.length) add("תוספות", t.adds.map(function (a) { return a.name + " +" + a.price + " ₪"; }).join(", "));
    add('סה"כ משוער', t.sum + " ₪");
    add("צריך עד", d.deadline ? d.deadline.split("-").reverse().join(".") : "");
    add("שם", d.name);
    add("טלפון", d.phone);
    add("הערות", d.notes);
    return out.join("\n");
  }

  /* ---------- שלב 5: סקיצה ---------- */
  function renderSketch() {
    var demo = buildDemo();
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
    $("#sendWa").href = "https://wa.me/" + S.contact.phoneIntl + "?text=" + encodeURIComponent(msg);
    $("#msgPreview").textContent = msg;
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
      onInput(e);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
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
        if (tg) { tg.focus(); tg.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); }
      }
      if (e.target.closest("#listenBtn")) playSample();
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
      state = { type: null, step: 0, data: {}, photos: [], visited: 0 };
      $("#draftNote").hidden = true;
      renderType(); go(0);
    });
    $("#liveEnv").addEventListener("click", function (e) {
      var env = e.target.closest(".env");
      if (!env) return;
      ENV.open(env, function () { setTimeout(function () { ENV.reset(env); }, 1400); });
    });
    $("#copyMsg").addEventListener("click", function () {
      var txt = message(), btn = $("#copyMsg");
      var done = function () { btn.innerHTML = ico("check") + "הועתק!"; $("#copyStatus").textContent = "הסיכום הועתק. אפשר להדביק בווטסאפ."; setTimeout(function () { btn.innerHTML = ico("copy") + "העתקת הסיכום"; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
      function fallback() { var ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (er) { /* */ } ta.remove(); }
    });
    $("#sendWa").addEventListener("click", function () {
      $("#sentNote").hidden = false;
      store(DRAFT, null);
    });
    $("#fullPreview").addEventListener("click", function (e) {
      e.preventDefault();
      window.open("demos/preview.html", "_blank");
    });

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
