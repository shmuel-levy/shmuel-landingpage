import { createContext, useContext } from "react";
import type { FieldDef } from "@/types/content";
import type { OrderData } from "../types";

export interface WizardApi {
  type: string | null;
  data: OrderData;
  setField: (key: string, value: unknown) => void;
  /** current error message per field id (only after a "next" attempt) */
  errors: Record<string, string>;
  /** "idea" button: fills the field with a suggestion */
  applyHelp: (f: FieldDef) => void;
  /** fields that already received at least one idea ("רעיון אחר") */
  helped: Record<string, boolean>;
  /** screen-reader status line of the form */
  say: (text: string) => void;
}

export const WizardContext = createContext<WizardApi | null>(null);
export function useWizard(): WizardApi {
  const w = useContext(WizardContext);
  if (!w) throw new Error("useWizard outside <WizardContext>");
  return w;
}
