/* Types for the editable content files in src/data. */

export type IconName = string;

export interface Promo {
  active: boolean;
  percent: number;
  /** ISO date with offset, e.g. "2027-01-31T23:59:59+02:00" */
  endsAt: string;
  endsLabel: string;
  title: string;
  text: string;
  popupEvery?: "load" | "session" | "week";
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  /** how many interactive parts the plan includes */
  parts?: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  popularLabel?: string;
}

export interface Addon {
  id: string;
  icon: IconName;
  name: string;
  price: number;
}

export interface ExampleItem {
  cat: string;
  icon: IconName;
  title: string;
  text: string;
  url: string;
  order: string;
  shot: string;
  tone: string;
  features: string[];
}

export interface SiteConfig {
  brand: { name: string; latin: string; tagline: string };
  contact: { phoneDisplay: string; phoneIntl: string; email: string };
  whatsappMessage: string;
  siteUrl: string;
  analytics: { ga4: string; metaPixel: string };
  promo: Promo;
  banner: { show: boolean; text: string };
  nav: { label: string; href: string }[];
  hero: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
    proof: string[];
    demo: Record<string, string | string[]>;
  };
  occasions: string[];
  steps: { kicker: string; title: string; subtitle: string; items: { icon: IconName; title: string; text: string }[] };
  him: {
    kicker: string;
    title: string;
    text: string;
    points: { icon: IconName; title: string; text: string }[];
    cta: string;
    demo: string;
  };
  ideas: { title: string; button: string; want: string; items: { icon: IconName; title: string; text: string; type: string }[] };
  builder: { kicker: string; title: string; text: string; points: string[]; cta: string };
  examples: {
    kicker: string;
    title: string;
    subtitle: string;
    categories: { id: string; label: string; icon?: IconName }[];
    items: ExampleItem[];
  };
  toolbox: { kicker: string; title: string; subtitle: string; items: { icon: IconName; title: string }[] };
  about: {
    kicker: string;
    title: string;
    paragraphs: string[];
    signature: string;
    codeLine: string;
    chips: string[];
    stats: { num: string; unit: string; label: string }[];
    projectsTitle: string;
    projects: { name: string; desc: string; tags: string[] }[];
  };
  why: { kicker: string; title: string; items: { icon: IconName; title: string; text: string }[] };
  testimonials: {
    kicker: string;
    title: string;
    subtitle: string;
    items: { time: string; step: string; quote: string; image: string; w: number; h: number; alt: string }[];
  };
  pricing: {
    kicker: string;
    title: string;
    subtitle: string;
    currency: string;
    plans: Plan[];
    addonsTitle: string;
    addons: Addon[];
    payNote: string;
  };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
  finalCta: { title: string; text: string; cta: string };
  footer: { text: string };
}

/* ---------- order wizard ---------- */

export type FieldType = "text" | "textarea" | "date" | "number" | "tel" | "chips" | "multi" | "list" | "quiz" | "notes";

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: string[];
  /** rows for list / quiz / notes */
  count?: number;
  min?: number;
  max?: number;
  /** shown inside the collapsed "more ideas" group */
  more?: boolean;
  /** quick sentences for a textarea */
  starters?: string[];
  /** notes: the two inputs of each row */
  parts?: [string, string];
  ph?: [string, string];
  partLabels?: [string, string];
  autocomplete?: string;
  validate?: "phone";
  /** no "idea" button for this field */
  noHelp?: boolean;
}

export interface OrderType {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
  elements: string[];
  moreLabel?: string;
  fields: FieldDef[];
}

export type HelpSuggestion = string | Record<string, string>;

export interface OrderConfig {
  types: OrderType[];
  elements: { id: string; icon: IconName; label: string }[];
  parts: Record<string, { rec: string[]; more: string[] }>;
  help: Record<string, Record<string, HelpSuggestion[]>>;
  tones: string[];
  moods: { id: string; label: string; icon: IconName }[];
}

/* ---------- event landing pages ---------- */

export interface EventPage {
  slug: string;
  type: string;
  demo: string;
  shot: string;
  label: string;
  title: string;
  desc: string;
  kicker: string;
  h1: string;
  lead: string;
  cta: string;
  ideasTitle: string;
  ideas: { icon: IconName; title: string; text: string }[];
  faq: { q: string; a: string }[];
  [key: string]: unknown;
}
