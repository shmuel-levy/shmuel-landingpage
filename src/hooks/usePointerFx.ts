import { useEffect, type RefObject } from "react";
import { motionOff } from "@/lib/motion";

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** 3D tilt that follows the mouse (desktop only). Sets --rx/--ry (and --gx/--gy for the glare). */
export function useTilt<T extends HTMLElement>(ref: RefObject<T | null>, max: number, maxY = max, glare = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer()) return;
    const move = (e: PointerEvent) => {
      if (motionOff()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", (-y * max).toFixed(2) + "deg");
      el.style.setProperty("--ry", (x * maxY).toFixed(2) + "deg");
      if (glare) {
        el.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(0) + "%");
        el.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(0) + "%");
        el.classList.add("is-tilting");
      }
    };
    const leave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.classList.remove("is-tilting");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref, max, maxY, glare]);
}

/** "Magnetic" buttons that lean toward the mouse (desktop only), for every .btn--magnetic on the page. */
export function useMagneticButtons() {
  useEffect(() => {
    if (!finePointer()) return;
    const offs: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".btn--magnetic").forEach((b) => {
      const move = (e: PointerEvent) => {
        if (motionOff()) return;
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + "px");
      };
      const leave = () => {
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      };
      b.addEventListener("pointermove", move);
      b.addEventListener("pointerleave", leave);
      offs.push(() => {
        b.removeEventListener("pointermove", move);
        b.removeEventListener("pointerleave", leave);
      });
    });
    return () => offs.forEach((f) => f());
  }, []);
}
