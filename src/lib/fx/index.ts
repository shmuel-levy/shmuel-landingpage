/* =========================================================
   Finishing characters: each surprise type gets a character that "hits"
   the continue button when an activity is done.
     cupid   shoots an arrow            (love, dates)
     chuppah a rabbi throws a glass      (anniversary)
     ring    a ring box opens            (proposal)
     balloon rises and pops             (birthday, friends)
     stork   drops a bundle             (pregnancy)
     dove    lands with an olive branch (apology, family)
     plane   a paper plane loops        (thanks, trips)
   playFx("cupid", { target, lead, from, onHit, onDone }) → { stop }
   Implemented with the Web Animations API on a fixed overlay layer that
   follows the target on every frame, so scrolling never makes it miss.
   ========================================================= */
import { playSfx, type SfxName } from "../sfx";
import { motionOff, replayClass, vibrate } from "../motion";
import { ART, HEART, STAR } from "./art";

export type SceneName = "cupid" | "chuppah" | "ring" | "balloon" | "stork" | "dove" | "plane";
export interface Rect { left: number; top: number; width: number; height: number }
export type Target = HTMLElement | (() => Rect | null);

export interface FxOptions {
  target: Target;
  /** delay before the scene starts (ms) */
  lead?: number;
  /** where the character enters from (cupid) */
  from?: { x: number; y: number };
  onHit?: () => void;
  /** ok = false when the scene was skipped (reduced motion / unknown scene) */
  onDone?: (ok: boolean) => void;
}
export interface FxRun { stop: () => void; skipped?: boolean }

type At = (ms: number, fn: () => void) => void;
interface SceneTiming { hit: number; end: number; sound?: SfxName }
type Scene = (L: HTMLElement, r: Rect, at: At, o: FxOptions) => SceneTiming;

/** Which character finishes the steps of each surprise type. */
export const FX_BY_TYPE: Record<string, SceneName> = {
  partner: "cupid", proposal: "ring", birthday: "balloon", friend: "balloon", baby: "stork",
  sorry: "dove", family: "dove", thanks: "plane", other: "cupid",
};

/* ---------- helpers ---------- */
const px = (n: number) => Math.round(n) + "px";

function mk(layer: HTMLElement, cls: string, html: string, css: Partial<CSSStyleDeclaration> = {}) {
  const e = document.createElement("div");
  e.className = "fx-actor " + cls;
  e.innerHTML = html;
  Object.assign(e.style, css);
  layer.appendChild(e);
  return e;
}

/** A parabolic arc as keyframes. */
function arcFrames(from: { x: number; y: number }, to: { x: number; y: number }, lift: number, spin = 0, n = 14): Keyframe[] {
  const f: Keyframe[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = from.x + (to.x - from.x) * t, y = from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t);
    f.push({ transform: `translate(${px(x)},${px(y)}) rotate(${spin * t}deg)`, offset: t });
  }
  return f;
}

function burst(layer: HTMLElement, x: number, y: number, kind: "heart" | "star" | "shard" | "confetti", n = 10, spread = 60) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = spread * (0.6 + Math.random() * 0.7);
    const e = document.createElement("i");
    e.className = `fx-bit fx-bit--${kind} fx-c${i % 4}`;
    e.style.left = px(x);
    e.style.top = px(y);
    e.style.setProperty("--x", px(Math.cos(a) * d));
    e.style.setProperty("--y", px(Math.sin(a) * d * 0.8 - (kind === "shard" ? 10 : 24)));
    e.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
    e.style.animationDelay = Math.round(Math.random() * 90) + "ms";
    if (kind === "heart") e.innerHTML = HEART;
    if (kind === "star") e.innerHTML = STAR;
    layer.appendChild(e);
  }
}

function popText(layer: HTMLElement, x: number, y: number, text: string) {
  const e = document.createElement("b");
  e.className = "fx-pop";
  e.textContent = text;
  e.style.left = px(x);
  e.style.top = px(y);
  layer.appendChild(e);
}

function rectOf(t: Target): Rect | null {
  if (typeof t === "function") return t();
  const r = t.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

const fadeOut = (els: HTMLElement[], duration = 300) =>
  els.forEach((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" }));

/* ---------- scenes: each gets (layer, target rect, scheduler) and returns when it hits and ends ---------- */
const SCENES: Record<SceneName, Scene> = {
  cupid(L, r, at, o) {
    const W = innerWidth, size = Math.min(132, W * 0.34);
    const cx = o.from ? o.from.x - size / 2 : Math.min(W - size - 8, r.left + r.width * 0.72);
    const cy = o.from ? o.from.y - size / 2 : Math.max(70, r.top - size - 70);
    const tgt = { x: r.left + r.width * (o.from ? 0.5 : 0.42), y: r.top + r.height * 0.5 };
    const mid = { x: cx + size / 2, y: cy + size / 2 }, raw = { x: cx + size * 0.1, y: cy + size * 0.54 };
    let ang = (Math.atan2(tgt.y - raw.y, tgt.x - raw.x) * 180) / Math.PI;
    const aim = Math.max(-55, Math.min(55, (ang < 0 ? ang + 360 : ang) - 180));
    const rad = (aim * Math.PI) / 180, vx = raw.x - mid.x, vy = raw.y - mid.y;
    const bow = { x: mid.x + vx * Math.cos(rad) - vy * Math.sin(rad), y: mid.y + vx * Math.sin(rad) + vy * Math.cos(rad) };
    ang = (Math.atan2(tgt.y - bow.y, tgt.x - bow.x) * 180) / Math.PI;
    const AIM = `rotate(${aim.toFixed(1)}deg)`;
    const cu = mk(L, "fx-cupid", ART.cupid, { width: px(size), height: px(size), left: px(cx), top: px(cy) });
    cu.animate([{ transform: `translate(${px(W - cx + 40)},-90px) rotate(-10deg)` }, { transform: "translate(0,0) " + AIM }], { duration: 850, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" });
    at(950, () => cu.classList.add("is-drawing"));
    at(1450, () => {
      cu.classList.remove("is-drawing");
      cu.classList.add("is-shot");
      const len = Math.hypot(tgt.x - bow.x, tgt.y - bow.y);
      const ar = mk(L, "fx-arrow", ART.arrow, { left: px(bow.x), top: px(bow.y), width: px(size * 0.62), height: px(size * 0.2), marginTop: px(-size * 0.1) });
      ar.animate([{ transform: `rotate(${ang}deg) translateX(0) rotate(180deg) scale(.9)` }, { transform: `rotate(${ang}deg) translateX(${px(len - 6)}) rotate(180deg)` }], { duration: 360, easing: "cubic-bezier(.5,0,.9,.6)", fill: "forwards" });
      playSfx("paper");
    });
    at(1810, () => burst(L, tgt.x, tgt.y, "heart", 9, 50));
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
      rb.classList.remove("is-winding");
      rb.classList.add("is-thrown");
      const gs = rs * 0.24, from = { x: rx + rs * 0.87 - gs / 2, y: ry + rs * 0.42 };
      const g = mk(L, "fx-glass", ART.glass, { width: px(gs), height: px(gs * 1.25), left: "0", top: "0" });
      g.animate(arcFrames(from, { x: tgt.x - gs / 2, y: tgt.y - gs * 0.6 }, 90, -540), { duration: 520, easing: "linear", fill: "forwards" });
      playSfx("paper");
    });
    at(1870, () => {
      L.querySelector(".fx-glass")?.remove();
      burst(L, tgt.x, tgt.y, "shard", 16, 70);
      burst(L, tgt.x, tgt.y - 10, "heart", 6, 46);
      popText(L, tgt.x, r.top - 14, "מזל טוב!");
    });
    at(2700, () => fadeOut([ch, rb], 350));
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
      ring.animate(
        [
          { transform: "translateY(0) scale(.6)" },
          { transform: `translateY(${px(-s * 0.7)}) scale(1.2) rotate(-10deg)`, offset: 0.45 },
          { transform: `translateY(${px(tgt.y - (by + s * 0.3) - rs * 0.4)}) scale(.9) rotate(360deg)` },
        ],
        { duration: 780, easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" },
      );
      burst(L, bx + s / 2, by + s * 0.3, "star", 6, 34);
    });
    at(1930, () => {
      burst(L, tgt.x, tgt.y, "star", 12, 64);
      burst(L, tgt.x, tgt.y, "heart", 6, 40);
    });
    at(2550, () => fadeOut([box, ring]));
    return { hit: 1930, end: 2800, sound: "chime" };
  },

  balloon(L, r, at) {
    const W = innerWidth, s = Math.min(70, W * 0.18);
    const tx = r.left + r.width * 0.62 - s / 2, ty = r.top - s * 1.25;
    const b = mk(L, "fx-balloonA", ART.balloon, { width: px(s), height: px(s * 2), left: px(tx), top: px(ty) });
    b.animate(
      [
        { transform: `translate(${px(W * 0.35)},${px(innerHeight - ty)})` },
        { transform: `translate(${px(W * 0.12)},${px((innerHeight - ty) * 0.4)}) rotate(-8deg)`, offset: 0.5 },
        { transform: "translate(0,-18px) rotate(6deg)", offset: 0.85 },
        { transform: "translate(0,0) rotate(0)" },
      ],
      { duration: 1400, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" },
    );
    at(1400, () => b.classList.add("is-squash"));
    const tgt = { x: tx + s / 2, y: ty + s * 0.5 };
    at(1650, () => {
      b.classList.add("is-popped");
      burst(L, tgt.x, tgt.y, "confetti", 22, 80);
      popText(L, tgt.x, tgt.y - 10, "פופ!");
    });
    return { hit: 1650, end: 2500, sound: "crack" };
  },

  stork(L, r, at) {
    const W = innerWidth, s = Math.min(150, W * 0.4);
    const y = Math.max(60, r.top - s * 1.3);
    const st = mk(L, "fx-stork", ART.stork, { width: px(s), height: px(s * 0.8), left: "0", top: px(y) });
    st.animate([{ transform: `translateX(${px(W + 10)})` }, { transform: `translateX(${px(-s - 20)})` }], { duration: 2400, easing: "linear", fill: "forwards" });
    const tgt = { x: r.left + r.width / 2, y: r.top + r.height * 0.3 };
    // drop the bundle exactly above the button
    const dropAt = Math.max(300, Math.min(1500, ((W + 10 - (tgt.x - s * 0.05)) / (W + s + 30)) * 2400));
    at(dropAt, () => {
      st.classList.add("is-dropped");
      const bs = s * 0.24, from = { x: tgt.x - bs / 2, y: y + s * 0.3 };
      const bd = mk(L, "fx-bundle", ART.bundle, { width: px(bs), height: px(bs * 0.85), left: "0", top: "0" });
      bd.animate(
        [
          { transform: `translate(${px(from.x)},${px(from.y)}) rotate(0)` },
          { transform: `translate(${px(from.x - 8)},${px((from.y + tgt.y) / 2)}) rotate(-12deg)`, offset: 0.5 },
          { transform: `translate(${px(tgt.x - bs / 2)},${px(tgt.y - bs * 0.8)}) rotate(6deg)`, offset: 0.85 },
          { transform: `translate(${px(tgt.x - bs / 2)},${px(tgt.y - bs * 0.95)}) rotate(0)` },
        ],
        { duration: 700, easing: "cubic-bezier(.45,0,.75,1)", fill: "forwards" },
      );
    });
    at(dropAt + 600, () => burst(L, tgt.x, tgt.y, "heart", 10, 56));
    at(dropAt + 1300, () => {
      const bd = L.querySelector<HTMLElement>(".fx-bundle");
      if (bd) fadeOut([bd]);
    });
    return { hit: dropAt + 600, end: Math.max(2500, dropAt + 1500), sound: "chime" };
  },

  dove(L, r, at) {
    const W = innerWidth, s = Math.min(110, W * 0.3);
    const lx = r.left + r.width * 0.55 - s / 2, ly = r.top - s * 0.62;
    const d = mk(L, "fx-dove", ART.dove, { width: px(s), height: px(s * 0.75), left: px(lx), top: px(ly) });
    d.animate(
      [
        { transform: `translate(${px(W - lx + 20)},-120px) rotate(-12deg)` },
        { transform: "translate(30px,-40px) rotate(-6deg)", offset: 0.7 },
        { transform: "translate(0,0) rotate(0)" },
      ],
      { duration: 1100, easing: "cubic-bezier(.25,.8,.3,1)", fill: "forwards" },
    );
    at(1100, () => d.classList.add("is-landed"));
    const tgt = { x: lx + s * 0.1, y: r.top + 6 };
    at(1350, () => burst(L, tgt.x + s * 0.3, r.top - s * 0.2, "heart", 8, 46));
    at(2000, () => {
      d.classList.remove("is-landed");
      d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${px(-lx - s)},-200px) rotate(-14deg)` }], { duration: 900, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" });
    });
    return { hit: 1350, end: 2700, sound: "chime" };
  },

  plane(L, r, at) {
    const W = innerWidth, s = Math.min(84, W * 0.22);
    const tgt = { x: r.left + r.width * 0.45, y: r.top + r.height * 0.4 };
    const cx = tgt.x + Math.min(90, W * 0.2), cy = r.top - Math.min(170, r.top - 40);
    const pts: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      let x: number, y: number;
      if (t < 0.4) {
        const k = t / 0.4;
        x = W + 20 - (W + 20 - cx) * k;
        y = cy - 40 + 40 * k;
      } else if (t < 0.75) {
        const a = ((t - 0.4) / 0.35) * Math.PI * 2;
        x = cx + Math.sin(a) * 46;
        y = cy - 46 + Math.cos(a) * 46;
      } else {
        const k = (t - 0.75) / 0.25;
        x = cx + (tgt.x - cx) * k;
        y = cy + (tgt.y - cy) * k * k;
      }
      pts.push({ x, y, t });
    }
    const pl = mk(L, "fx-plane", ART.plane, { width: px(s), height: px(s * 0.66), left: "0", top: "0", marginLeft: px(-s / 2), marginTop: px(-s * 0.33) });
    const frames = pts.map((p, i) => {
      const q = pts[Math.min(i + 1, pts.length - 1)], pr = pts[Math.max(i - 1, 0)];
      const ang = (Math.atan2(q.y - pr.y, q.x - pr.x) * 180) / Math.PI + 180;
      return { transform: `translate(${px(p.x)},${px(p.y)}) rotate(${ang.toFixed(0)}deg)`, offset: p.t };
    });
    pl.animate(frames, { duration: 1700, easing: "linear", fill: "forwards" });
    // dotted trail
    pts.forEach((p, i) => {
      if (i % 2 === 0 && i < 26)
        at(Math.round(p.t * 1700), () => {
          const e = document.createElement("i");
          e.className = "fx-trail";
          e.style.left = px(p.x);
          e.style.top = px(p.y);
          L.appendChild(e);
        });
    });
    at(1700, () => {
      pl.animate([{ opacity: 1 }, { opacity: 0, transform: `translate(${px(tgt.x)},${px(tgt.y)}) scale(.4)` }], { duration: 200, fill: "forwards" });
      burst(L, tgt.x, tgt.y, "star", 12, 60);
    });
    return { hit: 1700, end: 2500, sound: "chime" };
  },
};

export const SCENE_NAMES = Object.keys(SCENES) as SceneName[];
export const isScene = (n: unknown): n is SceneName => typeof n === "string" && n in SCENES;

export function playFx(name: string, o: FxOptions): FxRun {
  const scene = isScene(name) ? SCENES[name] : null;
  let stopped = false;
  const timers: number[] = [];
  const L = document.createElement("div");
  L.className = "fx-layer";
  L.setAttribute("aria-hidden", "true");
  const at: At = (ms, fn) => timers.push(window.setTimeout(() => !stopped && fn(), ms));
  let raf = 0;
  const stop = () => {
    stopped = true;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(raf);
    L.remove();
  };
  // The whole scene sticks to the target: when the page scrolls, the character, the arrow and
  // the hearts move with it, so the arrow always lands on the button.
  const follow = (r0: Rect) => {
    const loop = () => {
      if (stopped) return;
      const r = rectOf(o.target);
      if (r && r.width) L.style.transform = `translate(${(r.left - r0.left).toFixed(1)}px,${(r.top - r0.top).toFixed(1)}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };

  if (!scene || motionOff()) {
    if (o.onDone) setTimeout(() => o.onDone?.(false), 0);
    return { stop, skipped: true };
  }
  timers.push(
    window.setTimeout(() => {
      if (stopped) return;
      const r = rectOf(o.target);
      if (!r || !r.width) return stop();
      document.body.appendChild(L);
      const t = scene(L, r, at, o);
      follow(r);
      at(t.hit, () => {
        playSfx(t.sound || "crack");
        if (t.sound !== "chime") playSfx("chime");
        vibrate(12);
        if (typeof o.target !== "function") replayClass(o.target, "fx-hit");
        o.onHit?.();
      });
      at(t.end, () => {
        stop();
        o.onDone?.(true);
      });
    }, o.lead || 0),
  );
  return { stop };
}
