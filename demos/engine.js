/* =========================================================
   Matanot: מנוע ההפתעות
   כל דוגמה מגדירה window.DEMO = { theme, deco, steps: [...] }
   סוגי שלבים: envelope, message, choice, runaway, checklist, quiz,
   scratch, photos, hold, candles, notes, countdown, final
   ========================================================= */
(function () {
  "use strict";
  const D = window.DEMO;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const answers = {};
  let idx = 0;

  /* ---------- עזרים ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tpl = (s) => esc(s).replace(/\{(\w+)\}/g, (_, k) => esc(answers[k] || ""));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const title = (s, extra) => `<h1 class="step__title" tabindex="-1">${tpl(s)}</h1>${extra || ""}`;
  const emoji = (e, cls) => (e ? `<div class="step__emoji ${cls || "bob"}" aria-hidden="true">${esc(e)}</div>` : "");
  const sub = (s) => (s ? `<p class="step__sub">${tpl(s)}</p>` : "");

  /* ---------- תבנית העמוד ---------- */
  Object.entries(D.theme || {}).forEach(([k, v]) => document.documentElement.style.setProperty("--" + k, v));
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="deco" aria-hidden="true"></div>
    <div class="app">
      <header>
        <div class="topbar">
          <a class="back" href="../index.html#examples">→ חזרה ל-Matanot</a>
          <div class="progress" aria-hidden="true"></div>
          <button class="music" type="button" aria-pressed="false" aria-label="מוזיקת רקע">🎵</button>
        </div>
        <p class="demo-flag">✨ אתר לדוגמה · השמות והתמונות להמחשה</p>
      </header>
      <main class="stage" id="stage"></main>
      <footer><p class="desk-hint">📱 הכי כיף לפתוח מהטלפון</p></footer>
    </div>
    <div class="fx" aria-hidden="true"></div>
    <p class="sr-only" aria-live="polite" id="live"></p>`);

  const stage = $("#stage"), fx = $(".fx"), live = $("#live"), musicBtn = $(".music");
  const announce = (t) => { live.textContent = ""; setTimeout(() => { live.textContent = t; }, 60); };

  // קישוטים מרחפים
  if (!reduce && D.deco) {
    $(".deco").innerHTML = Array.from({ length: 8 }, (_, i) => {
      const e = D.deco[i % D.deco.length];
      return `<span style="left:${Math.random() * 96}%;--s:${16 + Math.random() * 18}px;--t:${12 + Math.random() * 12}s;--dl:${-Math.random() * 20}s">${esc(e)}</span>`;
    }).join("");
  }

  // נקודות התקדמות
  const progress = $(".progress");
  progress.innerHTML = D.steps.map(() => "<i></i>").join("");
  const updateProgress = () => $$("i", progress).forEach((dot, i) => {
    dot.className = i < idx ? "is-done" : i === idx ? "is-current" : "";
  });

  /* ---------- מוזיקה (תיבת נגינה, נוצרת בדפדפן) ---------- */
  const Music = {
    ctx: null, on: false, timer: null, t: 0, n: 0,
    melody: D.melody || [0, 4, 7, 12, 11, 7, 4, 7, 2, 5, 9, 14, 12, 9, 5, 9, -3, 0, 4, 9, 7, 4, 0, 4, -1, 2, 7, 11, 9, 7, 2, 7],
    start() {
      if (this.on) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = this.ctx || new AC();
        this.ctx.resume();
        this.master = this.master || (() => { const g = this.ctx.createGain(); g.gain.value = 0.07; g.connect(this.ctx.destination); return g; })();
        this.on = true;
        this.t = this.ctx.currentTime + 0.1;
        this.timer = setInterval(() => this.schedule(), 120);
        musicBtn.setAttribute("aria-pressed", "true");
        musicBtn.textContent = "🔊";
      } catch (e) { /* בלי מוזיקה, לא נורא */ }
    },
    stop() {
      this.on = false;
      clearInterval(this.timer);
      musicBtn.setAttribute("aria-pressed", "false");
      musicBtn.textContent = "🔇";
    },
    schedule() {
      const step = 0.3, base = 523.25; // C5
      while (this.t < this.ctx.currentTime + 0.5) {
        const semi = this.melody[this.n % this.melody.length];
        this.note(base * Math.pow(2, semi / 12), this.t, 0.9);
        if (this.n % 8 === 0) this.note(base / 4 * Math.pow(2, this.melody[this.n % this.melody.length] / 12), this.t, 0.5);
        this.t += step; this.n++;
      }
    },
    note(freq, when, vol) {
      const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o2.type = "triangle";
      o.frequency.value = freq; o2.frequency.value = freq * 2;
      const g2 = c.createGain(); g2.gain.value = 0.15;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.master);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 1.3);
      o.start(when); o2.start(when); o.stop(when + 1.4); o2.stop(when + 1.4);
    },
  };
  musicBtn.addEventListener("click", () => (Music.on ? Music.stop() : Music.start()));
  document.addEventListener("visibilitychange", () => { if (document.hidden && Music.on) Music.stop(); });

  /* ---------- קונפטי ---------- */
  function burst(n) {
    if (reduce) return;
    const colors = D.confetti || ["#E26D93", "#1F5BD1", "#FFD45C", "#F5A9C0", "#FFFFFF"];
    const emojis = D.confettiEmoji || ["💖", "✨"];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < (n || 60); i++) {
      const s = document.createElement("span");
      if (i % 4 === 0) { s.className = "e"; s.textContent = emojis[i % emojis.length]; }
      else s.style.background = colors[i % colors.length];
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      s.style.setProperty("--x", Math.cos(a) * d + "px");
      s.style.setProperty("--y", Math.sin(a) * d - 80 + "px");
      s.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
      s.style.animationDelay = Math.random() * 150 + "ms";
      frag.appendChild(s);
    }
    fx.appendChild(frag);
    setTimeout(() => { fx.innerHTML = ""; }, 2000);
  }

  /* ---------- כפתור המשך ---------- */
  function addNext(el, label, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "next";
    wrap.innerHTML = `<button type="button" class="btn btn--primary is-ready"${opts.disabled ? " disabled" : ""}>${esc(label || "ממשיכים ←")}</button>`;
    el.appendChild(wrap);
    const b = $("button", wrap);
    b.addEventListener("click", () => next());
    if (opts.focus) setTimeout(() => b.focus({ preventScroll: true }), 80);
    return b;
  }

  /* ---------- מעבר בין שלבים ---------- */
  function render(focus) {
    const s = D.steps[idx];
    stage.innerHTML = "";
    const el = document.createElement("section");
    el.className = "step step--" + s.type;
    stage.appendChild(el);
    TYPES[s.type](s, el);
    updateProgress();
    window.scrollTo(0, 0);
    if (focus) { const h = $(".step__title", el); h && h.focus({ preventScroll: true }); }
  }
  function next() {
    if (idx >= D.steps.length - 1) return;
    const old = stage.firstElementChild;
    idx++;
    if (old && !reduce) { old.classList.add("is-leaving"); setTimeout(() => render(true), 320); }
    else render(true);
  }
  function restart() { idx = 0; Object.keys(answers).forEach((k) => delete answers[k]); render(true); }

  /* =========================================================
     סוגי שלבים
     ========================================================= */
  const TYPES = {
    envelope(s, el) {
      el.innerHTML = (s.to ? `<p class="env-to">${esc(s.to)}</p>` : "") + title(s.title) +
        `<button class="envelope" type="button" aria-label="פתיחת המעטפה">
          <span class="envelope__back"></span><span class="envelope__letter" aria-hidden="true">${esc(s.letter || "💌")}</span>
          <span class="envelope__front"></span><span class="envelope__flap"></span><span class="envelope__seal" aria-hidden="true">♥</span>
        </button><p class="hint">${esc(s.hint || "לחצו על המעטפה")}</p>`;
      const env = $(".envelope", el);
      env.addEventListener("click", () => {
        if (env.classList.contains("is-open")) return;
        env.classList.add("is-open");
        if (D.music !== false) Music.start();
        setTimeout(next, reduce ? 0 : 1250);
      });
    },

    message(s, el) {
      const paras = [].concat(s.text || []).map((p) => `<p class="step__text">${tpl(p)}</p>`).join("");
      el.innerHTML = emoji(s.emoji) + title(s.title) + paras;
      addNext(el, s.cta);
    },

    choice(s, el) {
      const two = s.options.length % 2 === 0 && s.options.length > 2;
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="options${two ? " options--2" : ""}" role="group" aria-label="${esc(s.title)}">` +
        s.options.map((o, i) => `<button type="button" class="option" aria-pressed="false" data-i="${i}"><span class="option__emoji" aria-hidden="true">${esc(o.emoji)}</span><span>${esc(o.label)}</span></button>`).join("") +
        `</div><div class="reply-wrap" aria-live="polite"></div>`;
      const group = $(".options", el), replyWrap = $(".reply-wrap", el);
      let nextBtn = null;
      group.addEventListener("click", (e) => {
        const b = e.target.closest(".option");
        if (!b) return;
        const o = s.options[+b.dataset.i];
        $$(".option", group).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        group.classList.add("has-choice");
        if (s.key) answers[s.key] = o.value || o.label;
        replyWrap.innerHTML = o.reply ? `<p class="reply">${esc(o.reply)}</p>` : "";
        if (!nextBtn) nextBtn = addNext(el, s.cta);
      });
    },

    runaway(s, el) {
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="run-area" role="group" aria-label="${esc(s.title)}">
          <button type="button" class="btn btn--primary run-yes">${esc(s.yes)}</button>
          <button type="button" class="btn btn--ghost run-no">${esc(s.no)}</button>
        </div><p class="hint">${esc(s.hint || "")}</p>`;
      const area = $(".run-area", el), yes = $(".run-yes", el), no = $(".run-no", el);
      let n = 0, last = -1;
      const texts = s.noTexts || ["בטוח?", "נסו שוב 😏"];
      // נקודות קבועות בשולי האזור, רק כאלה שלא נוגעות ב"כן" (כולל הגודל שאליו יגדל)
      function pick(yesScale) {
        const aw = area.clientWidth, ah = area.clientHeight, bw = no.offsetWidth, bh = no.offsetHeight;
        const yw = yes.offsetWidth * yesScale, yh = yes.offsetHeight * yesScale;
        const cx = yes.offsetLeft + yes.offsetWidth / 2, cy = yes.offsetTop + yes.offsetHeight / 2;
        const Y = { l: cx - yw / 2 - 10, r: cx + yw / 2 + 10, t: cy - yh / 2 - 8, b: cy + yh / 2 + 8 };
        const mx = Math.max(0, aw - bw), my = Math.max(0, ah - bh);
        const spots = [[0, 0], [mx, 0], [0, my], [mx, my], [mx / 2, 0], [mx / 2, my], [0, my / 2], [mx, my / 2]];
        let ok = spots.map((p, i) => i).filter((i) => {
          const [x, y] = spots[i];
          return i !== last && !(x < Y.r && x + bw > Y.l && y < Y.b && y + bh > Y.t);
        });
        if (!ok.length) ok = [last === 0 ? 3 : 0];
        last = ok[Math.floor(Math.random() * ok.length)];
        return spots[last];
      }
      function run(e) {
        if (e) e.preventDefault();
        n++;
        const ys = Math.min(1.35, 1 + n * 0.06);
        no.classList.add("is-running");
        no.textContent = texts[(n - 1) % texts.length];
        const [x, t] = pick(ys);
        no.style.left = x + "px"; no.style.top = t + "px";
        no.style.transform = `scale(${Math.max(0.6, 1 - n * 0.06)})`;
        yes.style.transform = `scale(${ys})`;
      }
      no.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") run(e); });
      no.addEventListener("pointerdown", run);
      no.addEventListener("click", (e) => { run(e); announce("הכפתור ברח 😉"); });
      yes.addEventListener("click", () => {
        burst(80);
        if (s.after) {
          el.innerHTML = emoji(s.afterEmoji || "🥰", "") + title(s.after) + (s.afterText ? `<p class="step__text">${tpl(s.afterText)}</p>` : "");
          $(".step__title", el).focus({ preventScroll: true });
          addNext(el, s.cta);
        } else next();
      });
    },

    checklist(s, el) {
      const check = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="checklist">` + s.items.map((it, i) => `
          <div class="check"><input type="checkbox" id="ck${i}"><label for="ck${i}"><span class="check__box">${check}</span><span class="check__emoji" aria-hidden="true">${esc(it.emoji)}</span><span class="check__text">${esc(it.label)}</span></label></div>`).join("") +
        `</div><div class="meter" aria-hidden="true"><b></b></div><p class="sr-only" aria-live="polite" id="ckStatus"></p>`;
      const boxes = $$("input", el), meter = $(".meter b", el), status = $("#ckStatus", el);
      const btn = addNext(el, s.cta, { disabled: true });
      btn.classList.remove("is-ready");
      el.addEventListener("change", () => {
        const done = boxes.filter((b) => b.checked).length;
        meter.style.width = (done / boxes.length) * 100 + "%";
        status.textContent = `סומנו ${done} מתוך ${boxes.length}`;
        const all = done === boxes.length;
        if (all && btn.disabled) { btn.disabled = false; btn.classList.add("is-ready"); burst(40); announce(s.doneText || "הכל מוכן!"); }
        if (!all) btn.disabled = true;
      });
    },

    quiz(s, el) {
      let q = 0, firstTry = 0, missed = false;
      function show() {
        const Q = s.questions[q];
        el.innerHTML = emoji(s.emoji) + title(s.title) +
          `<p class="quiz__count">שאלה ${q + 1} מתוך ${s.questions.length}</p><p class="quiz__q" id="qq${q}">${esc(Q.q)}</p>
           <div class="options" role="group" aria-labelledby="qq${q}">` +
          Q.options.map((o, i) => `<button type="button" class="option" data-i="${i}">${esc(o)}</button>`).join("") +
          `</div><p class="feedback" aria-live="assertive"></p>`;
        missed = false;
        const fb = $(".feedback", el);
        $(".options", el).addEventListener("click", (e) => {
          const b = e.target.closest(".option");
          if (!b || b.disabled) return;
          const i = +b.dataset.i, ok = Q.correct === -1 || Q.correct === undefined || i === Q.correct;
          if (ok) {
            if (!missed) firstTry++;
            b.classList.add("is-right");
            $$(".option", el).forEach((x) => { x.disabled = true; });
            fb.textContent = Q.right || "נכון! 🎉";
            burst(30);
            setTimeout(() => { q++; q < s.questions.length ? (show(), $(".quiz__q", el).setAttribute("tabindex", "-1"), $(".quiz__q", el).focus({ preventScroll: true })) : done(); }, reduce ? 600 : 1400);
          } else {
            missed = true;
            b.classList.remove("is-wrong"); void b.offsetWidth; b.classList.add("is-wrong");
            fb.textContent = Q.wrong || "לא בדיוק... נסו שוב";
          }
        });
      }
      function done() {
        el.innerHTML = emoji(s.doneEmoji || "🏆", "") + title(firstTry === s.questions.length ? `${firstTry} מתוך ${firstTry}! 💯` : `צדקת ב-${firstTry} מתוך ${s.questions.length}`) + `<p class="step__text">${tpl(s.doneText || "")}</p>`;
        $(".step__title", el).focus({ preventScroll: true });
        addNext(el, s.cta);
      }
      show();
    },

    scratch(s, el) {
      const r = s.reveal;
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="scratch"><div class="scratch__reveal" aria-hidden="true"><span class="big">${esc(r.emoji)}</span><strong>${esc(r.text)}</strong>${r.small ? `<small>${esc(r.small)}</small>` : ""}</div><canvas aria-hidden="true"></canvas></div>
         <button type="button" class="skip">לגלות בלי לגרד</button>`;
      const box = $(".scratch", el), cv = $("canvas", el), revealEl = $(".scratch__reveal", el), skip = $(".skip", el);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = box.offsetWidth, H = box.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const ctx = cv.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
      g.addColorStop(0, s.cover1 || "#C9CED8"); g.addColorStop(0.5, s.cover2 || "#EEF1F6"); g.addColorStop(1, s.cover1 || "#BAC0CC");
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(Math.random() * cv.width, Math.random() * cv.height, (2 + Math.random() * 6) * dpr, 0, 7); ctx.fill(); }
      ctx.fillStyle = "rgba(40,50,80,.75)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `700 ${22 * dpr}px Heebo, Arial, sans-serif`;
      ctx.fillText(s.coverText || "גרדו כאן ✨", cv.width / 2, cv.height / 2);
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 46 * dpr;

      let drawing = false, last = null, moves = 0, finished = false;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * (cv.width / b.width), y: (e.clientY - b.top) * (cv.height / b.height) }; };
      function scratchTo(p) {
        ctx.beginPath();
        if (last) { ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(p.x, p.y, 23 * dpr, 0, 7); ctx.fill();
        last = p;
        if (++moves % 8 === 0) check();
      }
      function check() {
        const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let clear = 0, total = 0;
        for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] < 40) clear++; }
        if (clear / total > 0.5) finish();
      }
      function finish() {
        if (finished) return;
        finished = true;
        box.classList.add("is-done");
        revealEl.setAttribute("aria-hidden", "false");
        skip.hidden = true;
        announce(`${r.text}. ${r.small || ""}`);
        burst(90);
        addNext(el, s.cta, { focus: true });
      }
      cv.addEventListener("pointerdown", (e) => { drawing = true; last = null; cv.setPointerCapture(e.pointerId); scratchTo(pos(e)); });
      cv.addEventListener("pointermove", (e) => { if (drawing) scratchTo(pos(e)); });
      ["pointerup", "pointercancel", "pointerleave"].forEach((t) => cv.addEventListener(t, () => { drawing = false; last = null; if (!finished && moves) check(); }));
      skip.addEventListener("click", finish);
    },

    photos(s, el) {
      const bgs = ["linear-gradient(135deg,#FDE6EE,#F5A9C0)", "linear-gradient(135deg,#E6EEFF,#AFC6FF)", "linear-gradient(135deg,#FFF6D9,#FFD98A)", "linear-gradient(135deg,#E3F7EF,#A9E3CB)", "linear-gradient(135deg,#EFE8FB,#CDB8EE)"];
      const rots = [-4, 3, -2, 5, -5];
      const items = s.items;
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub || "לחצו על התמונה לתמונה הבאה") +
        `<div class="album">` + items.map((it, i) => ({ it, i })).reverse().map(({ it, i }) => `
          <button type="button" class="polaroid" data-i="${i}" style="--rot:${rots[i % rots.length]}deg" aria-label="תמונה ${i + 1} מתוך ${items.length}: ${esc(it.caption)}. לחצו לתמונה הבאה">
            <span class="polaroid__img" style="background:${it.bg || bgs[i % bgs.length]}" aria-hidden="true">${esc(it.emoji)}<small>📷 כאן תופיע התמונה שלכם</small></span>
            <span class="polaroid__cap" aria-hidden="true">${esc(it.caption)}</span>
          </button>`).join("") +
        `</div><p class="album__count" aria-live="polite">תמונה 1 מתוך ${items.length}</p>`;
      const cards = $$(".polaroid", el).reverse(); // לפי הסדר
      const count = $(".album__count", el);
      let cur = 0;
      const sync = () => cards.forEach((c, i) => { c.tabIndex = i === cur ? 0 : -1; c.setAttribute("aria-hidden", i === cur ? "false" : "true"); });
      sync();
      cards.forEach((c) => c.addEventListener("click", () => {
        if (+c.dataset.i !== cur) return;
        c.classList.add("is-gone");
        cur++;
        if (cur < cards.length) {
          count.textContent = `תמונה ${cur + 1} מתוך ${cards.length}`;
          sync();
          cards[cur].focus({ preventScroll: true });
        } else {
          count.textContent = s.doneText || "אלה הרגעים שלנו 💛";
          addNext(el, s.cta, { focus: true });
        }
      }));
    },

    hold(s, el) {
      const heart = "M50 88C22 68 4 52 4 30 4 14 16 4 30 4c9 0 16 5 20 12 4-7 11-12 20-12 14 0 26 10 26 26 0 22-18 38-46 58z";
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<button type="button" class="hold" aria-label="לחצו והחזיקו כדי למלא את הלב">
          <svg viewBox="0 0 100 92" aria-hidden="true"><defs><clipPath id="hc"><path d="${heart}"/></clipPath></defs>
            <path class="h-bg" d="${heart}"/><rect class="h-fill" clip-path="url(#hc)" x="0" y="92" width="100" height="92"/></svg>
          <span class="hold__pct" aria-hidden="true">0%</span></button>
         <p class="hint">${esc(s.hint || "לחצו והחזיקו")}</p><p class="sr-only" aria-live="polite" id="holdStatus"></p>`;
      const btn = $(".hold", el), fill = $(".h-fill", el), pct = $(".hold__pct", el), st = $("#holdStatus", el);
      let p = 0, holding = false, lastT = 0, full = false, lastSaid = 0;
      const DUR = s.duration || 1800;
      function frame(t) {
        const dt = lastT ? t - lastT : 16; lastT = t;
        p = Math.max(0, Math.min(1, p + (holding ? dt / DUR : -dt / 2500)));
        fill.setAttribute("y", 92 - 92 * p);
        pct.textContent = Math.round(p * 100) + "%";
        const tens = Math.floor(p * 4);
        if (tens !== lastSaid) { lastSaid = tens; st.textContent = Math.round(p * 100) + "%"; }
        if (p >= 1 && !full) {
          full = true; holding = false;
          btn.classList.remove("is-holding"); btn.classList.add("is-full");
          pct.textContent = "♥";
          burst(70);
          announce(s.doneText || "הלב מלא!");
          if (s.doneText) el.insertAdjacentHTML("beforeend", `<p class="reply">${esc(s.doneText)}</p>`);
          addNext(el, s.cta, { focus: true });
          return;
        }
        if (holding || p > 0) requestAnimationFrame(frame); else lastT = 0;
      }
      const start = (e) => { if (full) return; if (e) e.preventDefault(); if (holding) return; holding = true; btn.classList.add("is-holding"); lastT = 0; requestAnimationFrame(frame); };
      const stop = () => { holding = false; btn.classList.remove("is-holding"); };
      btn.addEventListener("pointerdown", start);
      ["pointerup", "pointerleave", "pointercancel"].forEach((t) => btn.addEventListener(t, stop));
      btn.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); else if (e.key === " " || e.key === "Enter") e.preventDefault(); });
      btn.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") stop(); });
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    },

    candles(s, el) {
      const n = s.count || 5;
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="cake"><div class="cake__candles">` +
        Array.from({ length: n }, (_, i) => `<button type="button" class="candle" aria-label="כיבוי נר ${i + 1}"><span class="flame"></span><span class="smoke"></span></button>`).join("") +
        `</div><div class="cake__body"></div><div class="cake__plate"></div></div><p class="album__count" aria-live="polite">נשארו ${n} נרות</p>`;
      const count = $(".album__count", el);
      let left = n;
      $$(".candle", el).forEach((c) => c.addEventListener("click", () => {
        if (c.classList.contains("is-out")) return;
        c.classList.add("is-out"); c.disabled = true; c.setAttribute("aria-label", "הנר כבוי");
        left--;
        count.textContent = left ? `נשארו ${left} נרות` : (s.doneText || "🎉 המשאלה בדרך!");
        if (!left) { burst(100); addNext(el, s.cta, { focus: true }); }
      }));
    },

    notes(s, el) {
      const colors = ["#FFF3B0", "#FDE6EE", "#E6EEFF", "#E3F7EF", "#FFE4D1"];
      const rots = [-3, 2.5, -1.5, 3, -2];
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<ul class="notes" role="list">` + s.items.map((it, i) =>
          `<li class="note" style="--c:${colors[i % colors.length]};--rot:${rots[i % rots.length]}deg;--dl:${reduce ? 0 : 300 + i * 260}ms">${esc(it.text)}<small>${esc(it.from)}</small></li>`).join("") + `</ul>`;
      setTimeout(() => addNext(el, s.cta), reduce ? 0 : 300 + s.items.length * 260);
    },

    countdown(s, el) {
      el.innerHTML = emoji(s.emoji) + title(s.title) + sub(s.sub) +
        `<div class="countdown" role="timer" aria-live="off">
          <div><b data-u="d">0</b><span>ימים</span></div><div><b data-u="h">0</b><span>שעות</span></div>
          <div><b data-u="m">0</b><span>דקות</span></div><div><b data-u="s">0</b><span>שניות</span></div></div>` +
        (s.note ? `<p class="reply">${esc(s.note)}</p>` : "");
      const target = s.date ? new Date(s.date).getTime() : Date.now() + (s.daysFromNow || 30) * 864e5 + 5 * 36e5;
      const out = { d: $('[data-u="d"]', el), h: $('[data-u="h"]', el), m: $('[data-u="m"]', el), s: $('[data-u="s"]', el) };
      function tick() {
        if (!el.isConnected) return clearInterval(timer);
        const ms = Math.max(0, target - Date.now());
        out.d.textContent = Math.floor(ms / 864e5);
        out.h.textContent = Math.floor(ms / 36e5) % 24;
        out.m.textContent = Math.floor(ms / 6e4) % 60;
        out.s.textContent = Math.floor(ms / 1e3) % 60;
      }
      const timer = setInterval(tick, 1000); tick();
      addNext(el, s.cta);
    },

    final(s, el) {
      let body = "";
      if (s.variant === "ticket") {
        const t = s.ticket;
        body = `<article class="ticket" aria-label="כרטיס עלייה למטוס">
          <div class="ticket__head">${esc(t.airline || "Matanot Air ✈")}<span>BOARDING PASS</span></div>
          <div class="ticket__route"><div><b>${esc(t.from.code)}</b><small>${esc(t.from.city)}</small></div><div class="ticket__plane" aria-hidden="true">✈️</div><div><b>${esc(t.to.code)}</b><small>${esc(t.to.city)}</small></div></div>
          <dl class="ticket__grid">${t.fields.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${tpl(f.value)}</dd></div>`).join("")}</dl>
          <div class="ticket__tear" aria-hidden="true"></div>
          <div class="ticket__foot"><p class="ticket__note">${tpl(t.note)}</p><div class="barcode" aria-hidden="true"></div></div></article>`;
      } else if (s.variant === "invite") {
        body = `<article class="invite">${emoji(s.emoji, "")}<h1 class="step__title" tabindex="-1">${tpl(s.title)}</h1>
          <dl class="invite__lines">${s.lines.map((l) => `<div style="--icon:'${esc(l.icon)}'"><dt>${esc(l.label)}</dt><dd>${tpl(l.value)}</dd></div>`).join("")}</dl>
          ${s.note ? `<p class="sign">${tpl(s.note)}</p>` : ""}</article>`;
      } else {
        body = `<article class="letter">${emoji(s.emoji, "")}<h1 class="step__title" tabindex="-1">${tpl(s.title)}</h1>
          ${[].concat(s.text).map((p) => `<p class="letter__text">${tpl(p)}</p>`).join("")}
          ${s.sign ? `<p class="sign">${tpl(s.sign)}</p>` : ""}</article>`;
      }
      el.innerHTML = (s.variant === "ticket" ? title(s.title) : "") + body +
        `<div class="outro">
          <button type="button" class="btn btn--ghost replay">↺ לחוות שוב מההתחלה</button>
          <a class="madeby" href="../index.html#pricing">
            <img src="../images/favicon.png" alt="" width="52" height="52">
            <span><b>רוצים הפתעה כזו?</b><small>Matanot · הפתעות בקישור, מוכן תוך 48 שעות</small></span>
            <em>לפרטים ←</em></a></div>`;
      $(".replay", el).addEventListener("click", restart);
      setTimeout(() => burst(120), reduce ? 0 : 500);
    },
  };

  render(false);
})();
