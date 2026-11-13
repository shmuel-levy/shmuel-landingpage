import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore, orderActions as A } from "../store";
import { DRAFT_KEY, VOICE_AT } from "../config";

describe("order store", () => {
  beforeEach(() => localStorage.clear());

  it("choosing another type keeps only the shared answers", () => {
    const s = makeStore();
    s.dispatch(A.chooseType("partner"));
    s.dispatch(A.setField({ key: "recipient", value: "נועה" }));
    s.dispatch(A.setField({ key: "howMet", value: "בחתונה" }));
    s.dispatch(A.chooseType("birthday"));
    const { data, type, visited } = s.getState().order;
    expect(type).toBe("birthday");
    expect(data.recipient).toBe("נועה");
    expect(data.howMet).toBeUndefined();
    expect(visited).toBe(1);
  });

  it("adding a voice message adds the part and a default position", () => {
    const s = makeStore();
    s.dispatch(A.chooseType("sorry"));
    s.dispatch(A.setVoice({ url: "blob:v", dur: 4, type: "audio/webm" }));
    expect(s.getState().order.data.elements).toContain("voice");
    expect(s.getState().order.data.voiceAt).toBe(VOICE_AT[0]);
    s.dispatch(A.clearVoice());
    expect(s.getState().order.data.elements).not.toContain("voice");
  });

  it("changing when the voice plays resets its dragged position", () => {
    const s = makeStore();
    s.dispatch(A.setOrder(["voice", "photos"]));
    s.dispatch(A.setField({ key: "voiceAt", value: VOICE_AT[1] }));
    expect(s.getState().order.data.order).toEqual(["photos"]);
  });

  it("keeps at most 15 photos", () => {
    const s = makeStore();
    s.dispatch(A.addPhotos(Array.from({ length: 20 }, (_, i) => ({ url: "blob:" + i, name: i + ".jpg" }))));
    expect(s.getState().order.photos).toHaveLength(15);
  });

  it("saves a debounced draft to localStorage", async () => {
    vi.useFakeTimers();
    const s = makeStore();
    s.dispatch(A.chooseType("partner"));
    s.dispatch(A.setField({ key: "recipient", value: "נ" }));
    s.dispatch(A.setField({ key: "recipient", value: "נועה" }));
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    await vi.advanceTimersByTimeAsync(350);
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual({ type: "partner", data: { recipient: "נועה" }, visited: 1 });
    vi.useRealTimers();
  });
});
