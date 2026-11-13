import { useEffect, useState } from "react";
import { timeLeftText } from "@/lib/pricing";
import type { Promo } from "@/types/content";

/** Countdown text for the promo, refreshed every minute. */
export function useTimeLeft(promo: Promo | null): string {
  const [text, setText] = useState(() => (promo ? timeLeftText(promo) : ""));
  useEffect(() => {
    if (!promo) return;
    setText(timeLeftText(promo));
    const t = setInterval(() => setText(timeLeftText(promo)), 60000);
    return () => clearInterval(t);
  }, [promo]);
  return text;
}
