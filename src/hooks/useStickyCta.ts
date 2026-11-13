import { useEffect, useState } from "react";

/**
 * Sticky bottom CTA (phones) appears after scrolling past the hero and hides near the footer.
 * Toggles `body.cta-on`, which the stylesheet uses for both the bar and the WhatsApp float.
 */
export function useStickyCta(heroId = "top", heroFraction = 0.7, bottomGap = 260) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const hero = document.getElementById(heroId);
      const y = window.scrollY;
      const isPast = !!hero && y > hero.offsetHeight * heroFraction;
      setPast(isPast);
      document.body.classList.toggle("cta-on", isPast && y < document.documentElement.scrollHeight - window.innerHeight - bottomGap);
    };
    const on = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [heroId, heroFraction, bottomGap]);
  return past;
}
