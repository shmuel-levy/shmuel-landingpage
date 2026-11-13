import { createContext, useContext } from "react";
import type { DemoConfig, Step } from "./types";

export interface SurpriseApi {
  demo: DemoConfig;
  sketch: boolean;
  gift: boolean;
  /** inside the phone on the home page (?embed=1) */
  embed: boolean;
  /** OS "reduce motion" */
  reduce: boolean;
  /** the step should take focus when it mounts (after "next") */
  focusOnMount: boolean;
  leaving: boolean;
  next: () => void;
  restart: () => void;
  /** screen-reader announcement */
  announce: (text: string) => void;
  /** confetti */
  burst: (n?: number) => void;
  /** a finishing character hits `btn` and moves on by itself */
  celebrate: (btn: HTMLElement | null, lead: number, step?: Step) => void;
  stopFx: () => void;
  /** fills {placeholders} with the visitor's answers (or demo defaults) */
  fill: (s?: string) => string;
  setAnswer: (key: string, value: string) => void;
  startMusic: () => void;
  /** pause the music while a voice message plays, resume afterwards */
  duck: (on: boolean) => void;
  track: (name: string, params?: Record<string, unknown>) => void;
  /** e.g. "love" for demos/love.html */
  pageName: string;
  siteUrl: string;
}

export const SurpriseContext = createContext<SurpriseApi | null>(null);

export function useSurprise(): SurpriseApi {
  const ctx = useContext(SurpriseContext);
  if (!ctx) throw new Error("useSurprise must be used inside <SurpriseApp>");
  return ctx;
}
