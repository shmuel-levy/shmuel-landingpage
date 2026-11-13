/* =========================================================
   The sketch: turns the order form's answers into a real surprise (DemoConfig)
   played by the surprise engine. Pure function → unit-tested.
   ========================================================= */
import type { DemoConfig, FinalStep, QuizQuestion, Step } from "@/features/surprise/types";
import { intlPhone } from "@/lib/pricing";
import { ADDR, DEF_LINER, DEF_PALETTE, EXTRAS, VOICE_AT, typeDef } from "../config";
import { applyCustomOrder, chosenParts, stepLabel, type KeyedStep } from "./parts";
import type { OrderData, VoiceMeta } from "../types";

export interface DemoInput {
  type: string;
  data: OrderData;
  /** object URLs of the customer's photos (they never leave the browser) */
  photos: string[];
  voice: VoiceMeta | null;
}

const lines = (s: unknown) => String(s || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
const filled = (a: unknown) => ((a as unknown[]) || []).filter((x): x is string => !!x && !!String(x).trim()) as string[];

export function buildDemo({ type: t, data: d, photos: pics, voice }: DemoInput): DemoConfig {
  const T = typeDef(t)!;
  const G = (f: string, m: string, p: string) => (d.address === ADDR[0] ? f : d.address === ADDR[1] ? m : p);
  const name = String(d.recipient || "").trim() || "אהובה";
  const nick = String(d.nickname || "").trim() || name;
  const sign = String(d.from || "").trim();
  const el = chosenParts(t, d);
  const has = (x: string) => x === "envelope" || x === "final" || el.includes(x);
  const caps = filled(d.memories);
  const letter = lines(d.letter);
  let steps: KeyedStep[] = [];
  const used: Record<string, boolean> = {};
  const push = (s: Step) => {
    used[s.type] = true;
    steps.push(s);
  };

  const CARD: Record<string, [string, string]> = {
    partner: ["שאלה קטנה", "רק כן או כן"], proposal: ["ל" + name, "תפתח" + G("י", "", "ו") + " לאט"], birthday: ["מזל טוב!", d.age ? "סוף סוף " + d.age : "יום מיוחד"],
    sorry: ["דגל לבן", "מגיע בשלום"], baby: ["חדשות טובות", G("תשבי רגע", "תשב רגע", "תשבו רגע")], friend: ["דחוף!!!", "לפתוח עכשיו"],
    thanks: [d.group ? "מ" + d.group : "תודה", "באהבה"], family: ["ל" + name, "מכל הלב"], other: [d.occasion || "הפתעה", "בשבילך"],
  };
  const TITLE: Record<string, string> = {
    partner: "מישהו רוצה לשאול אותך משהו", proposal: "יש לי משהו להגיד לך", birthday: "יש לך דואר!", sorry: "אפשר רגע?",
    baby: "יש לנו חדשות...", friend: "דחוף!!! " + G("תפתחי", "תפתח", "תפתחו"), thanks: "יש לך דואר", family: "מישהו חושב עליך", other: "יש לך הודעה",
  };
  const card = CARD[t];
  push({ type: "envelope", to: "ל" + name, title: TITLE[t], mark: d.mark != null ? d.mark : name.charAt(0), card: { icon: T.icon, title: card[0], text: card[1] }, hint: G("הקישי על החותם", "הקש על החותם", "הקישו על החותם") });

  const album = (title: string, sub?: string): Step => {
    let n = Math.max(caps.length, pics.length);
    if (!n) n = 3;
    const items = [];
    for (let i = 0; i < Math.min(n, 8); i++) items.push({ src: pics[i] || "", caption: caps[i] || "רגע " + (i + 1) });
    return { type: "photos", icon: "camera", title, sub, items, doneText: "ואלה רק חלק קטן" };
  };
  const quiz = (title: string, fallback: QuizQuestion[]): Step => {
    let qs: QuizQuestion[] = ((d.quiz as { q?: string; a?: string; w1?: string; w2?: string }[]) || [])
      .filter((q) => q && q.q && q.a)
      .map((q) => {
        const opts = [q.a!, q.w1, q.w2].filter(Boolean) as string[];
        const shift = q.q!.length % opts.length;
        const rot = [...opts.slice(shift), ...opts.slice(0, shift)];
        return { q: q.q!, options: rot, correct: rot.indexOf(q.a!), right: "נכון!", wrong: "לא בדיוק... " + G("נסי", "נסה", "נסו") + " שוב" };
      });
    if (!qs.length) qs = fallback;
    return { type: "quiz", icon: "question", title, questions: qs, doneText: "טוב, ברור. ממשיכים...", cta: "ממשיכים" };
  };
  const finalLetter = (icon: string, title: string, fallback: string[]): FinalStep => ({ type: "final", variant: "card", icon, title, text: letter.length ? letter : fallback, sign });
  const defaultQuiz: QuizQuestion[] = [{ q: "מי הכי מכיר" + G("ה", "", "ים") + " אותך?", options: ["אני", "אני", "גם אני"], correct: -1, right: "ברור שאני" }];

  if (t === "partner") {
    push({ type: "message", icon: "hearts", title: nick + ", " + (d.together ? d.together + " ביחד" : "יש לי משהו בשבילך"),
      text: filled([d.howMet, d.insideJoke ? "ו... \"" + d.insideJoke + "\"" : ""]).concat(d.howMet || d.insideJoke ? [] : ["הכנתי לך משהו קטן. " + G("מוכנה?", "מוכן?", "מוכנים?")]) });
    if (has("photos")) push(album("הרגעים שלנו"));
    const whys = filled(d.loves).concat(filled(d.reasons));
    if (has("reasons")) push({ type: "reasons", title: G("למה דווקא את?", "למה דווקא אתה?", "למה דווקא אתם?"), sub: G("הקישי", "הקש", "הקישו") + " על כל קלף", items: whys.length ? whys.slice(0, 8) : ["הצחוק שלך", "החיבוקים", "שאת" + G("", "ה", "ם") + " תמיד שם", "הכל"] });
    const ows = ((d.openWhen as { when?: string; text?: string }[]) || []).filter((o) => o && o.when);
    if (has("openwhen")) push({ type: "openwhen", title: "מעטפות לימים שאני לא לידך", prefix: G("תפתחי כש...", "תפתח כש...", "תפתחו כש..."), items: ows.length ? ows.map((o) => ({ when: o.when!, text: o.text || "..." })) : [{ when: G("את עצובה", "אתה עצוב", "אתם עצובים"), text: "אני בדרך עם שוקולד." }, { when: G("את מתגעגעת", "אתה מתגעגע", "אתם מתגעגעים"), text: "גם אני. תתקשר" + G("י", "", "ו") + "." }] });
    if (has("coupons")) push({ type: "coupons", title: "פנקס שוברים", items: filled(d.coupons).length ? filled(d.coupons) : ["עיסוי של 20 דקות", "בחירת הסרט", "ארוחת בוקר במיטה"] });
    if (has("wheel")) push({ type: "wheel", key: "date", title: G("סובבי את הגלגל", "סובב את הגלגל", "סובבו את הגלגל"), sub: "מה שיוצא, זה הדייט שלנו", reply: "סגור. אני מארגן", options: filled(d.wheel).length > 1 ? filled(d.wheel).slice(0, 8) : ["פיקניק", "מסעדה", "סרט", "ים בשקיעה", "הפתעה"] });
    if (has("runaway")) push({ type: "runaway", icon: "smile-heart", title: d.question || "נצא לדייט?", yes: "כן!", no: "לא", hint: "רמז: יש רק תשובה אחת נכונה",
      noTexts: [G("בטוחה?", "בטוח?", "בטוחים?"), G("תחשבי שוב", "תחשוב שוב", "תחשבו שוב"), "כמעט...", "אין מצב", "נו באמת"],
      after: "ידעתי!!!", afterIcon: "hearts", afterText: "עכשיו רק נשאר לסגור פרטים...", cta: "לפרטים" });
  }
  if (t === "proposal") {
    if (has("photos")) push(album("הרגעים שלנו"));
    push({ type: "message", icon: "hearts", title: (d.together ? d.together + ". " : "") + "אלפי רגעים.", text: filled([d.howMet]).concat(["ובכל אחד מהם הבנתי עוד קצת כמה אני רוצה את כל השאר איתך."]) });
    if (has("hold")) push({ type: "hold", title: G("תחזיקי את הלב", "תחזיק את הלב", "תחזיקו את הלב"), sub: "עד שהוא מתמלא", hint: "לאט... עוד קצת...", doneText: "בדיוק ככה הלב שלי מרגיש איתך", cta: "ועכשיו..." });
  }
  if (t === "birthday") {
    push({ type: "message", icon: "cake", title: "מזל טוב, " + nick + "!", text: filled([d.age ? d.age + "! ואיך " + G("את", "אתה", "אתם") + " עדיין נראה" + G("ית", "", "ים") + " ככה?" : "", d.hobbies ? "הכנתי משהו קטן, עם הרבה " + d.hobbies + "." : "הכנתי לך משהו קטן."]) });
    if (has("quiz")) push(quiz("כמה " + G("את מכירה", "אתה מכיר", "אתם מכירים") + " אותי?", defaultQuiz));
    if (has("photos")) push(album("ארכיון הסודות", "תמונות שאסור שאף אחד יראה"));
    if (has("candles")) push({ type: "candles", title: G("תכבי את הנרות!", "תכבה את הנרות!", "תכבו את הנרות!"), sub: "הקישו על כל נר ובקשו משאלה", count: 5, doneText: "המשאלה בדרך!", cta: "יש עוד משהו" });
    if (d.gift) push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את המתנה", sub: "עם האצבע, על כל הכרטיס", reveal: { icon: "gift", text: d.gift, small: "מזל טוב!" }, cta: "ועוד משהו אחד" });
  }
  if (t === "sorry") {
    push({ type: "message", icon: "sad", title: "סליחה. באמת.", text: ["אין לי תירוץ טוב, אז במקום תירוץ הכנתי לך את זה."] });
    if (has("notes") && filled(d.promises).length) push({ type: "notes", icon: "note", title: "הבטחות לעתיד", items: filled(d.promises).map((x) => ({ text: x, from: "" })) });
    if (has("scratch")) push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את הפיצוי", sub: "עם האצבע, על כל הכרטיס", reveal: { icon: "gift", text: d.makeUpText || d.makeUp || "פיצוי ענק בדרך", small: "בתוקף מיידי" }, cta: "עסקה טובה" });
    if (has("runaway")) push({ type: "runaway", icon: "hand-heart", title: G("סולחת לי?", "סולח לי?", "סולחים לי?"), yes: G("סולחת", "סולח", "סולחים"), no: G("לא סולחת", "לא סולח", "לא סולחים"),
      noTexts: filled(d.noTexts).length ? filled(d.noTexts) : ["רגע...", "הכפתור לא מסכים", "נו בבקשה"] });
  }
  if (t === "baby") {
    const aud = String(d.audience || "");
    const reveal = d.revealText || (aud.includes("הורים") ? "אתם הולכים להיות סבא וסבתא!" : aud.includes("אחים") ? "אתם הולכים להיות דודים!" : aud.includes("זוג") ? "אנחנו הולכים להיות הורים!" : "אנחנו בהריון!");
    const small = d.gender === "בן" ? "וזה בן!" : d.gender === "בת" ? "וזו בת!" : "נפגשים בקרוב";
    if (has("quiz") || String(d.reveal || "").includes("טריוויה")) push(quiz("חידון משפחתי קטן", [{ q: "מה הכי חסר אצלנו בבית?", options: ["עוד כרית לספה", "מישהו קטן שיעשה הרבה רעש", "מכונת קפה חדשה"], correct: 1, right: "בדיוק!!", wrong: "כמעט... תחשבו קטן יותר" }]));
    if (String(d.reveal || "").includes("לב")) push({ type: "hold", title: "תחזיקו את הלב", sub: "עד שהוא מתמלא", doneText: reveal + " " + small, cta: "ומתי?" });
    else push({ type: "scratch", icon: "sparkle", title: "גרדו כאן", sub: "עם האצבע, לאט לאט...", cover1: "#B9DCCB", cover2: "#EAF7F1", reveal: { icon: "baby", text: reveal, small }, cta: "ומתי?" });
    if (has("countdown") || d.dueDate) push({ type: "countdown", icon: "hourglass", title: "עד שנכיר", sub: "כל שנייה נחשבת", date: d.dueDate ? d.dueDate + "T09:00:00" : null, daysFromNow: 180 });
  }
  if (t === "friend") {
    push({ type: "message", icon: "users", title: nick + "!", text: filled([d.howMet, d.insideJoke ? "\"" + d.insideJoke + "\"" : ""]).concat(d.howMet ? [] : ["הכנתי לך משהו. בלי לשאול שאלות."]) });
    if (has("quiz")) push(quiz("כמה " + G("את מכירה", "אתה מכיר", "אתם מכירים") + " אותי?", defaultQuiz));
    if (has("photos")) push(album("ארכיון הסודות", "תמונות שאסור שאף אחד יראה"));
  }
  if (t === "thanks") {
    push({ type: "message", icon: "hand-heart", title: "תודה, " + name, text: filled([d.special]).concat(d.special ? [] : ["על כל מה שנתת השנה."]) });
    if (has("photos")) push(album("השנה שלנו"));
    const notes = ((d.notes as { text?: string; from?: string }[]) || []).filter((n) => n && n.text);
    if (has("notes")) push({ type: "notes", icon: "note", title: "מה רצינו להגיד", items: notes.length ? notes.map((n) => ({ text: n.text!, from: n.from || "" })) : [{ text: "את הכי טובה", from: "מכולנו" }, { text: "תודה על הסבלנות", from: "" }] });
  }
  if (t === "family") {
    if (has("photos")) push(album("זוכר" + G("ת", "", "ים") + "?"));
    if (has("notes")) push({ type: "notes", icon: "heart", title: "מה אנחנו הכי אוהבים בך", items: (filled(d.loves).length ? filled(d.loves) : ["הכל"]).map((x) => ({ text: x, from: "" })) });
    if (has("hold")) push({ type: "hold", title: G("תחזיקי את הלב", "תחזיק את הלב", "תחזיקו את הלב"), sub: "עד שהוא מתמלא", doneText: "ככה אנחנו מרגישים כלפיך", cta: "ועוד משהו" });
  }
  if (t === "other") {
    push({ type: "message", icon: "wand", title: d.occasion || "הפתעה!", text: lines(d.idea).slice(0, 3) });
    if (caps.length || pics.length) push(album("רגעים"));
  }

  // parts that were chosen but not used yet: a generic version, just to see how it looks
  const EXTRA: Record<string, Step> = {
    runaway: { type: "runaway", icon: "smile-heart", title: "רק שאלה קטנה...", yes: "כן!", no: "לא", noTexts: ["בטוח?", "נסו שוב", "כמעט..."] },
    quiz: quiz("שאלה קטנה", defaultQuiz),
    scratch: { type: "scratch", icon: "gift", title: "גרדו לגלות", reveal: { icon: "gift", text: "ההפתעה שלכם כאן", small: "" } },
    checklist: { type: "checklist", icon: "checklist", title: "רשימה קטנה", sub: "סמנו כל שורה", cta: "סיימתי", items: [{ icon: "smile", label: "חיוך" }, { icon: "heart", label: "לב פתוח" }, { icon: "sparkle", label: "מוכנים להפתעה" }] },
    photos: album("רגעים"),
    countdown: { type: "countdown", icon: "hourglass", title: "הספירה התחילה", sub: "עד הרגע הגדול", daysFromNow: 14 },
    hold: { type: "hold", title: "החזיקו את הלב", sub: "עד שהוא מתמלא", cta: "ממשיכים" },
    candles: { type: "candles", title: "כבו את הנרות!", count: 5, cta: "ממשיכים" },
    notes: { type: "notes", icon: "note", title: "קיר פתקים", items: [{ text: "פתק ראשון", from: "" }, { text: "פתק שני", from: "" }] },
    reasons: { type: "reasons", title: "כמה סיבות קטנות", items: ["סיבה ראשונה", "סיבה שנייה", "סיבה שלישית", "ועוד אחת"] },
    openwhen: { type: "openwhen", title: "מעטפות לרגעים מיוחדים", prefix: "פתחו כש...", items: [{ when: "צריך חיוך", text: "הנה הוא." }, { when: "מתגעגעים", text: "גם אני." }] },
    wheel: { type: "wheel", key: "date", title: "סובבו את הגלגל", options: ["פרס 1", "פרס 2", "פרס 3", "הפתעה"] },
    coupons: { type: "coupons", title: "פנקס שוברים", items: ["שובר ראשון", "שובר שני"] },
  };
  if (t === "proposal") used.runaway = true; // comes at the end, right before the question
  if (t === "partner" && d.finale === "מתנה") used.scratch = true;
  el.forEach((x) => {
    if (EXTRA[x] && !used[x]) push(EXTRA[x]);
  });

  // the voice message: right after the envelope, or just before the end
  if (voice) {
    const vs: Step = { type: "voice", icon: "mic", title: "השארתי לך הודעה", sub: G("לחצי", "לחץ", "לחצו") + " על הכפתור. הכי טוב עם אוזניות", from: sign || "", src: voice.url, duration: voice.dur, caption: String(d.voiceCaption || "").trim(), cta: "ממשיכים" };
    if (d.voiceAt === VOICE_AT[1]) push(vs);
    else {
      used.voice = true;
      steps.splice(1, 0, vs);
    }
  }

  // the ending
  let fin: FinalStep;
  if (t === "partner") {
    const f = String(d.finale || "");
    if (f === "דייט")
      fin = { type: "final", variant: "invite", icon: "glass", title: "זה רשמי!", lines: (used.wheel ? [{ icon: "sparkle", label: "מה", value: "{date}" }] : []).concat([{ icon: "calendar", label: "מתי", value: d.finaleWhen || "בקרוב מאוד" }, { icon: "pin", label: "איפה", value: d.finaleWhere || "הפתעה" }, { icon: "sparkle", label: "דרס קוד", value: "מה שמרגיש הכי טוב" }]), note: sign || "מחכה לזה" };
    else if (f.includes("טיסה"))
      fin = { type: "final", variant: "ticket", title: "הכרטיס שלך", ticket: { from: { code: "TLV", city: "תל אביב" }, to: { code: "???", city: d.finaleWhere || "יעד: הפתעה" }, fields: [{ label: G("נוסעת", "נוסע", "נוסעים"), value: nick }, { label: "מתי", value: d.finaleWhen || "בקרוב" }, { label: "שער", value: "7" }, { label: "מושב", value: "ליד שלי" }], note: letter[0] || "את השאר " + G("תגלי", "תגלה", "תגלו") + " בשדה." } };
    else {
      if (f === "מתנה") push({ type: "scratch", icon: "gift", title: G("גרדי", "גרד", "גרדו") + " לגלות את המתנה", reveal: { icon: "gift", text: d.finaleWhere || "המתנה שלך", small: d.finaleWhen || "" }, cta: "ועוד משהו" });
      fin = finalLetter("hearts", nick + ",", ["תודה שאת" + G("", "ה", "ם") + " " + G("את", "אתה", "אתם") + ".", "שלך, היום ובכל יום."]);
    }
  } else if (t === "proposal") {
    if (String(d.proposalPlan || "").includes("מוביל")) fin = { type: "final", variant: "invite", icon: "pin", title: G("בואי אליי", "בוא אליי", "בואו אליי"), lines: [{ icon: "pin", label: "איפה ומתי", value: d.placeTime || "המיקום בדרך אלייך" }], note: sign };
    else {
      if (has("runaway")) push({ type: "runaway", icon: "ring", title: G("תתחתני איתי?", "תתחתן איתי?", "תתחתנו איתי?"), yes: "כן!!!", no: "לא", noTexts: ["רגע מה?", G("נסי", "נסה", "נסו") + " שוב", "אין אופציה כזו", "הכפתור מסרב"] });
      fin = finalLetter("ring", "אמרת כן!", ["האהבה של חיי.", "מהיום, לנצח."]);
    }
  } else if (t === "birthday") fin = finalLetter("party", "מזל טוב, " + nick + "!", ["שתהיה לך שנה של צחוקים, הרפתקאות ורק דברים טובים."]);
  else if (t === "sorry") fin = finalLetter("flower", G("תודה שאת כזו", "תודה שאתה כזה", "תודה שאתם כאלה"), ["מבטיח להשתפר. באמת."]);
  else if (t === "baby") fin = finalLetter("heart", "אנחנו כל כך מתרגשים", ["תודה שאתם המשפחה הכי טובה בעולם."]);
  else if (t === "friend") fin = finalLetter("star", "אוהב" + G("ת", "", "ים") + " אותך, " + nick, ["תודה שאת" + G("", "ה", "ם") + " שם בכל רגע, הטוב והמביך."]);
  else if (t === "thanks") fin = finalLetter("flower", "תודה, " + name, ["על הסבלנות, החיבוקים והלב הענק."]);
  else if (t === "family") fin = finalLetter("home", "אוהבים אותך", ["תודה על הכל."]);
  else fin = finalLetter("sparkle", d.occasion || "באהבה", ["כמה מילים מהלב יופיעו כאן."]);
  if (!fin.sign && sign) fin.sign = sign;
  push(fin);
  steps = applyCustomOrder(steps, d.order); // the customer's drag-and-drop order

  const phone = intlPhone(d.phone);
  return {
    palette: d.palette || DEF_PALETTE[t], liner: d.liner || DEF_LINER[t],
    mood: d.mood && d.mood !== "none" ? d.mood : "romantic", music: d.mood !== "none",
    deco: ({ partner: ["heart", "sparkle", "letter", "star"], proposal: ["heart", "ring", "sparkle", "star"], birthday: ["balloon", "party", "star", "cake"], sorry: ["heart", "flower", "flag", "sparkle"], baby: ["star", "cloud", "heart", "baby"], friend: ["star", "party", "heart", "sparkle"], thanks: ["flower", "sun", "sprout", "heart"], family: ["home", "heart", "flower", "star"], other: ["sparkle", "heart", "star", "gift"] } as Record<string, string[]>)[t],
    steps, mode: "sketch", orderType: t,
    // the finishing character: by surprise type; an anniversary / wedding gets the chuppah
    fx: /נישואין|חתונה/.test(String(d.occasion || "")) ? "chuppah" : undefined,
    reply: ((d.extras as string[]) || []).includes(EXTRAS[0]) && phone ? { phone, name: String(d.name || "").trim().split(/\s+/)[0] || sign } : null,
  };
}

/** The sketch shows only half: the envelope and the first parts. The rest and the ending stay locked. */
export function lockHalf(demo: DemoConfig, d: OrderData): DemoConfig {
  const st = demo.steps, fin = st[st.length - 1] as FinalStep, mid = st.slice(1, -1);
  const show = mid.length <= 1 ? mid.length : Math.ceil(mid.length / 2);
  const hidden = [...mid.slice(show), fin];
  return {
    ...demo,
    steps: [
      st[0],
      ...mid.slice(0, show),
      {
        type: "locked", icon: "lock", title: "וזה רק חצי",
        sub: "את ההמשך אני בונה ביד, עם המילים והתמונות שלכם. ככה הוא יחכה ל" + (String(d.recipient || "").trim() || "מי שמקבל") + ":",
        items: hidden.map((s) => {
          const l = stepLabel(s);
          return { icon: l[0], label: l[1] };
        }).concat(demo.reply ? [{ icon: "reply", label: "כפתור תגובה אליכם" }] : []),
        teaser: { title: fin.title || "", sign: fin.sign || d.from || "" },
      },
    ],
  };
}
