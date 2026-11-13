/* A music box synthesized in the browser (Web Audio): no audio files, no licensing. */

export const MOODS: Record<string, { step: number; melody: number[] }> = {
  romantic: { step: 0.3, melody: [0, 4, 7, 12, 11, 7, 4, 7, 2, 5, 9, 14, 12, 9, 5, 9, -3, 0, 4, 9, 7, 4, 0, 4, -1, 2, 7, 11, 9, 7, 2, 7] },
  happy: { step: 0.2, melody: [0, 4, 7, 4, 9, 7, 4, 0, 2, 5, 9, 5, 7, 4, 0, 4, 0, 4, 7, 12, 11, 9, 7, 4, 5, 4, 2, 4, 0, 7, 0, 12] },
  emotional: { step: 0.38, melody: [-3, 0, 4, 9, 7, 4, 0, 4, -7, -3, 0, 5, 4, 0, -3, 0, -5, -1, 2, 7, 5, 2, -1, 2, -3, 0, 4, 9, 12, 9, 4, 0] },
};

const C5 = 523.25;

export class MusicBox {
  on = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private t = 0;
  private n = 0;
  private readonly step: number;
  private readonly melody: number[];

  constructor(mood: string | undefined, melody: number[] | undefined, private readonly onChange: (on: boolean) => void) {
    const m = MOODS[mood || ""] || MOODS.romantic;
    this.step = m.step;
    this.melody = melody || m.melody;
  }

  start() {
    if (this.on) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = this.ctx || new AC();
      void this.ctx.resume();
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.07;
        this.master.connect(this.ctx.destination);
      }
      this.on = true;
      this.t = this.ctx.currentTime + 0.1;
      this.timer = window.setInterval(() => this.schedule(), 120);
      this.onChange(true);
    } catch {
      /* no music, no problem */
    }
  }

  stop() {
    this.on = false;
    clearInterval(this.timer);
    this.onChange(false);
  }

  toggle() {
    if (this.on) this.stop();
    else this.start();
  }

  private schedule() {
    const c = this.ctx!;
    while (this.t < c.currentTime + 0.5) {
      const semi = this.melody[this.n % this.melody.length];
      this.note(C5 * Math.pow(2, semi / 12), this.t, 0.9);
      if (this.n % 8 === 0) this.note((C5 / 4) * Math.pow(2, semi / 12), this.t, 0.5);
      this.t += this.step;
      this.n++;
    }
  }

  private note(freq: number, when: number, vol: number) {
    const c = this.ctx!, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
    o.type = "sine";
    o2.type = "triangle";
    o.frequency.value = freq;
    o2.frequency.value = freq * 2;
    g2.gain.value = 0.15;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.master!);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.3);
    o.start(when); o2.start(when);
    o.stop(when + 1.4); o2.stop(when + 1.4);
  }
}
