/* =========================================================
   One question of the form, rendered by type:
   text · tel · number · textarea (+ quick sentences) · date · chips (one) ·
   multi (several) · list (rows) · quiz (question + answers) · notes (pairs).
   Every field gets a label, hint, error and an optional "idea" button.
   ========================================================= */
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import type { FieldDef } from "@/types/content";
import { hasHelp } from "../logic/validate";
import { DatePicker } from "./DatePicker";
import { useWizard } from "./wizard-context";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const Req = ({ on }: { on?: boolean }) =>
  on ? (
    <>
      <span className="req" aria-hidden="true"> *</span>
      <span className="sr-only"> (חובה)</span>
    </>
  ) : null;

function HelpButton({ f }: { f: FieldDef }) {
  const { applyHelp, helped } = useWizard();
  return (
    <button type="button" className="help-btn" data-help={f.id} onClick={() => applyHelp(f)}>
      <Icon name="wand" />
      <span className="help-btn__t">{helped[f.id] ? "רעיון אחר" : "רעיון"}</span>
      <span className="sr-only"> ל{f.label}</span>
    </button>
  );
}

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  return (
    <p className="field__error" id={`${id}-err`} hidden={!msg}>
      {msg && (
        <>
          <Icon name="x" />
          {msg}
        </>
      )}
    </p>
  );
}

export function Field({ f }: { f: FieldDef }) {
  const { data, setField, errors, type } = useWizard();
  const id = "f-" + f.id;
  const err = errors[f.id];
  const help = hasHelp(f, type) ? <HelpButton f={f} /> : null;
  const hint = f.hint ? <p className="field__hint" id={`${id}-hint`}>{f.hint}</p> : null;
  const describe = (f.hint ? `${id}-hint ` : "") + `${id}-err`;
  const v = data[f.id];
  const common = {
    "data-key": f.id,
    "aria-describedby": describe,
    "aria-required": f.required ? ("true" as const) : undefined,
    "aria-invalid": err ? ("true" as const) : undefined,
  };
  const wrap = (body: ReactNode, group = false) =>
    group ? (
      <fieldset className={cx("field field--group", help && "has-help", err && "has-error")} data-field={f.id} aria-describedby={f.type === "chips" || f.type === "multi" ? describe : undefined}>
        <legend className="field__label">{f.label}<Req on={f.required} /></legend>
        {help}
        {hint}
        {body}
      </fieldset>
    ) : (
      <div className={cx("field", help && "has-help", err && "has-error")} data-field={f.id}>
        <label className="field__label" htmlFor={id}>{f.label}<Req on={f.required} /></label>
        {help}
        {hint}
        {body}
      </div>
    );

  switch (f.type) {
    case "date":
      return wrap(
        <>
          <DatePicker f={f} id={id} describe={describe} invalid={!!err} />
          <ErrorText id={id} msg={err} />
        </>,
      );
    case "text":
    case "tel":
    case "number":
      return wrap(
        <>
          <input
            className="input"
            id={id}
            type={f.type}
            {...common}
            placeholder={f.placeholder}
            value={v ?? ""}
            maxLength={f.max && f.type !== "number" ? f.max : 140}
            inputMode={f.type === "number" ? "numeric" : f.type === "tel" ? "tel" : undefined}
            min={f.type === "number" ? f.min || 0 : undefined}
            max={f.type === "number" ? f.max || 999 : undefined}
            dir={f.type === "tel" ? "ltr" : undefined}
            autoComplete={f.autocomplete}
            onChange={(e) => setField(f.id, e.target.value)}
          />
          <ErrorText id={id} msg={err} />
        </>,
      );
    case "textarea":
      return wrap(
        <>
          <textarea className="input input--area" id={id} rows={4} maxLength={1200} {...common} placeholder={f.placeholder} value={v ?? ""} onChange={(e) => setField(f.id, e.target.value)} />
          {f.starters && <Starters f={f} id={id} />}
          <ErrorText id={id} msg={err} />
        </>,
      );
    case "chips":
    case "multi": {
      const multi = f.type === "multi";
      const arr: string[] = multi ? v || [] : [v];
      return wrap(
        <>
          <div className="chips">
            {f.options!.map((o, i) => (
              <label className="chip" key={o}>
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={id}
                  value={o}
                  data-key={f.id}
                  checked={arr.includes(o)}
                  aria-required={f.required && !multi && i === 0 ? "true" : undefined}
                  onChange={(e) => setField(f.id, multi ? (e.target.checked ? [...(v || []), o] : (v || []).filter((x: string) => x !== o)) : o)}
                />
                <span><Icon name="check" className="chip__check" />{o}</span>
              </label>
            ))}
          </div>
          <ErrorText id={id} msg={err} />
        </>,
        true,
      );
    }
    case "list": {
      const list: string[] = v || [];
      return wrap(
        <div className="list">
          {Array.from({ length: f.count || 0 }, (_, i) => (
            <div className="list-row" key={i}>
              <span className="list-row__n" aria-hidden="true">{i + 1}</span>
              <input
                className="input"
                id={`${id}-${i}`}
                type="text"
                data-key={f.id}
                data-i={i}
                aria-label={`${f.label}, שורה ${i + 1}`}
                placeholder={f.placeholder}
                value={list[i] || ""}
                maxLength={140}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = e.target.value;
                  setField(f.id, next);
                }}
              />
            </div>
          ))}
        </div>,
        true,
      );
    }
    case "quiz":
      return wrap(<QuizRows f={f} id={id} />, true);
    case "notes":
      return wrap(<NoteRows f={f} id={id} />, true);
    default:
      return null;
  }
}

/** Updates one part of one row of an array-of-objects field. */
function useRowSetter(f: FieldDef) {
  const { data, setField } = useWizard();
  const rows: Record<string, string>[] = data[f.id] || [];
  return {
    rows,
    set: (i: number, part: string, value: string) => {
      const next = [...rows];
      next[i] = { ...(next[i] || {}), [part]: value };
      setField(f.id, next);
    },
  };
}

function QuizRows({ f, id }: { f: FieldDef; id: string }) {
  const { rows, set } = useRowSetter(f);
  return (
    <>
      {Array.from({ length: f.count || 0 }, (_, q) => {
        const Q = rows[q] || {}, b = `${id}-${q}`;
        const input = (part: string, max: number, ph?: string) => (
          <input className="input" id={`${b}-${part}`} data-key={f.id} data-i={q} data-part={part} value={Q[part] || ""} placeholder={ph} maxLength={max} onChange={(e) => set(q, part, e.target.value)} />
        );
        return (
          <div className="qblock" key={q}>
            <p className="qblock__n">שאלה {q + 1}</p>
            <label className="mini-label" htmlFor={`${b}-q`}>השאלה</label>
            {input("q", 140, "למשל: מה ההזמנה הקבועה שלי בבית קפה?")}
            <div className="qblock__answers">
              <div><label className="mini-label" htmlFor={`${b}-a`}><Icon name="check" />תשובה נכונה</label>{input("a", 60)}</div>
              <div><label className="mini-label" htmlFor={`${b}-w1`}>תשובה שגויה</label>{input("w1", 60)}</div>
              <div><label className="mini-label" htmlFor={`${b}-w2`}>עוד תשובה שגויה</label>{input("w2", 60)}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function NoteRows({ f, id }: { f: FieldDef; id: string }) {
  const { rows, set } = useRowSetter(f);
  const parts = f.parts || ["text", "from"], phs = f.ph || ["מה כתוב בפתק", "ממי"], labs = f.partLabels || ["הטקסט", "ממי"];
  const wideFirst = !f.parts;
  return (
    <div className="list">
      {Array.from({ length: f.count || 0 }, (_, k) => {
        const N = rows[k] || {};
        return (
          <div className={"note-row" + (wideFirst ? "" : " note-row--pair")} key={k}>
            <span className="list-row__n" aria-hidden="true">{k + 1}</span>
            <input className={"input" + (wideFirst ? "" : " input--from")} id={`${id}-${k}-a`} data-key={f.id} data-i={k} data-part={parts[0]} aria-label={`${k + 1}, ${labs[0]}`} placeholder={phs[0]} value={N[parts[0]] || ""} maxLength={120} onChange={(e) => set(k, parts[0], e.target.value)} />
            <input className={"input" + (wideFirst ? " input--from" : "")} id={`${id}-${k}-b`} data-key={f.id} data-i={k} data-part={parts[1]} aria-label={`${k + 1}, ${labs[1]}`} placeholder={phs[1]} value={N[parts[1]] || ""} maxLength={160} onChange={(e) => set(k, parts[1], e.target.value)} />
          </div>
        );
      })}
    </div>
  );
}

/** Sentences the customer can add to the letter with one tap. */
function Starters({ f, id }: { f: FieldDef; id: string }) {
  const { data, setField } = useWizard();
  return (
    <div className="starters" role="group" aria-label="משפטים שאפשר להוסיף למכתב">
      {f.starters!.map((t) => (
        <button
          key={t}
          type="button"
          className="starter"
          data-starter={t}
          data-for={id}
          onClick={(e) => {
            const cur = String(data[f.id] || "");
            const value = (cur.trim() ? cur.replace(/\s+$/, "") + "\n" : "") + t + " ";
            setField(f.id, value);
            e.currentTarget.classList.add("is-used");
            const ta = document.getElementById(id) as HTMLTextAreaElement | null;
            if (ta) {
              ta.focus();
              requestAnimationFrame(() => ta.setSelectionRange(value.length, value.length));
            }
          }}
        >
          <Icon name="plus" />
          {t}
        </button>
      ))}
    </div>
  );
}
