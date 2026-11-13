import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no matchMedia: default to "no preference" (motion on, coarse pointer off).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as MediaQueryList;
}

// Unmount React trees between tests.
afterEach(() => cleanup());
