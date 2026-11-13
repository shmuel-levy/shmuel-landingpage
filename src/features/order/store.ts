/* =========================================================
   Order wizard state (Redux Toolkit).
   - one slice: chosen type, current step, all answers, photos, voice meta
   - listener middleware: every change is saved as a draft (debounced), so a
     customer can leave and come back. Photos/voice blobs never enter the store
     (object URLs only); the voice blob itself lives in IndexedDB.
   ========================================================= */
import { configureStore, createListenerMiddleware, createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { DRAFT_KEY, VOICE_AT, typeDef } from "./config";
import type { OrderData, OrderState, PhotoItem, VoiceMeta } from "./types";

export const initialOrderState: OrderState = { type: null, step: 0, visited: 0, data: {}, photos: [], voice: null, restored: false };
const MAX_PHOTOS = 15;

const order = createSlice({
  name: "order",
  initialState: initialOrderState,
  reducers: {
    /** start-up: a restored draft and/or ?type= / ?plan= from the URL */
    hydrate(state, a: PayloadAction<Partial<OrderState>>) {
      Object.assign(state, a.payload);
    },
    chooseType(state, a: PayloadAction<string>) {
      if (state.type !== a.payload) {
        // a different surprise: keep only what is shared by every type
        const d = state.data;
        state.data = { plan: d.plan, name: d.name, phone: d.phone, recipient: d.recipient, address: d.address, from: d.from };
      }
      state.type = a.payload;
      state.visited = Math.max(state.visited, 1);
    },
    setField(state, a: PayloadAction<{ key: string; value: unknown }>) {
      state.data[a.payload.key] = a.payload.value;
      // switching when the voice plays resets its manual position in the order
      if (a.payload.key === "voiceAt" && state.data.order) state.data.order = (state.data.order as string[]).filter((x) => x !== "voice");
    },
    /** fill defaults without overwriting answers */
    ensureDefaults(state, a: PayloadAction<OrderData>) {
      for (const [k, v] of Object.entries(a.payload)) if (state.data[k] == null) state.data[k] = v;
    },
    goTo(state, a: PayloadAction<number>) {
      state.step = a.payload;
      state.visited = Math.max(state.visited, a.payload);
    },
    addPhotos(state, a: PayloadAction<PhotoItem[]>) {
      state.photos.push(...a.payload.slice(0, MAX_PHOTOS - state.photos.length));
    },
    removePhoto(state, a: PayloadAction<number>) {
      state.photos.splice(a.payload, 1);
    },
    setVoice(state, a: PayloadAction<VoiceMeta>) {
      state.voice = a.payload;
      const els: string[] = state.data.elements || [...(typeDef(state.type)?.elements || [])];
      if (!els.includes("voice")) els.push("voice");
      state.data.elements = els;
      if (!state.data.voiceAt) state.data.voiceAt = VOICE_AT[0];
    },
    /** restoredOnly: the recording came back from IndexedDB, don't touch the answers */
    restoreVoice(state, a: PayloadAction<VoiceMeta>) {
      state.voice = a.payload;
    },
    clearVoice(state) {
      state.voice = null;
      if (state.data.elements) state.data.elements = (state.data.elements as string[]).filter((x) => x !== "voice");
    },
    setOrder(state, a: PayloadAction<string[] | undefined>) {
      if (a.payload) state.data.order = a.payload;
      else delete state.data.order;
    },
    restart() {
      return initialOrderState;
    },
  },
});

export const orderActions = order.actions;

/* ---------- draft persistence ---------- */
export function readDraft(): { type?: string; data?: OrderData; visited?: number } | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* */
  }
}

const listener = createListenerMiddleware();
const a = order.actions;
listener.startListening({
  matcher: isAnyOf(a.chooseType, a.setField, a.ensureDefaults, a.goTo, a.setVoice, a.clearVoice, a.setOrder, a.hydrate),
  effect: async (_action, api) => {
    api.cancelActiveListeners();
    await api.delay(300); // debounce: one write per burst of typing
    const s = (api.getState() as RootState).order;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ type: s.type, data: s.data, visited: s.visited }));
    } catch {
      /* private mode / full storage */
    }
  },
});

export function makeStore(preloaded?: OrderState) {
  return configureStore({
    reducer: { order: order.reducer },
    preloadedState: preloaded ? { order: preloaded } : undefined,
    middleware: (gdm) => gdm().prepend(listener.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useOrder = () => useAppSelector((s) => s.order);
