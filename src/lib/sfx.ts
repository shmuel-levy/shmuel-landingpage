/* =========================================================
   Tiny sound effects synthesized with the Web Audio API (no audio files):
   wax cracking, paper sliding, a small chime.
   ========================================================= */
import { userHasInteracted } from "./motion";

export type SfxName = "crack" | "paper" | "chime";

let ctx: AudioContext | null = null;
export const sfxSettings = { enabled: true };

function audio(): AudioContext | null {
  if (!sfxSettings.enabled) return null;
  // Browsers refuse to play before the first tap; don't even try (no console warnings).
  if (!userHasInteracted()) return null;
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = ctx || new C();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = b;
  return src;
}

function envelope(g: GainNode, t: number, peak: number, attack: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

const SFX: Record<SfxName, (c: AudioContext, t: number) => void> = {
  // a sharp click with a little body
  crack(c, t) {
    const n = noise(c, 0.14), hp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass";
    hp.frequency.value = 1900;
    n.connect(hp); hp.connect(g); g.connect(c.destination);
    envelope(g, t, 0.22, 0.004, 0.11);
    n.start(t); n.stop(t + 0.15);
    const o = c.createOscillator(), g2 = c.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    o.connect(g2); g2.connect(c.destination);
    envelope(g2, t, 0.16, 0.004, 0.12);
    o.start(t); o.stop(t + 0.15);
  },
  // paper sliding out
  paper(c, t) {
    const n = noise(c, 0.6), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass";
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
    n.connect(bp); bp.connect(g); g.connect(c.destination);
    envelope(g, t, 0.07, 0.18, 0.38);
    n.start(t); n.stop(t + 0.6);
  },
  // a small chime when the card is presented
  chime(c, t) {
    for (const [f, dt] of [[1318.5, 0], [1975.5, 0.09], [2637, 0.2]] as const) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g); g.connect(c.destination);
      envelope(g, t + dt, 0.045, 0.01, 1.1);
      o.start(t + dt); o.stop(t + dt + 1.2);
    }
  },
};

export function playSfx(name: SfxName) {
  const c = audio();
  if (!c) return;
  try {
    SFX[name](c, c.currentTime + 0.01);
  } catch {
    /* no sound, no problem */
  }
}
