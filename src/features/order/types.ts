/* Order wizard state. `data` holds every answer by field id (free-form by design:
   each surprise type defines its own questions in src/data/order.ts). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OrderData = Record<string, any>;

export interface PhotoItem { url: string; name: string }
export interface VoiceMeta { url: string; dur: number; type: string }

export interface OrderState {
  type: string | null;
  step: number;
  /** furthest step reached (the stepper lets you jump back up to it) */
  visited: number;
  data: OrderData;
  photos: PhotoItem[];
  voice: VoiceMeta | null;
  /** a draft from a previous visit was restored */
  restored: boolean;
}
