/* =========================================================
   Matanot: דמויות שמסיימות שלב (כל סוג הפתעה בהקשר שלו)
   cupid   קופידון יורה חץ             (אהבה, דייט)
   chuppah חופה, והרב זורק כוס          (יום נישואין)
   ring    קופסת טבעת נפתחת             (הצעת נישואין)
   balloon בלון שעולה ומתפוצץ           (יום הולדת, חברים)
   stork   חסידה מביאה חבילה            (הריון ולידה)
   dove    יונה עם עלה זית              (התנצלות, משפחה)
   plane   מטוס נייר עושה לופ           (תודה, טיול)
   MatanotFX.play("cupid", { target: btn | () => rect, lead, from, onHit, onDone }) → { stop }
   ========================================================= */
(function () {
  "use strict";
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-no-motion");
  const sfx = (k) => { try { if (window.MatanotEnvelope && window.MatanotEnvelope.sfx) window.MatanotEnvelope.sfx(k); } catch (e) { /* */ } };
  const buzz = (ms) => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* */ } };

  /* ---------- הציורים ---------- */
  const ACC = "var(--fx-accent, var(--accent-deep, #B83563))", ACC2 = "var(--fx-accent2, var(--accent, #E26D93))";
  const HEART = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5c.9 6.1 3.4 9.1 10.5 10.5-7.1 1.4-9.6 4.4-10.5 10.5C11.1 16.4 8.6 13.4 1.5 12 8.6 10.6 11.1 7.6 12 1.5z"/></svg>';
  const ART = {
    cupid: `<svg viewBox="0 0 120 120" class="fx-svg">
      <g class="fx-wing fx-wing--b"><path d="M84 56c14-22 34-24 32-8-1 9-10 12-18 13 8 1 13 6 9 12-5 7-17 2-23-7z" fill="#fff" stroke="#E8C8D4" stroke-width="2"/><path d="M92 54c8-6 15-7 18-4M93 62c7-1 12 0 14 3" fill="none" stroke="#F0D6DF" stroke-width="1.6" stroke-linecap="round"/></g>
      <path d="M58 64c-8 0-16 1-22 1" fill="none" stroke="#F4BFA4" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="72" cy="72" rx="16" ry="18" fill="#FFD8C4"/>
      <path d="M58 70c6 4 20 6 30-2l-2 9c-8 6-20 5-27-1z" fill="${ACC}" opacity=".92"/>
      <circle cx="63" cy="93" r="7" fill="#FFD0BA"/><circle cx="80" cy="91" r="7" fill="#FFD0BA"/>
      <circle cx="70" cy="38" r="18" fill="#FFE2D2"/>
      <g fill="#F2B84B"><circle cx="58" cy="26" r="6"/><circle cx="66" cy="21" r="6.5"/><circle cx="75" cy="21" r="6.5"/><circle cx="83" cy="27" r="6"/><circle cx="86" cy="35" r="5"/><circle cx="64" cy="18" r="3"/></g>
      <circle cx="61" cy="43" r="3.4" fill="#F7A8B8" opacity=".75"/><circle cx="77" cy="43" r="3.4" fill="#F7A8B8" opacity=".75"/>
      <path d="M60 37q2.5-2.5 5 0M71 37q2.5-2.5 5 0" fill="none" stroke="#4A2A2A" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M65 46q3 3 6 0" fill="none" stroke="#C0566F" stroke-width="1.8" stroke-linecap="round"/>
      <g class="fx-wing"><path d="M80 62c10-18 26-20 25-8-1 7-8 10-14 10 6 1 10 5 7 10-4 5-13 1-18-6z" fill="#fff" stroke="#E8C8D4" stroke-width="2"/></g>
      <path d="M36 36Q10 65 36 94" fill="none" stroke="#B5832F" stroke-width="4" stroke-linecap="round"/>
      <path class="fx-string" d="M36 36L36 65L36 94" fill="none" stroke="#7A5A2A" stroke-width="1.2"/>
      <g class="fx-nock"><path d="M50 65H18" stroke="#8A6A3A" stroke-width="2.6" stroke-linecap="round"/><path d="M18 65c-2-3-7-3-7 1s5 6 7 8c2-2 7-4 7-8s-5-4-7-1z" transform="translate(-6 -4)" fill="${ACC}"/><path d="M50 65l5-5M50 65l5 5M46 65l5-5M46 65l5 5" stroke="${ACC2}" stroke-width="2" stroke-linecap="round"/></g>
    </svg>`,
    arrow: `<svg viewBox="0 0 60 20" class="fx-svg"><path d="M48 10H10" stroke="#8A6A3A" stroke-width="2.6" stroke-linecap="round"/><path d="M10 10c-2-3-7-3-7 1s5 6 7 8c2-2 7-4 7-8s-5-4-7-1z" transform="translate(-4 -5)" fill="${ACC}"/><path d="M48 10l6-6M48 10l6 6M43 10l6-6M43 10l6 6" stroke="${ACC2}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    chuppah: `<svg viewBox="0 0 200 130" class="fx-svg" preserveAspectRatio="none">
      <g class="fx-poles"><rect x="14" y="30" width="6" height="100" rx="3" fill="#C9A35A"/><rect x="180" y="30" width="6" height="100" rx="3" fill="#C9A35A"/>
        <path d="M17 40c-4 14 2 30-2 46s3 26 0 40M183 40c4 14-2 30 2 46s-3 26 0 40" fill="none" stroke="#7DB36B" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>
      <g class="fx-canopy">
        <path d="M6 22h188v14c-10 10-20 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0-10 10-21 10-31 0z" fill="#FFFDF8" stroke="#E6D7B8" stroke-width="1.5"/>
        <path d="M6 26h188M6 31h188" stroke="#7FA4D9" stroke-width="1.6" opacity=".7"/>
        <path d="M6 22c40-16 148-16 188 0" fill="#FFFDF8" stroke="#E6D7B8" stroke-width="1.5"/>
        <g fill="${ACC2}"><circle cx="10" cy="22" r="6"/><circle cx="190" cy="22" r="6"/><circle cx="100" cy="10" r="5"/></g>
        <g fill="#F7D36B"><circle cx="16" cy="18" r="3.5"/><circle cx="184" cy="18" r="3.5"/><circle cx="92" cy="12" r="3"/><circle cx="108" cy="12" r="3"/></g>
        <g fill="#7DB36B"><ellipse cx="4" cy="26" rx="5" ry="2.4" transform="rotate(-30 4 26)"/><ellipse cx="196" cy="26" rx="5" ry="2.4" transform="rotate(30 196 26)"/></g>
      </g>
    </svg>`,
    rabbi: `<svg viewBox="0 0 100 130" class="fx-svg">
      <path d="M28 128l6-58c4-8 28-8 32 0l6 58z" fill="#1E1E28"/>
      <path d="M43 66l7 14 7-14" fill="#fff"/><path d="M50 80v46" stroke="#33333F" stroke-width="1.4"/>
      <circle cx="44" cy="96" r="1.6" fill="#55556A"/><circle cx="44" cy="108" r="1.6" fill="#55556A"/>
      <g class="fx-arm-l"><path d="M34 74c-8 10-10 22-6 32" fill="none" stroke="#1E1E28" stroke-width="9" stroke-linecap="round"/><circle cx="28" cy="107" r="4.5" fill="#F3D2B9"/></g>
      <ellipse cx="50" cy="40" rx="15" ry="17" fill="#F3D2B9"/>
      <path d="M35 44c0 18 6 30 15 32 9-2 15-14 15-32-5 5-10 7-15 7s-10-2-15-7z" fill="#5A5148"/>
      <path d="M44 50q6 4 12 0" fill="none" stroke="#3A332C" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M43 39q2.5-2 5 0M52 39q2.5-2 5 0" fill="none" stroke="#2A2420" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="42" cy="45" r="2.6" fill="#F2A6A6" opacity=".55"/><circle cx="58" cy="45" r="2.6" fill="#F2A6A6" opacity=".55"/>
      <path d="M35 40c-2 6-1 12 1 16M65 40c2 6 1 12-1 16" fill="none" stroke="#5A5148" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="50" cy="26" rx="27" ry="5.5" fill="#15151C"/>
      <path d="M36 26c0-12 5-17 14-17s14 5 14 17z" fill="#15151C"/><path d="M36 22h28" stroke="#2C2C38" stroke-width="2.4"/>
      <g class="fx-arm-r"><path d="M66 74c10 4 16 0 20-8" fill="none" stroke="#1E1E28" stroke-width="9" stroke-linecap="round"/><circle cx="87" cy="64" r="4.5" fill="#F3D2B9"/>
        <g class="fx-held"><path d="M82 46h10l-1 9c-1 3-3 4-4 4s-3-1-4-4z" fill="rgba(210,235,255,.85)" stroke="#9FB9D6" stroke-width="1.2"/><path d="M87 59v5M84 64h6" stroke="#9FB9D6" stroke-width="1.4" stroke-linecap="round"/></g></g>
    </svg>`,
    glass: `<svg viewBox="0 0 24 30" class="fx-svg"><path d="M5 2h14l-1.5 11c-1 5-4 6-5.5 6s-4.5-1-5.5-6z" fill="rgba(210,235,255,.9)" stroke="#8FB0D2" stroke-width="1.4"/><path d="M7 5h10" stroke="#fff" stroke-width="1.4" opacity=".8"/><path d="M12 19v7M8 27h8" stroke="#8FB0D2" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    ringbox: `<svg viewBox="0 0 100 90" class="fx-svg">
      <path d="M14 46h72v32c0 4-3 7-7 7H21c-4 0-7-3-7-7z" fill="${ACC}"/><path d="M14 46h72v8H14z" fill="#000" opacity=".15"/>
      <path d="M30 46c0-8 9-12 20-12s20 4 20 12" fill="#3A1426" opacity=".85"/>
      <g class="fx-lid"><path d="M14 46c0-14 16-22 36-22s36 8 36 22z" fill="${ACC}"/><path d="M22 40c6-8 18-11 28-11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/></g>
    </svg>`,
    ring: `<svg viewBox="0 0 40 46" class="fx-svg"><circle cx="20" cy="30" r="12" fill="none" stroke="#E8B84A" stroke-width="4"/><circle cx="20" cy="30" r="12" fill="none" stroke="#FFE8A6" stroke-width="1.2" opacity=".8"/><path d="M13 12l7-9 7 9-7 7z" fill="#E9F6FF" stroke="#9CC9EC" stroke-width="1.4"/><path d="M13 12h14M20 3l-3 9 3 7 3-7z" fill="none" stroke="#B9DCF5" stroke-width="1"/></svg>`,
    balloon: `<svg viewBox="0 0 60 120" class="fx-svg"><g class="fx-balloon"><ellipse cx="30" cy="30" rx="24" ry="28" fill="${ACC2}"/><ellipse cx="30" cy="30" rx="24" ry="28" fill="url(#fxbg)"/>
      <defs><radialGradient id="fxbg" cx="35%" cy="28%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>
      <path d="M26 57l4 5 4-5z" fill="${ACC}"/></g><path class="fx-strand" d="M30 62c-6 10 6 18 0 28s6 18 0 28" fill="none" stroke="#8A8FA8" stroke-width="1.4"/></svg>`,
    stork: `<svg viewBox="0 0 140 110" class="fx-svg">
      <g class="fx-wing fx-wing--b"><path d="M70 40c10-26 40-34 52-26-8 4-14 10-18 18 8-2 16 0 20 4-12 4-30 8-54 4z" fill="#F2F4F8" stroke="#D6DAE4" stroke-width="1.4"/><path d="M110 18c4-2 9-3 12-4M114 30c3 0 6 1 8 2" stroke="#2A2E3A" stroke-width="3" stroke-linecap="round"/></g>
      <ellipse cx="72" cy="50" rx="26" ry="15" fill="#fff" stroke="#E2E6EE" stroke-width="1.4"/>
      <path d="M96 52c8 2 16 6 22 12" stroke="#E38B3A" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M92 58c6 6 10 14 12 22" stroke="#E38B3A" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M50 46c-8-8-14-18-14-26" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
      <circle cx="36" cy="18" r="9" fill="#fff" stroke="#E2E6EE" stroke-width="1.2"/><circle cx="33" cy="16" r="1.8" fill="#222"/>
      <path d="M28 18L4 24l25 2z" fill="#F0A04B"/>
      <g class="fx-wing"><path d="M64 46c6-20 30-28 44-22-8 4-12 10-14 16 6-1 12 1 16 4-12 4-26 6-46 2z" fill="#fff" stroke="#D6DAE4" stroke-width="1.4"/><path d="M100 26c4-1 7-1 10 0" stroke="#2A2E3A" stroke-width="3" stroke-linecap="round"/></g>
      <g class="fx-held"><path d="M10 24l-2 12" stroke="#C9A35A" stroke-width="1.6"/><path d="M8 36c-10 0-14 8-12 16 2 7 8 10 14 10s12-3 14-10c2-8-2-16-12-16-2 3-4 3-4 0z" fill="#FFE1EA" stroke="#F0B6C7" stroke-width="1.4"/><circle cx="8" cy="49" r="5.5" fill="#FFE2D2"/><path d="M6 49q2 2 4 0" stroke="#C0566F" stroke-width="1" fill="none"/></g>
    </svg>`,
    bundle: `<svg viewBox="0 0 40 34" class="fx-svg"><path d="M20 4c-12 0-18 9-16 18 2 8 9 11 16 11s14-3 16-11c2-9-4-18-16-18-2 3-4 3-4 0z" fill="#FFE1EA" stroke="#F0B6C7" stroke-width="1.4"/><circle cx="20" cy="19" r="6.5" fill="#FFE2D2"/><path d="M17.5 19q2.5 2.4 5 0" stroke="#C0566F" stroke-width="1.1" fill="none"/></svg>`,
    dove: `<svg viewBox="0 0 120 90" class="fx-svg">
      <g class="fx-wing fx-wing--b"><path d="M56 40c4-24 30-36 46-30-6 4-10 10-12 16 6-2 12-1 16 2-12 6-28 12-50 12z" fill="#EEF1F7" stroke="#D3D9E5" stroke-width="1.4"/></g>
      <path d="M30 46c0-12 12-20 26-18 18 2 30 14 40 20 6 4 14 4 18 2-4 8-12 12-22 12H52C38 62 30 56 30 46z" fill="#fff" stroke="#DCE1EA" stroke-width="1.4"/>
      <circle cx="30" cy="40" r="11" fill="#fff" stroke="#DCE1EA" stroke-width="1.4"/><circle cx="27" cy="38" r="1.8" fill="#2A2E3A"/>
      <path d="M20 40l-9 3 9 2z" fill="#E9A85A"/>
      <g class="fx-held"><path d="M13 44c-6 4-10 10-12 18" fill="none" stroke="#6B8F4E" stroke-width="1.8" stroke-linecap="round"/><g fill="#7DB36B"><ellipse cx="6" cy="50" rx="5" ry="2.4" transform="rotate(-50 6 50)"/><ellipse cx="11" cy="54" rx="5" ry="2.4" transform="rotate(20 11 54)"/><ellipse cx="2" cy="58" rx="5" ry="2.4" transform="rotate(-40 2 58)"/></g></g>
      <g class="fx-wing"><path d="M50 44c6-22 30-30 44-24-6 4-10 8-11 14 6-1 11 1 14 4-12 6-28 8-47 6z" fill="#fff" stroke="#D3D9E5" stroke-width="1.4"/></g>
    </svg>`,
    plane: `<svg viewBox="0 0 60 40" class="fx-svg"><path d="M2 20L58 2 40 38 28 26z" fill="#fff" stroke="#C9CFDD" stroke-width="1.4" stroke-linejoin="round"/><path d="M58 2L28 26l-4 12 4-12" fill="#E3E8F2" stroke="#C9CFDD" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 20l26 6" stroke="#C9CFDD" stroke-width="1.2"/></svg>`,
  };

  /* ---------- עזרים ---------- */
  function mk(layer, cls, html, css) {
    const e = document.createElement("div");
    e.className = "fx-actor " + cls;
    if (html) e.innerHTML = html;
    Object.assign(e.style, css || {});
    layer.appendChild(e);
    return e;
  }
  const px = (n) => Math.round(n) + "px";
  // מסלול קשת (פרבולה) בתור keyframes
  function arcFrames(from, to, lift, spin, n) {
    const f = [];
    n = n || 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = from.x + (to.x - from.x) * t, y = from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t);
      f.push({ transform: `translate(${px(x)},${px(y)}) rotate(${(spin || 0) * t}deg)`, offset: t });
    }
    return f;
  }
  function burst(layer, x, y, kind, n, spread) {
    n = n || 10; spread = spread || 60;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = spread * (0.6 + Math.random() * 0.7);
      const e = document.createElement("i");
      e.className = "fx-bit fx-bit--" + kind + " fx-c" + (i % 4);
      e.style.left = px(x); e.style.top = px(y);
      e.style.setProperty("--x", px(Math.cos(a) * d));
      e.style.setProperty("--y", px(Math.sin(a) * d * 0.8 - (kind === "shard" ? 10 : 24)));
      e.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
      e.style.animationDelay = Math.round(Math.random() * 90) + "ms";
      if (kind === "heart") e.innerHTML = HEART;
      if (kind === "star") e.innerHTML = STAR;
      layer.appendChild(e);
    }
  }
  function popText(layer, x, y, text) {
    const e = document.createElement("b");
    e.className = "fx-pop";
    e.textContent = text;
    e.style.left = px(x); e.style.top = px(y);
    layer.appendChild(e);
  }
  function rectOf(t) {
    if (typeof t === "function") return t();
    const r = t.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  /* ---------- הסצנות: כל אחת מקבלת (שלב, יעד, מתזמן) ומחזירה מתי הפגיעה ומתי הסוף ---------- */
  const SCENES = {
    cupid(L, r, at, o) {
      const W = innerWidth, size = Math.min(132, W * 0.34);
      const cx = o.from ? o.from.x - size / 2 : Math.min(W - size - 8, r.left + r.width * 0.72);
      const cy = o.from ? o.from.y - size / 2 : Math.max(70, r.top - size - 70);
      const tgt = { x: r.left + r.width * (o.from ? 0.5 : 0.42), y: r.top + r.height * 0.5 };
      const mid = { x: cx + size / 2, y: cy + size / 2 }, raw = { x: cx + size * 0.1, y: cy + size * 0.54 };
      let ang = Math.atan2(tgt.y - raw.y, tgt.x - raw.x) * 180 / Math.PI;
      const aim = Math.max(-55, Math.min(55, (ang < 0 ? ang + 360 : ang) - 180));
      const rad = aim * Math.PI / 180, vx = raw.x - mid.x, vy = raw.y - mid.y;
      const bow = { x: mid.x + vx * Math.cos(rad) - vy * Math.sin(rad), y: mid.y + vx * Math.sin(rad) + vy * Math.cos(rad) };
      ang = Math.atan2(tgt.y - bow.y, tgt.x - bow.x) * 180 / Math.PI;
      const AIM = `rotate(${aim.toFixed(1)}deg)`;
      const cu = mk(L, "fx-cupid", ART.cupid, { width: px(size), height: px(size), left: px(cx), top: px(cy) });
      cu.animate([{ transform: `translate(${px(W - cx + 40)},-90px) rotate(-10deg)` }, { transform: "translate(0,0) " + AIM }], { duration: 850, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" });
      at(950, () => cu.classList.add("is-drawing"));
      at(1450, () => {
        cu.classList.remove("is-drawing"); cu.classList.add("is-shot");
        const len = Math.hypot(tgt.x - bow.x, tgt.y - bow.y);
        const ar = mk(L, "fx-arrow", ART.arrow, { left: px(bow.x), top: px(bow.y), width: px(size * 0.62), height: px(size * 0.2), marginTop: px(-size * 0.1) });
        ar.animate([{ transform: `rotate(${ang}deg) translateX(0) rotate(180deg) scale(.9)` }, { transform: `rotate(${ang}deg) translateX(${px(len - 6)}) rotate(180deg)` }], { duration: 360, easing: "cubic-bezier(.5,0,.9,.6)", fill: "forwards" });
        sfx("paper");
      });
      at(1810, () => { burst(L, tgt.x, tgt.y, "heart", 9, 50); });
      at(2060, () => cu.animate([{ transform: "translate(0,0) " + AIM, opacity: 1 }, { transform: `translate(${px(W)},-160px) rotate(-20deg)`, opacity: 0 }], { duration: 900, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }));
      return { hit: 1810, end: 2650 };
    },

    chuppah(L, r, at) {
      const w = Math.min(r.width * 1.12, innerWidth - 12), h = w * 0.65;
      const left = r.left + r.width / 2 - w / 2, top = r.top + r.height * 0.55 - h;
      const ch = mk(L, "fx-chuppah", ART.chuppah, { width: px(w), height: px(h), left: px(left), top: px(top) });
      ch.animate([{ opacity: 0, transform: "translateY(-30px) scaleY(.3)" }, { opacity: 1, transform: "none" }], { duration: 650, easing: "cubic-bezier(.2,1.3,.4,1)", fill: "forwards" });
      const rs = Math.min(118, w * 0.36);
      const rx = r.left + r.width / 2 - rs * 0.35, ry = r.top - rs * 1.12;
      const rb = mk(L, "fx-rabbi", ART.rabbi, { width: px(rs), height: px(rs * 1.3), left: px(rx), top: px(ry) });
      rb.animate([{ opacity: 0, transform: `translateX(${px(rs)})` }, { opacity: 1, transform: "none" }], { duration: 600, delay: 350, easing: "cubic-bezier(.2,.8,.25,1)", fill: "backwards" });
      at(1050, () => rb.classList.add("is-winding"));
      const tgt = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.45 };
      at(1350, () => {
        rb.classList.remove("is-winding"); rb.classList.add("is-thrown");
        const gs = rs * 0.24, from = { x: rx + rs * 0.87 - gs / 2, y: ry + rs * 0.42 };
        const g = mk(L, "fx-glass", ART.glass, { width: px(gs), height: px(gs * 1.25), left: "0", top: "0" });
        g.animate(arcFrames(from, { x: tgt.x - gs / 2, y: tgt.y - gs * 0.6 }, 90, -540), { duration: 520, easing: "linear", fill: "forwards" });
        sfx("paper");
      });
      at(1870, () => { L.querySelector(".fx-glass") && L.querySelector(".fx-glass").remove(); burst(L, tgt.x, tgt.y, "shard", 16, 70); burst(L, tgt.x, tgt.y - 10, "heart", 6, 46); popText(L, tgt.x, r.top - 14, "מזל טוב!"); });
      at(2700, () => [ch, rb].forEach((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" })));
      return { hit: 1870, end: 3000, sound: "crack" };
    },

    ring(L, r, at) {
      const W = innerWidth, s = Math.min(96, W * 0.25);
      const bx = r.left + r.width * 0.5 - s / 2, by = r.top - s * 1.05;
      const box = mk(L, "fx-ringbox", ART.ringbox, { width: px(s), height: px(s * 0.9), left: px(bx), top: px(by) });
      box.animate([{ transform: `translate(${px(W - bx)},-60px) rotate(25deg)` }, { transform: "translate(0,0) rotate(0)" }], { duration: 800, easing: "cubic-bezier(.2,.9,.3,1.15)", fill: "forwards" });
      at(950, () => box.classList.add("is-open"));
      const rs = s * 0.42;
      const ring = mk(L, "fx-ring", ART.ring, { width: px(rs), height: px(rs * 1.15), left: px(bx + s / 2 - rs / 2), top: px(by + s * 0.3), opacity: "0" });
      const tgt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      at(1150, () => {
        ring.style.opacity = "1";
        ring.animate([{ transform: "translateY(0) scale(.6)" }, { transform: `translateY(${px(-s * 0.7)}) scale(1.2) rotate(-10deg)`, offset: 0.45 }, { transform: `translateY(${px(tgt.y - (by + s * 0.3) - rs * 0.4)}) scale(.9) rotate(360deg)` }],
          { duration: 780, easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" });
        burst(L, bx + s / 2, by + s * 0.3, "star", 6, 34);
      });
      at(1930, () => { burst(L, tgt.x, tgt.y, "star", 12, 64); burst(L, tgt.x, tgt.y, "heart", 6, 40); });
      at(2550, () => [box, ring].forEach((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" })));
      return { hit: 1930, end: 2800, sound: "chime" };
    },

    balloon(L, r, at) {
      const W = innerWidth, s = Math.min(70, W * 0.18);
      const tx = r.left + r.width * 0.62 - s / 2, ty = r.top - s * 1.25;
      const b = mk(L, "fx-balloonA", ART.balloon, { width: px(s), height: px(s * 2), left: px(tx), top: px(ty) });
      b.animate([
        { transform: `translate(${px(W * 0.35)},${px(innerHeight - ty)})` },
        { transform: `translate(${px(W * 0.12)},${px((innerHeight - ty) * 0.4)}) rotate(-8deg)`, offset: 0.5 },
        { transform: "translate(0,-18px) rotate(6deg)", offset: 0.85 },
        { transform: "translate(0,0) rotate(0)" },
      ], { duration: 1400, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" });
      at(1400, () => b.classList.add("is-squash"));
      const tgt = { x: tx + s / 2, y: ty + s * 0.5 };
      at(1650, () => { b.classList.add("is-popped"); burst(L, tgt.x, tgt.y, "confetti", 22, 80); popText(L, tgt.x, tgt.y - 10, "פופ!"); });
      return { hit: 1650, end: 2500, sound: "crack" };
    },

    stork(L, r, at) {
      const W = innerWidth, s = Math.min(150, W * 0.4);
      const y = Math.max(60, r.top - s * 1.3);
      const st = mk(L, "fx-stork", ART.stork, { width: px(s), height: px(s * 0.8), left: "0", top: px(y) });
      st.animate([{ transform: `translateX(${px(W + 10)})` }, { transform: `translateX(${px(-s - 20)})` }], { duration: 2400, easing: "linear", fill: "forwards" });
      const tgt = { x: r.left + r.width / 2, y: r.top + r.height * 0.3 };
      // משחררת את החבילה בדיוק מעל הכפתור
      const dropAt = Math.max(300, Math.min(1500, ((W + 10 - (tgt.x - s * 0.05)) / (W + s + 30)) * 2400));
      at(dropAt, () => {
        st.classList.add("is-dropped");
        const bs = s * 0.24, from = { x: tgt.x - bs / 2, y: y + s * 0.3 };
        const bd = mk(L, "fx-bundle", ART.bundle, { width: px(bs), height: px(bs * 0.85), left: "0", top: "0" });
        bd.animate([
          { transform: `translate(${px(from.x)},${px(from.y)}) rotate(0)` },
          { transform: `translate(${px(from.x - 8)},${px((from.y + tgt.y) / 2)}) rotate(-12deg)`, offset: 0.5 },
          { transform: `translate(${px(tgt.x - bs / 2)},${px(tgt.y - bs * 0.8)}) rotate(6deg)`, offset: 0.85 },
          { transform: `translate(${px(tgt.x - bs / 2)},${px(tgt.y - bs * 0.95)}) rotate(0)` },
        ], { duration: 700, easing: "cubic-bezier(.45,0,.75,1)", fill: "forwards" });
      });
      at(dropAt + 600, () => burst(L, tgt.x, tgt.y, "heart", 10, 56));
      at(dropAt + 1300, () => { const bd = L.querySelector(".fx-bundle"); if (bd) bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }); });
      return { hit: dropAt + 600, end: Math.max(2500, dropAt + 1500), sound: "chime" };
    },

    dove(L, r, at) {
      const W = innerWidth, s = Math.min(110, W * 0.3);
      const lx = r.left + r.width * 0.55 - s / 2, ly = r.top - s * 0.62;
      const d = mk(L, "fx-dove", ART.dove, { width: px(s), height: px(s * 0.75), left: px(lx), top: px(ly) });
      d.animate([
        { transform: `translate(${px(W - lx + 20)},-120px) rotate(-12deg)` },
        { transform: "translate(30px,-40px) rotate(-6deg)", offset: 0.7 },
        { transform: "translate(0,0) rotate(0)" },
      ], { duration: 1100, easing: "cubic-bezier(.25,.8,.3,1)", fill: "forwards" });
      at(1100, () => d.classList.add("is-landed"));
      const tgt = { x: lx + s * 0.1, y: r.top + 6 };
      at(1350, () => burst(L, tgt.x + s * 0.3, r.top - s * 0.2, "heart", 8, 46));
      at(2000, () => { d.classList.remove("is-landed"); d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${px(-lx - s)},-200px) rotate(-14deg)` }], { duration: 900, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }); });
      return { hit: 1350, end: 2700, sound: "chime" };
    },

    plane(L, r, at) {
      const W = innerWidth, s = Math.min(84, W * 0.22);
      const tgt = { x: r.left + r.width * 0.45, y: r.top + r.height * 0.4 };
      const cx = tgt.x + Math.min(90, W * 0.2), cy = r.top - Math.min(170, r.top - 40);
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        let x, y;
        if (t < 0.4) { const k = t / 0.4; x = W + 20 - (W + 20 - cx) * k; y = cy - 40 + 40 * k; }
        else if (t < 0.75) { const a = ((t - 0.4) / 0.35) * Math.PI * 2; x = cx + Math.sin(a) * 46; y = cy - 46 + Math.cos(a) * 46; }
        else { const k = (t - 0.75) / 0.25; x = cx + (tgt.x - cx) * k; y = cy + (tgt.y - cy) * k * k; }
        pts.push({ x, y, t });
      }
      const pl = mk(L, "fx-plane", ART.plane, { width: px(s), height: px(s * 0.66), left: "0", top: "0", marginLeft: px(-s / 2), marginTop: px(-s * 0.33) });
      const frames = pts.map((p, i) => {
        const q = pts[Math.min(i + 1, pts.length - 1)], pr = pts[Math.max(i - 1, 0)];
        const ang = Math.atan2(q.y - pr.y, q.x - pr.x) * 180 / Math.PI + 180;
        return { transform: `translate(${px(p.x)},${px(p.y)}) rotate(${ang.toFixed(0)}deg)`, offset: p.t };
      });
      pl.animate(frames, { duration: 1700, easing: "linear", fill: "forwards" });
      // שובל נקודות
      pts.forEach((p, i) => { if (i % 2 === 0 && i < 26) at(Math.round(p.t * 1700), () => { const e = document.createElement("i"); e.className = "fx-trail"; e.style.left = px(p.x); e.style.top = px(p.y); L.appendChild(e); }); });
      at(1700, () => { pl.animate([{ opacity: 1 }, { opacity: 0, transform: `translate(${px(tgt.x)},${px(tgt.y)}) scale(.4)` }], { duration: 200, fill: "forwards" }); burst(L, tgt.x, tgt.y, "star", 12, 60); });
      return { hit: 1700, end: 2500, sound: "chime" };
    },
  };

  function play(name, o) {
    o = o || {};
    const scene = SCENES[name];
    const stopped = { v: false };
    const timers = [];
    const L = document.createElement("div");
    L.className = "fx-layer";
    L.setAttribute("aria-hidden", "true");
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!stopped.v) fn(); }, ms));
    function stop() { stopped.v = true; timers.forEach(clearTimeout); L.remove(); }
    if (!scene || reduce()) { if (o.onDone) setTimeout(() => o.onDone(false), 0); return { stop, skipped: true }; }
    timers.push(setTimeout(() => {
      if (stopped.v) return;
      const r = rectOf(o.target);
      if (!r || !r.width) { stop(); return; }
      document.body.appendChild(L);
      const t = scene(L, r, at, o);
      at(t.hit, () => {
        sfx(t.sound || "crack"); if (t.sound !== "chime") sfx("chime");
        buzz(12);
        if (o.target && o.target.classList) { o.target.classList.remove("fx-hit"); void o.target.offsetWidth; o.target.classList.add("fx-hit"); }
        if (o.onHit) o.onHit();
      });
      at(t.end, () => { stop(); if (o.onDone) o.onDone(true); });
    }, o.lead || 0));
    return { stop };
  }

  // איזו דמות לכל סוג הפתעה
  const BY_TYPE = { partner: "cupid", proposal: "ring", birthday: "balloon", friend: "balloon", baby: "stork", sorry: "dove", family: "dove", thanks: "plane", other: "cupid" };

  window.MatanotFX = { play, scenes: Object.keys(SCENES), byType: BY_TYPE, art: ART };
})();
