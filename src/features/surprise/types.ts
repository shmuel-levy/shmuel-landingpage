/* =========================================================
   The surprise ("demo") data model.
   Each surprise page defines window.DEMO = { palette, theme, deco, mood, steps: [...] }.
   Modes: ""        = example site on Matanot
          "sketch"  = live sketch from the order form (watermarked, half locked)
          "gift"    = a real surprise for a customer (no demo labels, reply button, credit)
   ========================================================= */

export type Mode = "" | "sketch" | "gift";

export interface PhotoRef { src: string; alt?: string; caption?: string; w?: number; h?: number }

interface StepBase {
  /** heading */
  title?: string;
  sub?: string;
  icon?: string;
  /** label of the continue button */
  cta?: string;
  /** finishing character for this step ("none"/false disables) */
  fx?: string | false;
  cupid?: boolean;
}

export interface EnvelopeStep extends StepBase {
  type: "envelope";
  to?: string;
  mark?: string;
  liner?: string;
  card?: { icon?: string; title?: string; text?: string };
  hint?: string;
}
export interface MessageStep extends StepBase { type: "message"; text?: string | string[]; photo?: PhotoRef }
export interface ChoiceStep extends StepBase {
  type: "choice";
  key?: string;
  options: { label: string; icon?: string; value?: string; reply?: string }[];
}
export interface RunawayStep extends StepBase {
  type: "runaway";
  yes: string;
  no: string;
  hint?: string;
  noTexts?: string[];
  after?: string;
  afterIcon?: string;
  afterText?: string;
}
export interface ChecklistStep extends StepBase { type: "checklist"; items: { label: string; icon?: string }[]; doneText?: string }
export interface QuizQuestion { q: string; options: string[]; correct?: number; right?: string; wrong?: string }
export interface QuizStep extends StepBase { type: "quiz"; questions: QuizQuestion[]; doneText?: string }
export interface ScratchStep extends StepBase {
  type: "scratch";
  reveal: { icon?: string; text: string; small?: string };
  cover1?: string;
  cover2?: string;
  coverText?: string;
}
export interface PhotosStep extends StepBase { type: "photos"; items: { src?: string; caption: string }[]; doneText?: string }
export interface HoldStep extends StepBase { type: "hold"; hint?: string; doneText?: string; duration?: number }
export interface CandlesStep extends StepBase { type: "candles"; count?: number; doneText?: string }
export interface NotesStep extends StepBase { type: "notes"; items: { text: string; from?: string }[] }
export interface CountdownStep extends StepBase { type: "countdown"; date?: string | null; daysFromNow?: number; note?: string }
export interface ReasonsStep extends StepBase { type: "reasons"; items: string[]; doneText?: string }
export interface OpenWhenStep extends StepBase { type: "openwhen"; prefix?: string; items: { when: string; text: string }[] }
export interface WheelStep extends StepBase { type: "wheel"; key?: string; options: string[]; spin?: string; reply?: string }
export interface CouponsStep extends StepBase { type: "coupons"; items: (string | { title: string; icon?: string; note?: string })[] }
export interface VoiceStep extends StepBase { type: "voice"; src?: string; duration?: number; from?: string; caption?: string }
export interface LockedStep extends StepBase {
  type: "locked";
  items?: { icon?: string; label: string }[];
  teaser?: { title?: string; sign?: string };
}
export interface FinalStep extends StepBase {
  type: "final";
  variant?: "card" | "ticket" | "invite";
  text?: string | string[];
  sign?: string;
  photo?: PhotoRef;
  note?: string;
  lines?: { icon?: string; label: string; value: string }[];
  ticket?: {
    airline?: string;
    from: { code: string; city: string };
    to: { code: string; city: string };
    fields: { label: string; value: string }[];
    note?: string;
  };
}

export type Step =
  | EnvelopeStep | MessageStep | ChoiceStep | RunawayStep | ChecklistStep | QuizStep | ScratchStep | PhotosStep
  | HoldStep | CandlesStep | NotesStep | CountdownStep | ReasonsStep | OpenWhenStep | WheelStep | CouponsStep
  | VoiceStep | LockedStep | FinalStep;

export type StepType = Step["type"];

export interface DemoConfig {
  palette?: string;
  liner?: string;
  mood?: "romantic" | "happy" | "emotional" | string;
  music?: boolean;
  melody?: number[];
  theme?: Record<string, string>;
  deco?: string[];
  confetti?: string[];
  /** values for {placeholders} before the visitor answers */
  defaults?: Record<string, string>;
  steps: Step[];
  mode?: Mode;
  /** the order-form type this surprise is an example of */
  orderType?: string;
  /** finishing character for the whole surprise */
  fx?: string;
  /** gift mode: WhatsApp reply button to the sender */
  reply?: { phone: string; name?: string; quick?: string[] } | null;
  /** gift mode: hide the small "made with Matanot" credit */
  credit?: boolean;
  siteUrl?: string;
}

declare global {
  interface Window {
    DEMO?: DemoConfig;
    /** the order form calls this to hide the sketch during a screenshot */
    mtVeil?: (ms?: number) => void;
  }
}
