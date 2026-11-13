import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Envelope, STAGES, type EnvelopeHandle } from "../Envelope";

describe("<Envelope>", () => {
  it("renders an accessible button with the seal, card and recipient", () => {
    render(<Envelope label="פתיחת המעטפה" to="לנועה" mark="נ" cardTitle="שאלה קטנה" cardText="רק כן או כן" palette="blush" />);
    const btn = screen.getByRole("button", { name: "פתיחת המעטפה, לנועה" });
    expect(btn).toHaveProperty("className", expect.stringContaining("env--liner-dots"));
    expect(btn.style.getPropertyValue("--env-seal")).toBe("#B83563");
    expect(btn.querySelector(".env__card-title")?.textContent).toBe("שאלה קטנה");
    expect(btn.querySelectorAll(".env__seal-half text")).toHaveLength(4); // two halves, each with the letter twice
  });

  it("runs the opening timeline and calls done once the card is presented", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    const ref = createRef<EnvelopeHandle>();
    const done = vi.fn();
    render(<Envelope ref={ref} />);
    const btn = screen.getByRole("button");
    act(() => ref.current!.open(done));
    expect(btn.className).toContain("is-cracked");
    expect(btn.className).not.toContain("is-open");
    act(() => vi.advanceTimersByTime(500));
    expect(btn.className).toContain("is-open");
    act(() => vi.advanceTimersByTime(2300));
    for (const s of STAGES) expect(btn.className).toContain(s);
    expect(done).toHaveBeenCalledTimes(1);
    // opening twice is ignored
    act(() => ref.current!.open(done));
    act(() => ref.current!.reset());
    expect(btn.className).not.toContain("is-cracked");
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("decorative copies are hidden from assistive tech and the tab order", () => {
    const { container } = render(<Envelope decorative cardTitle="20% הנחה" />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-hidden")).toBe("true");
    expect(btn.tabIndex).toBe(-1);
  });
});
