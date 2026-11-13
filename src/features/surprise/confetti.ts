/* Confetti made of shapes (hearts, stars, ribbons, dots), no emoji.
   Pieces are plain DOM nodes in the .fx overlay: hundreds of short-lived nodes
   are cheaper this way than as React state. */

const HEART = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c.8 5.6 3 8.3 9 9.5-6 1.2-8.2 3.9-9 9.5-.8-5.6-3-8.3-9-9.5 6-1.2 8.2-3.9 9-9.5z"/></svg>';

export function themeColors(): string[] {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return [v("--accent"), v("--accent-deep"), "#FFD45C", v("--ink"), "#FFFFFF", v("--soft")];
}

export function burst(host: HTMLElement | null, n = 60, colors: string[] = themeColors()) {
  if (!host) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    const kind = i % 7;
    const c = colors[i % colors.length];
    if (kind === 0) { s.className = "shape"; s.innerHTML = HEART; s.style.color = c; }
    else if (kind === 3) { s.className = "shape"; s.innerHTML = STAR; s.style.color = c; }
    else if (kind === 5) { s.className = "dot"; s.style.background = c; }
    else if (kind === 6) { s.className = "ribbon"; s.style.background = c; }
    else s.style.background = c;
    const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
    s.style.setProperty("--x", Math.cos(a) * d + "px");
    s.style.setProperty("--y", Math.sin(a) * d - 80 + "px");
    s.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
    s.style.animationDelay = Math.random() * 150 + "ms";
    frag.appendChild(s);
  }
  host.appendChild(frag);
  setTimeout(() => (host.innerHTML = ""), 2100);
}
