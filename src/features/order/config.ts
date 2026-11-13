/* Static definitions of the order wizard. The questions per surprise type live in src/data/order.ts. */
import type { FieldDef } from "@/types/content";
import { ORDER } from "@/data/order";

export const STEPS = [
  { id: "type", label: "סוג" },
  { id: "story", label: "הסיפור" },
  { id: "design", label: "עיצוב" },
  { id: "details", label: "פרטים" },
  { id: "sketch", label: "סקיצה" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

/** how texts address the recipient: feminine / masculine / plural */
export const ADDR = ["פנייה לנקבה", "פנייה לזכר", "פנייה לרבים"] as const;

export const DEF_PALETTE: Record<string, string> = { partner: "blush", proposal: "lilac", birthday: "gold", sorry: "peach", baby: "mint", friend: "gold", thanks: "gold", family: "ink", other: "blush" };
export const DEF_LINER: Record<string, string> = { partner: "hearts", proposal: "dots", birthday: "confetti", sorry: "confetti", baby: "dots", friend: "confetti", thanks: "dots", family: "stripes", other: "dots" };
export const DEF_MOOD: Record<string, string> = { partner: "romantic", proposal: "emotional", birthday: "happy", sorry: "romantic", baby: "happy", friend: "happy", thanks: "happy", family: "emotional", other: "romantic" };

export const DRAFT_KEY = "matanot-order-draft";
export const SKETCH_KEY = "matanot-sketch";

/** collapsible groups of the story step (questions not listed in GROUP_OF go to "story") */
export const STORY_GROUPS = [
  { id: "story", icon: "hearts", title: "הסיפור שלכם", desc: "כמה פרטים קטנים שהופכים את זה לאישי." },
  { id: "moments", icon: "images", title: "רגעים לאלבום", desc: "כיתוב קצר לכל תמונה. את התמונות מוסיפים בשלב הבא." },
  { id: "play", icon: "sparkle", title: "המשחקים בדרך", desc: "השאלות, החידון וההפתעות הקטנות." },
  { id: "finale", icon: "gift", title: "הסוף", desc: "מה מחכה בסוף המסע." },
  { id: "letter", icon: "letter", title: "המכתב", desc: "כמה מילים מהלב. אפשר בנקודות, אני מנסח." },
];
const GROUP_OF: Record<string, string> = {
  memories: "moments",
  question: "play", quiz: "play", noTexts: "play", reveal: "play", revealText: "play", promises: "play", makeUp: "play", makeUpText: "play", notes: "play", gift: "play",
  finale: "finale", finaleWhen: "finale", finaleWhere: "finale", proposalPlan: "finale", placeTime: "finale", whoKnows: "finale", dueDate: "finale",
  letter: "letter", letterHelp: "letter",
};
export const groupOf = (id: string) => GROUP_OF[id] || "story";

export const EXTRAS = ["כפתור תגובה בסוף: יוכלו לענות לי בווטסאפ בלחיצה", "תזכורת ממני שבועיים לפני התאריך, בשנה הבאה"];
export const VOICE_AT = ["מיד כשהמעטפה נפתחת", "רגע לפני הסוף"];
export const VOICE_MAX = 90; // seconds
/** a small idea of what to say in the recording, per surprise type */
export const VOICE_IDEA: Record<string, string> = {
  partner: "למשל: מה הרגשת כשראית אותה בפעם הראשונה. או סתם \"היי, תקשיבי עד הסוף\".",
  proposal: "למשל: כמה מילים לפני השאלה הגדולה. בקול שלך זה שווה פי אלף.",
  birthday: "למשל: \"מזל טוב!\", או שיר יום הולדת מזויף במיוחד.",
  sorry: "למשל: \"סליחה\" אחד אמיתי, בלי תירוצים.",
  baby: "למשל: \"יש לנו משהו לספר לכם...\"",
  friend: "למשל: הבדיחה הפנימית שלכם, בקול.",
  thanks: "למשל: הילדים אומרים \"תודה\" ביחד. נשמע מושלם גם מטלפון.",
  family: "למשל: \"אמא, רק רציתי להגיד...\"",
  other: "כמה מילים בקול שלכם. זה הכל.",
};

/* ---------- fields shared by every type ---------- */
export const COMMON_TOP: FieldDef[] = [
  { id: "recipient", type: "text", label: "איך קוראים למי שמקבל/ת את ההפתעה?", required: true, placeholder: "למשל: נועה", autocomplete: "off" },
  { id: "address", type: "chips", label: "איך לפנות אליו/ה באתר?", required: true, options: [...ADDR], hint: "כדי שהטקסטים ייכתבו נכון: \"לחצי\", \"לחץ\" או \"לחצו\"." },
  { id: "from", type: "text", label: "איך לחתום בסוף?", required: true, placeholder: "למשל: שלך, דני" },
];
export const COMMON_BOTTOM: FieldDef[] = [{ id: "tone", type: "multi", label: "באיזה טון?", options: ORDER.tones }];
export const DETAILS: FieldDef[] = [
  { id: "deadline", noHelp: true, type: "date", label: "עד מתי ההפתעה צריכה להיות מוכנה?", required: true, hint: "ככה אני יודע לתעדף. צריכים היום? בחרו אקספרס למטה." },
  { id: "name", type: "text", label: "השם שלכם", required: true, autocomplete: "name" },
  { id: "phone", type: "tel", label: "טלפון לחזרה", required: true, autocomplete: "tel", placeholder: "050-0000000", validate: "phone" },
  { id: "extras", type: "multi", label: "עוד שני דברים קטנים", options: EXTRAS },
  { id: "notes", noHelp: true, type: "textarea", label: "משהו נוסף שחשוב שאדע?", placeholder: "שיר מסוים, צבע שהיא אוהבת, תאריך מיוחד..." },
  { id: "source", type: "chips", label: "איך הגעתם אליי? (רשות)", options: ["אינסטגרם", "טיקטוק", "פייסבוק", "גוגל", "חבר/ה המליצו", "קיבלתי הפתעה כזו", "אחר"] },
];
export const VOICE_FIELDS: FieldDef[] = [
  { id: "voiceAt", type: "chips", label: "מתי ההקלטה מתנגנת?", options: VOICE_AT },
  { id: "voiceCaption", type: "text", label: "כמה מילים על מה שאמרתם (רשות)", hint: "יופיע ככתובית מתחת להקלטה, בשביל מי שלא יכול לשמוע ברגע זה.", placeholder: "למשל: רק רציתי שתשמעי את זה בקול שלי" },
];
export const SONG_FIELD: FieldDef = { id: "song", type: "text", label: "שיר מסוים? (בחבילת פרימיום)", placeholder: "שם השיר והזמר", noHelp: true };

export const typeDef = (id: string | null | undefined) => ORDER.types.find((t) => t.id === id);
