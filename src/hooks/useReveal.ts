import { useEffect, useRef, useState, type RefObject } from "react";
import { motionOff } from "@/lib/motion";

/** Calls `onEnter` once, the first time the element scrolls into view. */
export function useInViewOnce<T extends Element>(ref: RefObject<T | null>, onEnter: () => void, options: IntersectionObserverInit = { threshold: 0.12 }) {
  const cb = useRef(onEnter);
  cb.current = onEnter;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return cb.current();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        cb.current();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

/** Tracks whether the element is in view right now (e.g. to pause an animation off screen). */
export function useInView<T extends Element>(ref: RefObject<T | null>, threshold = 0.3): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

/**
 * Fade-in-on-scroll for elements with the `.reveal` class.
 * Returns a ref and the class string ("reveal" or "reveal is-visible").
 * Visibility lives in React state, so re-renders never drop it.
 */
export function useReveal<T extends Element>(): [RefObject<T | null>, string] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (motionOff()) setVisible(true);
  }, []);
  useInViewOnce(ref, () => setVisible(true), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  return [ref, visible ? "reveal is-visible" : "reveal"];
}
