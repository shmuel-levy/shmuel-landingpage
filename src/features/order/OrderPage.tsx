/* =========================================================
   The order wizard: type → story → design → details → sketch → WhatsApp.
   State lives in Redux (store.ts); this component handles navigation,
   validation, the "idea" button and focus management.
   ========================================================= */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { A11yWidget } from "@/components/layout/A11yWidget";
import { SiteHeader, SkipLink, WaIcon } from "@/components/layout/Chrome";
import { activePromo } from "@/lib/pricing";
import { motionOff } from "@/lib/motion";
import { track } from "@/lib/track";
import type { FieldDef } from "@/types/content";
import { DEF_LINER, DEF_MOOD, DEF_PALETTE, EXTRAS, SKETCH_KEY, STEPS, typeDef, type StepId } from "./config";
import { defaultParts } from "./logic/parts";
import { fieldsOfStep, genderText, helpList, problem } from "./logic/validate";
import { clearDraft, orderActions as A, useAppDispatch, useOrder } from "./store";
import { voiceBlob, voiceDb } from "./voice";
import { DesignStep } from "./components/DesignStep";
import { LiveEnvelope, SketchStep } from "./components/SketchStep";
import { DetailsStep, StoryStep, TypeStep } from "./components/steps";
import { WizardContext, type WizardApi } from "./components/wizard-context";

interface Bad { id: string; label: string; target: string }

const HEAD: Record<StepId, { h: string; sub: ReactNode }> = {
  type: { h: "למי ההפתעה?", sub: "בחרו את הסוג, והשאלות בשלב הבא יתאימו בדיוק אליו." },
  story: { h: "ספרו לי עליהם", sub: <>ככל שתכתבו יותר, ההפתעה תהיה אישית יותר. שדות עם <span aria-hidden="true">*</span><span className="sr-only">כוכבית</span> הם חובה, כל השאר רשות.</> },
  design: { h: "צבעים, מעטפה ומוזיקה", sub: "כל בחירה מתעדכנת במעטפה שלכם בזמן אמת." },
  details: { h: "חבילה ופרטים", sub: "משלמים רק אחרי שראיתם את הגרסה הסופית ואהבתם." },
  sketch: { h: "הסקיצה שלכם מוכנה", sub: "טעימה מהכיוון: פתחו את המעטפה כמו מי שיקבל. את הגרסה המלאה אני בונה ביד, עם המילים והתמונות שלכם." },
};
const NEXT_LABEL: Record<string, ReactNode> = {
  type: <>ממשיכים<Icon name="arrow-left" /></>,
  story: <>לעיצוב<Icon name="arrow-left" /></>,
  design: <>כמעט סיימנו<Icon name="arrow-left" /></>,
  details: <><Icon name="eye" />לראות את הסקיצה</>,
};

export function OrderPage() {
  const dispatch = useAppDispatch();
  const st = useOrder();
  const { type, step, visited, data, voice, restored } = st;
  const stepId = STEPS[step].id;
  const promo = useMemo(() => activePromo(), []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ step: StepId; bad: Bad[] } | null>(null);
  const [openSignal, setOpenSignal] = useState(0);
  const [helped, setHelped] = useState<Record<string, number>>({});
  const [helpStatus, setHelpStatus] = useState("");
  const [showDraft, setShowDraft] = useState(restored);
  const [anim, setAnim] = useState(0);
  const wizard = useRef<HTMLFormElement>(null);
  const errBox = useRef<HTMLDivElement>(null);
  const firstGo = useRef(true);

  const say = useCallback((t: string) => {
    setHelpStatus("");
    setTimeout(() => setHelpStatus(t), 50);
  }, []);

  /* ---------- answers ---------- */
  const setField = useCallback(
    (key: string, value: unknown) => {
      dispatch(A.setField({ key, value }));
      // a field that showed an error is re-checked while typing
      setErrors((e) => {
        if (!e[key]) return e;
        const f = fieldsOfStep(stepId, type).find((x) => x.id === key);
        const msg = f ? problem(f, { ...data, [key]: value }) : "";
        return { ...e, [key]: msg };
      });
    },
    [dispatch, stepId, type, data],
  );

  /* ---------- the "idea" button ---------- */
  const applyHelp = useCallback(
    (f: FieldDef) => {
      const list = helpList(f.id, type);
      if (!list) return;
      const k = helped[f.id] || 0;
      const g = (s: string) => genderText(s, data.address);
      let firstId = "";
      let alreadyFull = false;
      if (f.type === "text" || f.type === "textarea") {
        let v = g(list[k % list.length] as string);
        const cur = String(data[f.id] || "");
        // a textarea the customer wrote in gets the idea appended, not replaced
        if (f.type === "textarea" && cur.trim() && !helped[f.id]) v = cur.replace(/\s+$/, "") + "\n" + v;
        dispatch(A.setField({ key: f.id, value: v }));
        firstId = "f-" + f.id;
      } else if (f.type === "list") {
        const cur: string[] = [...(data[f.id] || [])];
        const all = (list as string[]).map(g);
        const empty = Array.from({ length: f.count || 0 }, (_, i) => i).filter((i) => !String(cur[i] || "").trim());
        if (empty.length) {
          const pool = all.filter((x) => !cur.includes(x));
          empty.forEach((i, n) => pool[n] != null && (cur[i] = pool[n]));
        } else {
          const rot = [...all.slice(k % all.length), ...all.slice(0, k % all.length)];
          for (let i = 0; i < (f.count || 0); i++) if (rot[i] != null) cur[i] = rot[i];
        }
        dispatch(A.setField({ key: f.id, value: cur }));
        firstId = `f-${f.id}-${empty[0] ?? 0}`;
      } else if (f.type === "notes" || f.type === "quiz") {
        const parts = f.type === "quiz" ? ["q", "a", "w1", "w2"] : f.parts || ["text", "from"];
        const cur: Record<string, string>[] = [...(data[f.id] || [])];
        let filledN = 0;
        for (let i = 0; i < (f.count || 0); i++) {
          const row = cur[i] || {};
          if (String(row[parts[0]] || "").trim()) {
            filledN++;
            continue;
          }
          const sug = list[(k + i) % list.length] as Record<string, string>;
          cur[i] = Object.fromEntries(parts.map((p) => [p, g(sug[p] || "")]));
          if (!firstId) firstId = f.type === "quiz" ? `f-${f.id}-${i}-q` : `f-${f.id}-${i}-a`;
          if (f.type === "quiz") break; // one question per tap
        }
        alreadyFull = filledN === f.count;
        dispatch(A.setField({ key: f.id, value: cur }));
      }
      setHelped((h) => ({ ...h, [f.id]: k + 1 }));
      setErrors((e) => (e[f.id] ? { ...e, [f.id]: "" } : e));
      setTimeout(() => {
        const el = firstId && document.getElementById(firstId);
        if (el) {
          el.focus();
          el.scrollIntoView({ block: "nearest", behavior: motionOff() ? "auto" : "smooth" });
        }
      }, 0);
      say(alreadyFull ? "כל השורות כבר מלאות. אפשר לערוך אותן." : "הוספנו רעיון. אפשר לערוך אותו כמו שבא לכם.");
      track("help_idea", { field: f.id, type });
    },
    [dispatch, type, data, helped, say],
  );

  /* ---------- validation ---------- */
  const validateStep = (): boolean => {
    const bad: Bad[] = [];
    if (stepId === "type" && !type) bad.push({ id: "type", label: "בחרו סוג הפתעה", target: 'input[name="type"]' });
    const errs: Record<string, string> = {};
    for (const f of fieldsOfStep(stepId, type)) {
      const msg = problem(f, data);
      if (msg) {
        errs[f.id] = msg;
        bad.push({ id: f.id, label: `${f.label}: ${msg}`, target: `#f-${f.id}, input[name="f-${f.id}"]` });
      }
    }
    setErrors(errs);
    if (!bad.length) {
      setSummary(null);
      return true;
    }
    setSummary({ step: stepId, bad });
    setOpenSignal((n) => n + 1); // open the groups that contain errors
    setTimeout(() => errBox.current?.focus(), 0);
    return false;
  };

  /* ---------- navigation ---------- */
  const go = useCallback(
    (n: number, silent = false) => {
      if (n < 0 || n >= STEPS.length) return;
      if (!silent || n > 0) track("order_step", { step: STEPS[n].id, n: n + 1, type: type || "" });
      const id = STEPS[n].id;
      // defaults the original form filled when a step was first rendered
      if (id === "design" && type) dispatch(A.ensureDefaults({ palette: DEF_PALETTE[type], liner: DEF_LINER[type], mood: DEF_MOOD[type], elements: defaultParts(type, data) }));
      if (id === "details") dispatch(A.ensureDefaults({ plan: "premium", addons: [], extras: [EXTRAS[0]] }));
      setErrors({});
      setSummary(null);
      dispatch(A.goTo(n));
      if (!motionOff()) setAnim((a) => a + 1);
      if (!silent) {
        const top = (wizard.current?.getBoundingClientRect().top || 0) + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: motionOff() ? "auto" : "smooth" });
        setTimeout(() => document.querySelector<HTMLElement>(`#step-${id} h2`)?.focus({ preventScroll: true }), motionOff() ? 0 : 200);
      }
    },
    [dispatch, type, data],
  );

  // first render: open the right step (silently), restore a recording from the last visit
  useEffect(() => {
    if (!firstGo.current) return;
    firstGo.current = false;
    go(step, true);
    if (restored && type) {
      void voiceDb.get().then((v) => {
        if (!v?.blob) return;
        voiceBlob.current = v.blob;
        dispatch(A.restoreVoice({ url: URL.createObjectURL(v.blob), dur: v.dur || 0, type: v.type || v.blob.type }));
      });
    } else void voiceDb.del();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-step", stepId);
  }, [stepId]);

  const api = useMemo<WizardApi>(
    () => ({ type, data, setField, errors, applyHelp, helped: Object.fromEntries(Object.entries(helped).map(([k, v]) => [k, v > 0])), say }),
    [type, data, setField, errors, applyHelp, helped, say],
  );

  const next = () => validateStep() && go(step + 1);
  const back = () => go(step - 1);
  const errorBox = (id: StepId) => {
    const s = summary?.step === id ? summary : null;
    return (
      <div className="wz-errors" role="alert" tabIndex={-1} hidden={!s} ref={s ? errBox : undefined}>
        {s && (
          <>
            <h3 className="wz-errors__title"><Icon name="x" />רגע, חסר משהו ({s.bad.length})</h3>
            <ul>
              {s.bad.map((b) => (
                <li key={b.id}>
                  <a href="#" data-target={b.target} onClick={(e) => {
                    e.preventDefault();
                    const tg = document.querySelector<HTMLElement>(b.target);
                    if (!tg) return;
                    const d = tg.closest("details");
                    if (d) d.open = true;
                    tg.focus();
                    tg.scrollIntoView({ block: "center", behavior: motionOff() ? "auto" : "smooth" });
                  }}>{b.label}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };
  const nav = (id: StepId, withBack = true) => (
    <div className="wz-nav">
      {withBack && <button type="button" className="btn btn--ghost" data-back="" onClick={back}><Icon name="arrow-right" />חזרה</button>}
      <button type="button" className="btn btn--primary btn--lg" data-next="" onClick={next}>{NEXT_LABEL[id]}</button>
    </div>
  );
  const section = (id: StepId, body: ReactNode, footer: ReactNode, extra?: ReactNode) => (
    <section className={"wz-step" + (id === "sketch" ? " wz-step--sketch" : "") + (stepId === id && anim ? " is-in" : "")} id={`step-${id}`} aria-labelledby={`h-${id}`} hidden={stepId !== id} key={id === stepId ? `${id}-${anim}` : id}>
      {extra}
      <h2 id={`h-${id}`} tabIndex={-1}>{HEAD[id].h}</h2>
      <p className="wz-sub">{HEAD[id].sub}</p>
      {errorBox(id)}
      {body}
      {footer}
    </section>
  );

  return (
    <WizardContext.Provider value={api}>
      <SkipLink />
      <SiteHeader
        scrolled
        brandLabel="Matanot, חזרה לעמוד הבית"
        actions={
          <>
            <WaIcon label="שאלה בווטסאפ (נפתח בחלון חדש)" message="היי שמואל, יש לי שאלה לפני ההזמנה" />
            <a className="btn btn--ghost btn--sm" href="index.html"><Icon name="arrow-right" />לאתר</a>
          </>
        }
      >
        <div className="order-progress" aria-hidden="true"><b id="progressFill" style={{ width: (step / (STEPS.length - 1)) * 100 + "%" }} /></div>
      </SiteHeader>

      <main id="main" className="order">
        <section className="order__intro container" aria-labelledby="orderTitle">
          <p className="kicker-pill"><Icon name="wand" />בונים הפתעה</p>
          <h1 id="orderTitle">ספרו לי על מי שמקבל, <span className="ink-mark">ותראו סקיצה מיד</span></h1>
          <p className="order__lead">לכל סוג הפתעה יש שאלות משלו. כמה דקות של פרטים, ובסוף מחכה לכם סקיצה חיה של האתר. את הגרסה הסופית, עם התמונות שלכם, אני מעצב ידנית ושולח תוך 24 שעות.</p>
          {promo && (
            <p className="order-promo" id="orderPromo">
              <Icon name="percent" />
              <span><b>{promo.title}:</b> {promo.text} עד {promo.endsLabel}. המחיר המוזל כבר מחושב בטופס.</span>
            </p>
          )}
          <p className="draft-note" id="draftNote" hidden={!showDraft}>
            <Icon name="pencil" />שמרנו את מה שמילאתם בביקור הקודם.{" "}
            <button type="button" className="link-btn" id="restart" onClick={() => {
              clearDraft();
              try {
                localStorage.removeItem(SKETCH_KEY);
              } catch {
                /* */
              }
              if (voice) URL.revokeObjectURL(voice.url);
              voiceBlob.current = null;
              void voiceDb.del();
              dispatch(A.restart());
              setShowDraft(false);
              setErrors({});
              setSummary(null);
              setHelped({});
              setTimeout(() => go(0), 0);
            }}>להתחיל מחדש</button>
          </p>
        </section>

        <div className="container">
          <nav aria-label="שלבי ההזמנה">
            <ol className="stepper" id="stepper">
              {STEPS.map((s, i) => (
                <li key={s.id} className={(i < step ? "is-done" : "") + (i === step ? " is-current" : "")}>
                  <button type="button" data-go={i} disabled={i > visited || (i > 0 && !type)} aria-current={i === step ? "step" : undefined} onClick={() => {
                    if (i > step && !validateStep()) return;
                    go(i);
                  }}>
                    <span className="stepper__n" aria-hidden="true">{i + 1}</span>
                    <span>{s.label}</span>
                    <span className="sr-only"> (שלב {i + 1} מתוך {STEPS.length})</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="container order__grid">
          <form className="wizard" id="wizard" noValidate data-step={stepId} ref={wizard} onSubmit={(e) => e.preventDefault()}>
            <p className="sr-only" id="helpStatus" aria-live="polite">{helpStatus}</p>
            {section(
              "type",
              <TypeStep value={type} onChoose={(t) => {
                dispatch(A.chooseType(t));
                setSummary(null);
                setHelped({});
              }} />,
              <div className="wz-nav"><button type="button" className="btn btn--primary btn--lg" data-next="" onClick={next}>{NEXT_LABEL.type}</button></div>,
            )}
            {section(
              "story",
              <div className="fields">{stepId === "story" && type && <StoryStep openSignal={openSignal} />}</div>,
              nav("story"),
              <p className="wz-type" id="storyType">{type && <><Icon name={typeDef(type)?.icon || "sparkle"} />{typeDef(type)?.label}</>}</p>,
            )}
            {section("design", stepId === "design" && type ? <DesignStep /> : <div className="fields" />, nav("design"))}
            {section("details", <div className="fields">{stepId === "details" && type && <DetailsStep promo={promo} openSignal={openSignal} />}</div>, nav("details"))}
            {section("sketch", stepId === "sketch" && type ? <SketchStep promo={promo} onBack={back} /> : null, null)}
          </form>
          <LiveEnvelope />
        </div>
      </main>

      <footer className="footer footer--slim">
        <div className="container">
          <p className="footer__copy">© 2026 Matanot · שמואל לוי · <a href="privacy.html">מדיניות פרטיות</a> · <a href="terms.html">תנאי שירות</a> · <a href="negishut.html">הצהרת נגישות</a></p>
        </div>
      </footer>

      <aside aria-label="נגישות">
        <A11yWidget />
      </aside>
    </WizardContext.Provider>
  );
}

