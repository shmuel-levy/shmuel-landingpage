/* Where should the runaway "no" button jump next?
   Fixed spots around the edges of the play area, never overlapping the "yes"
   button (including the size it will grow to), never the same spot twice in a row. */

export interface Box { x: number; y: number; w: number; h: number }

/** Pure geometry (unit-tested). `area` = play area size, `no`/`yes` = button boxes inside it. */
export function chooseSpot(
  area: { w: number; h: number },
  no: { w: number; h: number },
  yes: Box,
  yesScale: number,
  last: number,
  noScale: number,
  rand: () => number = Math.random,
): { i: number; x: number; y: number } {
  const yw = yes.w * yesScale, yh = yes.h * yesScale;
  const cx = yes.x + yes.w / 2, cy = yes.y + yes.h / 2;
  const Y = { l: cx - yw / 2 - 10, r: cx + yw / 2 + 10, t: cy - yh / 2 - 8, b: cy + yh / 2 + 8 };
  const mx = Math.max(0, area.w - no.w), my = Math.max(0, area.h - no.h);
  const spots: [number, number][] = [[0, 0], [mx, 0], [0, my], [mx, my], [mx / 2, 0], [mx / 2, my], [0, my / 2], [mx, my / 2]];
  // the button shrinks around its centre
  const ix = (no.w * (1 - noScale)) / 2, iy = (no.h * (1 - noScale)) / 2;
  let ok = spots
    .map((_, i) => i)
    .filter((i) => {
      const [x, y] = spots[i];
      const hit = x + ix < Y.r && x + no.w - ix > Y.l && y + iy < Y.b && y + no.h - iy > Y.t;
      return i !== last && !hit;
    });
  if (!ok.length) ok = [last === 0 ? 3 : 0];
  const i = ok[Math.floor(rand() * ok.length)];
  return { i, x: spots[i][0], y: spots[i][1] };
}

export function pickRunawaySpot(area: HTMLElement, no: HTMLElement, yes: HTMLElement, yesScale: number, last: number, noScale: number) {
  return chooseSpot(
    { w: area.clientWidth, h: area.clientHeight },
    { w: no.offsetWidth, h: no.offsetHeight },
    { x: yes.offsetLeft, y: yes.offsetTop, w: yes.offsetWidth, h: yes.offsetHeight },
    yesScale,
    last,
    noScale,
  );
}
