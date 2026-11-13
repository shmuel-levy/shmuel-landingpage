import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartsOrder } from "../PartsOrder";
import type { KeyedStep } from "../../logic/parts";

const steps = [
  { type: "envelope", _k: "envelope" },
  { type: "message", _k: "message" },
  { type: "photos", _k: "photos", items: [] },
  { type: "reasons", _k: "reasons", items: [] },
  { type: "final", _k: "final" },
] as unknown as KeyedStep[];

describe("<PartsOrder>", () => {
  it("locks the envelope first and the ending last", () => {
    render(<PartsOrder steps={steps} custom={false} onOrder={() => {}} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0].className).toContain("is-fixed");
    expect(rows.at(-1)!.className).toContain("is-fixed");
    expect(rows[0].querySelector("button")).toBeNull();
  });

  it("moves a part with the arrow buttons and reports the new order", () => {
    const onOrder = vi.fn();
    render(<PartsOrder steps={steps} custom={false} onOrder={onOrder} />);
    fireEvent.click(screen.getByRole("button", { name: /לדחות את הודעה אישית/ }));
    expect(onOrder).toHaveBeenCalledWith(["photos", "message", "reasons"]);
  });

  it("disables moving past the edges and offers a reset once customised", () => {
    render(<PartsOrder steps={steps} custom onOrder={() => {}} />);
    expect(screen.getByRole("button", { name: /להקדים את הודעה אישית/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /לדחות את קלפי סיבות/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /חזרה לסדר המומלץ/ }).hidden).toBe(false);
  });
});
