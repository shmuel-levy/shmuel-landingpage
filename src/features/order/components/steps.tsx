/* The content of wizard steps 1, 2 and 4: type, story, details. */
import { useMemo, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { ORDER } from "@/data/order";
import { SITE } from "@/data/site";
import { planPrice } from "@/lib/pricing";
import type { Promo } from "@/types/content";
import { COMMON_BOTTOM, COMMON_TOP, DETAILS, STORY_GROUPS, groupOf, typeDef } from "../config";
import { chosenParts, groupStatus, planParts } from "../logic/parts";
import { totals } from "../logic/message";
import { Accordion } from "./Accordion";
import { Field } from "./Field";
import { useWizard } from "./wizard-context";

/* ---------- step 1: who is it for ---------- */
export function TypeStep({ value, onChoose }: { value: string | null; onChoose: (t: string) => void }) {
  return (
    <fieldset className="types-field">
      <legend className="sr-only">סוג ההפתעה</legend>
      <div className="types">
        {ORDER.types.map((t, i) => (
          <label className="type-card" style={{ "--i": i } as CSSProperties} key={t.id}>
            <input type="radio" name="type" value={t.id} checked={value === t.id} onChange={() => onChoose(t.id)} />
            <span className="type-card__ico" aria-hidden="true"><Icon name={t.icon} /></span>
            <span className="type-card__text"><b>{t.label}</b><small>{t.desc}</small></span>
            <span className="type-card__tick" aria-hidden="true"><Icon name="check" /></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- step 2: the story, in collapsible groups ---------- */
export function StoryStep({ openSignal }: { openSignal: number }) {
  const { type, data, errors } = useWizard();
  const T = typeDef(type)!;
  const groups = useMemo(() => {
    const main = T.fields.filter((f) => !f.more), more = T.fields.filter((f) => f.more);
    const gs = [{ id: "who", icon: "users", title: "למי ההפתעה", desc: "שם, פנייה וחתימה. 30 שניות.", fields: COMMON_TOP }];
    for (const g of STORY_GROUPS) {
      const fs = main.filter((f) => groupOf(f.id) === g.id);
      if (fs.length) gs.push({ ...g, fields: fs });
    }
    if (more.length) gs.push({ id: "more", icon: "wand", title: "עוד רעיונות", desc: T.moreLabel || "רשות. למי שרוצה להוסיף עוד.", fields: more });
    gs.push({ id: "tone", icon: "music", title: "הטון", desc: "רומנטי, מצחיק, מרגש? עוזר לי לכתוב נכון.", fields: COMMON_BOTTOM });
    return gs;
  }, [T]);
  return (
    <>
      {groups.map((g, i) => {
        const s = groupStatus(g.fields, data);
        const hasErr = g.fields.some((f) => errors[f.id]);
        return (
          <Accordion key={g.id} id={g.id} icon={g.icon} title={g.title} desc={g.desc} defaultOpen={i === 0} req={g.fields.some((f) => f.required)} status={s.status} done={s.done} openSignal={hasErr ? openSignal : 0}>
            <div className="fields">
              {g.fields.map((f) => <Field key={f.id} f={f} />)}
            </div>
          </Accordion>
        );
      })}
    </>
  );
}

/* ---------- step 4: plan and contact details ---------- */
export function DetailsStep({ promo, openSignal }: { promo: Promo | null; openSignal: number }) {
  const { type, data, setField, errors } = useWizard();
  const P = SITE.pricing;
  const byId = (id: string) => DETAILS.find((f) => f.id === id)!;
  const you = ["deadline", "name", "phone"].map(byId), extra = ["extras", "notes", "source"].map(byId);
  const t = totals(data, promo);
  const all = chosenParts(type!, data, true), lim = planParts(data.plan);
  const label = (id: string) => (ORDER.elements.find((x) => x.id === id)?.label || id).replace(/"/g, "");
  const addons: string[] = data.addons || [];
  const youDone = !!(data.name && data.phone && data.deadline);

  return (
    <>
      <Accordion id="plan" icon="star" title="חבילה" desc="כמה חלקים, כמה תמונות וכמה סבבי תיקונים." defaultOpen status={t.plan.name}>
        <fieldset className="field field--group">
          <legend className="sr-only">חבילה</legend>
          <div className="plan-pick">
            {P.plans.map((p) => (
              <label key={p.id} className={"plan-opt" + (p.popular ? " plan-opt--pop" : "")}>
                <input type="radio" name="plan" value={p.id} data-key="plan" checked={data.plan === p.id} onChange={() => setField("plan", p.id)} />
                <span><b>{p.name}</b><small>{p.description}</small></span>
                <span className="plan-opt__price">
                  {promo && <del><span className="sr-only">במקום </span>{p.price} ₪</del>}
                  <strong>{planPrice(p, promo)} ₪</strong>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="plan-note" id="planNote" hidden={all.length <= lim}>
          <Icon name="sparkle" />
          <span>
            בחבילה הזו נכנסים {lim} חלקים: {all.slice(0, lim).map(label).join(", ")}. <b>{all.slice(lim).map(label).join(", ")}</b> נכנס{all.length - lim > 1 ? "ים" : ""} רק בפרימיום.
          </span>
        </p>
      </Accordion>
      <Accordion id="you" icon="call" title="הפרטים שלכם" desc="עד מתי צריך, ואיך לחזור אליכם." defaultOpen req status={youDone ? "מוכן" : ""} done={youDone} openSignal={you.some((f) => errors[f.id]) ? openSignal : 0}>
        <div className="fields">{you.map((f) => <Field key={f.id} f={f} />)}</div>
      </Accordion>
      <Accordion id="addons" icon="plus" title="תוספות" desc="דומיין אישי, אנימציה מיוחדת או אקספרס." status={addons.length ? `${addons.length} נבחרו` : ""} done={!!addons.length}>
        <fieldset className="field field--group">
          <legend className="sr-only">תוספות</legend>
          <div className="addon-pick">
            {P.addons.map((a) => (
              <label key={a.id} className="addon-opt">
                <input type="checkbox" name="addons" value={a.id} data-key="addons" checked={addons.includes(a.id)} onChange={(e) => setField("addons", e.target.checked ? [...addons, a.id] : addons.filter((x) => x !== a.id))} />
                <span className="addon-opt__box" aria-hidden="true"><Icon name="check" /></span>
                <Icon name={a.icon} className="addon-opt__ico" />
                <span>{a.name}</span>
                <strong dir="ltr">+{a.price} ₪</strong>
              </label>
            ))}
          </div>
        </fieldset>
      </Accordion>
      <Accordion id="extra" icon="sparkle" title="עוד כמה דברים קטנים" desc="כפתור תגובה, תזכורת לשנה הבאה והערות.">
        <div className="fields">{extra.map((f) => <Field key={f.id} f={f} />)}</div>
      </Accordion>
      <div className="total" aria-live="polite" id="total">
        <span>סה"כ משוער</span>
        <strong>{t.sum} ₪</strong>
        {promo && t.full > t.sum && <small>חסכתם {t.full - t.sum} ₪ במבצע</small>}
      </div>
    </>
  );
}
