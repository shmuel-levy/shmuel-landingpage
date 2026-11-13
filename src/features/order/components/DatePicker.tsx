/* =========================================================
   Date picker (instead of the browser's mm/dd/yyyy):
   a button showing the date in Hebrew, quick chips ("tomorrow", "in a week"),
   and a calendar that opens inside the form.
   Keyboard: arrows move between days (right = back, as in Hebrew), PageUp/PageDown
   change month, Home/End jump to the week's edges, Enter picks, Esc closes.
   Stored as "YYYY-MM-DD".
   ========================================================= */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/Icon";
import { motionOff, replayClass } from "@/lib/motion";
import { track } from "@/lib/track";
import type { FieldDef } from "@/types/content";
import { DP_DAYS, DP_MONTHS, addDays, dpLabel, dpMax, dpQuick, dpRel, fromIso, isoOf, today0 } from "../logic/dates";
import { useWizard } from "./wizard-context";

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export function DatePicker({ f, id, describe, invalid }: { f: FieldDef; id: string; describe: string; invalid: boolean }) {
  const { data, setField, say } = useWizard();
  const value = data[f.id] as string | undefined;
  const sel = fromIso(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => monthStart(sel || today0()));
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const min = today0(), max = dpMax(f.id);

  const set = (iso: string) => {
    setField(f.id, iso);
    const dt = fromIso(iso)!;
    replayClass(wrap.current, "is-pulse");
    say(`נבחר: ${dpLabel(dt)}, ${dpRel(dt)}`);
    if (f.id === "deadline") track("deadline_set", { days: Math.round((dt.getTime() - today0().getTime()) / 864e5) });
  };
  const close = (refocus = true) => {
    setOpen(false);
    setFocusIso(null);
    if (refocus) btn.current?.focus({ preventScroll: true });
  };
  const openPop = () => {
    // only one calendar open at a time
    document.dispatchEvent(new CustomEvent("dp:open", { detail: f.id }));
    setView(monthStart(sel || today0()));
    setOpen(true);
    setFocusIso("auto");
  };

  // another picker opened, or a click outside → close
  useEffect(() => {
    if (!open) return;
    const other = (e: Event) => (e as CustomEvent).detail !== f.id && close(false);
    const outside = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && close(false);
    document.addEventListener("dp:open", other);
    document.addEventListener("click", outside);
    return () => {
      document.removeEventListener("dp:open", other);
      document.removeEventListener("click", outside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // the day that holds the roving tabindex: the selected day, today, or the 1st of the month
  const y = view.getFullYear(), m = view.getMonth();
  let rovingIso = sel && sel.getMonth() === m && sel.getFullYear() === y ? isoOf(sel) : null;
  if (!rovingIso) rovingIso = min.getMonth() === m && min.getFullYear() === y ? isoOf(min) : isoOf(new Date(y, m, 1));
  if (focusIso && focusIso !== "auto") rovingIso = focusIso;

  useLayoutEffect(() => {
    if (!open || !focusIso) return;
    pop.current?.querySelector<HTMLButtonElement>('.dp__day[tabindex="0"]')?.focus({ preventScroll: true });
  }, [open, focusIso, view]);
  useEffect(() => {
    if (open) pop.current?.scrollIntoView({ block: "nearest", behavior: motionOff() ? "auto" : "smooth" });
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      return close();
    }
    const day = (e.target as HTMLElement).closest<HTMLElement>(".dp__day");
    if (!day) return;
    const cur = fromIso(day.dataset.iso)!;
    const step = ({ ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 } as Record<string, number>)[e.key];
    let nx: Date | null = null;
    if (step) nx = addDays(cur, step);
    else if (e.key === "PageDown") nx = new Date(cur.getFullYear(), cur.getMonth() + 1, Math.min(cur.getDate(), 28));
    else if (e.key === "PageUp") nx = new Date(cur.getFullYear(), cur.getMonth() - 1, Math.min(cur.getDate(), 28));
    else if (e.key === "Home") nx = addDays(cur, -cur.getDay());
    else if (e.key === "End") nx = addDays(cur, 6 - cur.getDay());
    if (!nx) return;
    e.preventDefault();
    if (nx < min || nx > max) return;
    setView(monthStart(nx));
    setFocusIso(isoOf(nx));
  };

  // month options from this month until the max date
  const months: Date[] = [];
  for (let i = 0; i <= Math.ceil((max.getTime() - min.getTime()) / (30 * 864e5)); i++) months.push(new Date(min.getFullYear(), min.getMonth() + i, 1));
  const prevOk = new Date(y, m, 0) >= min, nextOk = new Date(y, m + 1, 1) <= max;
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const todayIso = isoOf(min);

  return (
    <div className={"dp" + (open ? " is-open" : "")} data-dp={f.id} ref={wrap}>
      <button
        ref={btn}
        type="button"
        className="input dp__btn"
        id={id}
        data-dp-open={f.id}
        aria-expanded={open}
        aria-controls={`${id}-pop`}
        aria-describedby={describe}
        aria-invalid={invalid ? "true" : undefined}
        onClick={() => (open ? close() : openPop())}
      >
        <span className="dp__ico" aria-hidden="true"><Icon name="calendar" /></span>
        {sel ? (
          <span className="dp__val"><b>{dpLabel(sel)}</b><small>{dpRel(sel)}</small></span>
        ) : (
          <span className="dp__val dp__val--empty">בחרו תאריך</span>
        )}
        <span className="dp__chev" aria-hidden="true"><Icon name="arrow-left" /></span>
      </button>
      {dpQuick(f.id).length > 0 && (
        <div className="dp__quick" role="group" aria-label="קיצורים לתאריך">
          {dpQuick(f.id).map(([n, label]) => {
            const iso = isoOf(addDays(min, n));
            return (
              <button
                key={n}
                type="button"
                className="dp__q"
                data-dp-quick={f.id}
                data-n={n}
                aria-pressed={value === iso}
                onClick={() => {
                  set(iso);
                  close(false);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <div className="dp__pop" id={`${id}-pop`} role="dialog" aria-label={`בחירת תאריך: ${f.label}`} hidden={!open} ref={pop} onKeyDown={onKey}>
        {open && (
          <>
            <div className="dp__head">
              <button type="button" className="dp__nav" data-dp-nav={f.id} data-d="-1" aria-label="החודש הקודם" disabled={!prevOk} onClick={() => setView(new Date(y, m - 1, 1))}>
                <Icon name="arrow-right" />
              </button>
              <select className="dp__month" data-dp-month={f.id} aria-label="חודש" value={`${y}-${m}`} onChange={(e) => {
                const [yy, mm] = e.target.value.split("-");
                setView(new Date(+yy, +mm, 1));
              }}>
                {months.map((d) => (
                  <option key={`${d.getFullYear()}-${d.getMonth()}`} value={`${d.getFullYear()}-${d.getMonth()}`}>{DP_MONTHS[d.getMonth()]} {d.getFullYear()}</option>
                ))}
              </select>
              <button type="button" className="dp__nav" data-dp-nav={f.id} data-d="1" aria-label="החודש הבא" disabled={!nextOk} onClick={() => setView(new Date(y, m + 1, 1))}>
                <Icon name="arrow-left" />
              </button>
            </div>
            <div className="dp__week" aria-hidden="true">
              {DP_DAYS.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <div className="dp__grid" role="group" aria-label={`${DP_MONTHS[m]} ${y}`}>
              {Array.from({ length: first.getDay() }, (_, b) => (
                <span key={"b" + b} className="dp__blank" aria-hidden="true" />
              ))}
              {Array.from({ length: days }, (_, k) => {
                const dt = new Date(y, m, k + 1), iso = isoOf(dt), off = dt < min || dt > max;
                const isSel = !!sel && iso === isoOf(sel), isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    className={"dp__day" + (isSel ? " is-sel" : "") + (isToday ? " is-today" : "") + (dt.getDay() === 6 ? " is-sat" : "")}
                    data-dp-day={f.id}
                    data-iso={iso}
                    disabled={off}
                    tabIndex={iso === rovingIso ? 0 : -1}
                    aria-pressed={isSel}
                    aria-label={`${dpLabel(dt)} ${y}${isToday ? ", היום" : ""}`}
                    onClick={() => {
                      set(iso);
                      close();
                    }}
                  >
                    {k + 1}
                  </button>
                );
              })}
            </div>
            <p className="dp__foot">
              <button type="button" className="link-btn dp__close" data-dp-close={f.id} onClick={() => close()}>
                סגירה
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
