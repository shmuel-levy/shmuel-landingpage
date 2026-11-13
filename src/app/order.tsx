/* Entry point: the order wizard (order.html). Questions per type: src/data/order.ts. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { SITE } from "@/data/site";
import { initTracking } from "@/lib/track";
import { typeDef } from "@/features/order/config";
import { initialOrderState, makeStore, readDraft } from "@/features/order/store";
import { OrderPage } from "@/features/order/OrderPage";
import type { OrderState } from "@/features/order/types";
import "@/styles/order.scss";

/** Start-up state: a saved draft, overridden by ?type= / ?plan= from the link. */
function startState(): OrderState {
  const s: OrderState = { ...initialOrderState, data: {} };
  const draft = readDraft();
  if (draft?.type && typeDef(draft.type)) Object.assign(s, { type: draft.type, data: draft.data || {}, visited: Math.min(draft.visited || 1, 3), restored: true });
  const q = new URLSearchParams(location.search);
  const pt = q.get("type");
  if (pt && typeDef(pt) && pt !== s.type) Object.assign(s, { type: pt, data: {}, visited: 1, restored: false });
  const pp = q.get("plan");
  if (pp && SITE.pricing.plans.some((p) => p.id === pp)) s.data = { ...s.data, plan: pp };
  s.step = s.type ? 1 : 0;
  return s;
}

initTracking();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={makeStore(startState())}>
      <OrderPage />
    </Provider>
  </StrictMode>,
);
