import type { CSSProperties } from "react";

/* Colour palettes: used by the envelope and by the whole surprise site (theme). */

export interface Palette {
  label: string;
  /** envelope colours → CSS vars --env-* */
  env: Record<string, string>;
  /** site theme → CSS vars --bg, --accent, --accent-deep, --ink, --soft */
  theme: Record<string, string>;
  swatch: [string, string, string];
}

export const PALETTES = {
  blush: {
    label: "ורוד פודרה",
    env: { paper: "#F6D4DF", shade: "#E7AFC2", "liner-a": "#C24873", "liner-b": "#FBE7EE", seal: "#B83563", "seal-hi": "#EE7DA3", "seal-deep": "#6E1A39", card: "#FFFCF8", ink: "#5A1631" },
    theme: { bg: "linear-gradient(170deg,#FFF8F5,#FCE1EA)", accent: "#E26D93", "accent-deep": "#B83563", ink: "#4A1530", soft: "#FDE6EE" },
    swatch: ["#F6D4DF", "#B83563", "#FFFCF8"],
  },
  ink: {
    label: "כחול דיו",
    env: { paper: "#2E62D3", shade: "#1D3F95", "liner-a": "#F5A9C0", "liner-b": "#16307F", seal: "#D9467A", "seal-hi": "#F58AAE", "seal-deep": "#7A1B3E", card: "#FFFCF8", ink: "#12297A", to: "#FFFFFF" },
    theme: { bg: "linear-gradient(170deg,#F4F8FF,#DCE7FF)", accent: "#5B8DEF", "accent-deep": "#1F4FB8", ink: "#12297A", soft: "#E6EEFF" },
    swatch: ["#2E62D3", "#D9467A", "#FFFCF8"],
  },
  lilac: {
    label: "לילך",
    env: { paper: "#DCCFF6", shade: "#BBA6EA", "liner-a": "#6E4BC2", "liner-b": "#F3EEFD", seal: "#5B3FA8", "seal-hi": "#9C80E6", "seal-deep": "#2E1A66", card: "#FFFCF8", ink: "#2E1A66" },
    theme: { bg: "linear-gradient(170deg,#FAF7FF,#E6DCFA)", accent: "#9B7FE0", "accent-deep": "#5B3FA8", ink: "#2E1A66", soft: "#EFE8FB" },
    swatch: ["#DCCFF6", "#5B3FA8", "#FFFCF8"],
  },
  peach: {
    label: "אפרסק",
    env: { paper: "#FFD6C0", shade: "#F4B293", "liner-a": "#D9683A", "liner-b": "#FFF3EB", seal: "#C2552A", "seal-hi": "#F2905F", "seal-deep": "#6E2B0E", card: "#FFFCF8", ink: "#4A1F0C" },
    theme: { bg: "linear-gradient(170deg,#FFF8F2,#FFE0CC)", accent: "#F08A5D", "accent-deep": "#AD481D", ink: "#4A1F0C", soft: "#FFE8DA" },
    swatch: ["#FFD6C0", "#C2552A", "#FFFCF8"],
  },
  mint: {
    label: "מנטה",
    env: { paper: "#CBEEDD", shade: "#9BD7BC", "liner-a": "#1E7A58", "liner-b": "#EFFAF5", seal: "#17694B", "seal-hi": "#4DBA8F", "seal-deep": "#093524", card: "#FFFCF8", ink: "#0D3B2B" },
    theme: { bg: "linear-gradient(170deg,#F3FCF8,#D5F1E4)", accent: "#3BB58A", "accent-deep": "#17694B", ink: "#0D3B2B", soft: "#DDF5EA" },
    swatch: ["#CBEEDD", "#17694B", "#FFFCF8"],
  },
  gold: {
    label: "שמנת וזהב",
    env: { paper: "#F3E8CF", shade: "#E0CBA0", "liner-a": "#B08A2E", "liner-b": "#FFF9EC", seal: "#9C7420", "seal-hi": "#DDB65A", "seal-deep": "#4E3707", card: "#FFFDF8", ink: "#3D2C08" },
    theme: { bg: "linear-gradient(170deg,#FFFCF4,#F3E6C8)", accent: "#D4A63A", "accent-deep": "#85600F", ink: "#3D2C08", soft: "#F7EDD5" },
    swatch: ["#F3E8CF", "#9C7420", "#FFFDF8"],
  },
} satisfies Record<string, Palette>;

export type PaletteKey = keyof typeof PALETTES;

export const LINERS = { dots: "נקודות", stripes: "פסים", hearts: "לבבות", confetti: "קונפטי" } as const;
export type LinerKey = keyof typeof LINERS;

export const isPalette = (k: unknown): k is PaletteKey => typeof k === "string" && k in PALETTES;
export const getPalette = (k: unknown): Palette => (isPalette(k) ? PALETTES[k] : PALETTES.blush);

/** CSS custom properties for an envelope palette, for a React style prop. */
export function paletteStyle(key: unknown): CSSProperties {
  const p = getPalette(key);
  return Object.fromEntries(Object.entries(p.env).map(([k, v]) => ["--env-" + k, v])) as CSSProperties;
}

/** Same as paletteStyle, applied imperatively (for non-React hosts). */
export function applyPalette(el: HTMLElement, key: unknown) {
  for (const [k, v] of Object.entries(getPalette(key).env)) el.style.setProperty("--env-" + k, v);
}
