/* Step 3: colours, envelope, parts (and their order), voice, photos, music. */
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ORDER } from "@/data/order";
import { LINERS, PALETTES, getPalette, paletteStyle } from "@/lib/envelope/palettes";
import { useAppDispatch, useOrder, orderActions } from "../store";
import { SONG_FIELD, typeDef } from "../config";
import { buildDemo } from "../logic/demo";
import { fmtTime } from "../logic/message";
import { chosenParts, maxParts, partsDef, planParts, type KeyedStep } from "../logic/parts";
import { Accordion } from "./Accordion";
import { Field } from "./Field";
import { PartsOrder } from "./PartsOrder";
import { VoiceRecorder } from "./VoiceRecorder";
import { useWizard } from "./wizard-context";

const isMobile = () => window.matchMedia("(max-width: 639px)").matches;

function Look() {
  const { data, setField } = useWizard();
  const mark = data.mark != null ? data.mark : String(data.recipient || "").trim().charAt(0);
  return (
    <>
      <fieldset className="field field--group">
        <legend className="field__label">פלטת צבעים</legend>
        <div className="swatches">
          {Object.entries(PALETTES).map(([k, p]) => (
            <label className="swatch" key={k}>
              <input type="radio" name="palette" value={k} data-key="palette" checked={data.palette === k} onChange={() => setField("palette", k)} />
              <span className="swatch__chip" style={{ "--a": p.swatch[0], "--b": p.swatch[1], "--c": p.swatch[2] } as React.CSSProperties} aria-hidden="true"><i /><i /><i /></span>
              <span className="swatch__label">{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field field--group liners-field">
        <legend className="field__label">הבטנה בתוך המעטפה</legend>
        <div className="liners">
          {Object.entries(LINERS).map(([k, label]) => (
            <label className="liner" key={k}>
              <input type="radio" name="liner" value={k} data-key="liner" checked={data.liner === k} onChange={() => setField("liner", k)} />
              <span className={`liner__chip env--liner-${k}`} aria-hidden="true"><span className="env__liner" /></span>
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor="f-mark">האות על חותם השעווה</label>
        <p className="field__hint" id="f-mark-hint">בדרך כלל האות הראשונה של השם. ריק = לב.</p>
        <input className="input input--short" id="f-mark" type="text" maxLength={2} data-key="mark" aria-describedby="f-mark-hint" value={mark} onChange={(e) => setField("mark", e.target.value)} />
      </div>
    </>
  );
}

function Parts({ steps }: { steps: KeyedStep[] }) {
  const { type, data, setField } = useWizard();
  const dispatch = useAppDispatch();
  const T = typeDef(type)!, PD = partsDef(type!), max = maxParts();
  const els: string[] = data.elements || [];
  const n = chosenParts(type!, data, true).length, full = n >= max;
  const toggle = (id: string, on: boolean) => {
    // keep the recommended order; the voice part is managed by the recorder
    const order = [...PD.rec, ...PD.more];
    const next = order.filter((x) => (x === id ? on : els.includes(x)));
    if (els.includes("voice")) next.push("voice");
    setField("elements", next);
  };
  const chip = (id: string, rec: boolean) => {
    const e = ORDER.elements.find((x) => x.id === id);
    if (!e) return null;
    const on = els.includes(e.id), lock = full && !on;
    return (
      <label className={"chip chip--ico chip--part" + (lock ? " is-locked" : "")} key={id}>
        <input type="checkbox" name="elements" value={e.id} data-key="elements" checked={on} disabled={lock} onChange={(ev) => toggle(e.id, ev.target.checked)} />
        <span>
          <Icon name={e.icon} />
          {e.label}
          {rec && <em className="chip__rec">מומלץ</em>}
        </span>
      </label>
    );
  };
  return (
    <>
      <fieldset className="field field--group parts-field" aria-describedby="partsHint">
        <legend className="sr-only">החלקים בהפתעה</legend>
        <p className="field__hint" id="partsHint">סימנו את מה שהכי עובד ב{T.label}. עד {max} חלקים, כדי שלכל רגע יהיה מקום לנשום.</p>
        <div className="chips chips--elements">{PD.rec.map((id) => chip(id, true))}</div>
        {PD.more.length > 0 && (
          <details className="more-parts">
            <summary><Icon name="plus" />עוד {PD.more.length} חלקים שמתאימים</summary>
            <div className="chips chips--elements">{PD.more.map((id) => chip(id, false))}</div>
          </details>
        )}
        <p className="parts-count" id="partsCount" aria-live="polite">
          {full ? `בחרתם ${n} מתוך ${max}. רוצים חלק אחר? הורידו אחד קודם.` : `נבחרו ${n} מתוך ${max} (בחבילה הבסיסית: ${planParts("basic")})`}
        </p>
      </fieldset>
      <PartsOrder steps={steps} custom={!!data.order?.length} onOrder={(keys) => dispatch(orderActions.setOrder(keys))} />
    </>
  );
}

function Photos() {
  const dispatch = useAppDispatch();
  const { photos } = useOrder();
  const [status, setStatus] = useState("");
  const pickLabel = useRef<HTMLLabelElement>(null);
  const list = useRef<HTMLUListElement>(null);
  return (
    <div className="field">
      <p className="field__hint" id="photosHint">התמונות נשארות בטלפון שלכם ומשמשות רק לסקיצה. אותן שולחים לי אחר כך בווטסאפ.</p>
      <div className="photos-pick">
        <input type="file" id="photoInput" className="file-input" accept="image/*" multiple aria-label="הוספת תמונות" aria-describedby="photosHint" onChange={(e) => {
          const files = Array.from(e.target.files || []).filter((f) => /^image\//.test(f.type));
          const room = 15 - photos.length;
          const add = files.slice(0, Math.max(0, room)).map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
          dispatch(orderActions.addPhotos(add));
          setStatus(`נבחרו ${Math.min(15, photos.length + add.length)} תמונות`);
          e.target.value = "";
        }} />
        <label htmlFor="photoInput" className="btn btn--ghost btn--sm" ref={pickLabel}><Icon name="upload" />הוספת תמונות</label>
        <ul className="thumbs" id="thumbs" aria-label="התמונות שנבחרו" ref={list}>
          {photos.map((p, i) => (
            <li key={p.url}>
              <img src={p.url} alt={`תמונה ${i + 1}`} width="72" height="72" />
              <button type="button" className="thumb__x" data-rm={i} aria-label={`הסרת תמונה ${i + 1}`} onClick={() => {
                URL.revokeObjectURL(p.url);
                dispatch(orderActions.removePhoto(i));
                setStatus(`התמונה הוסרה. נשארו ${photos.length - 1}`);
                setTimeout(() => (list.current?.querySelector<HTMLElement>("[data-rm]") || pickLabel.current)?.focus(), 0);
              }}>
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only" id="photoStatus" aria-live="polite">{status}</p>
    </div>
  );
}

/** A few bars of the chosen music box mood. */
let sampleCtx: AudioContext | null = null;
function playSample(mood: string) {
  if (mood === "none") return;
  const M = ({ romantic: [0.3, [0, 4, 7, 12, 11, 7, 4, 7]], happy: [0.2, [0, 4, 7, 4, 9, 7, 4, 0, 2, 5, 9, 5]], emotional: [0.38, [-3, 0, 4, 9, 7, 4, 0, 4]] } as Record<string, [number, number[]]>)[mood];
  if (!M) return;
  try {
    sampleCtx = sampleCtx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    void sampleCtx.resume();
    const c = sampleCtx, t0 = c.currentTime + 0.05, master = c.createGain();
    master.gain.value = 0.07;
    master.connect(c.destination);
    M[1].forEach((semi, i) => {
      const o = c.createOscillator(), g = c.createGain(), when = t0 + i * M[0];
      o.type = "sine";
      o.frequency.value = 523.25 * Math.pow(2, semi / 12);
      o.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.9, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 1.2);
      o.start(when);
      o.stop(when + 1.3);
    });
  } catch {
    /* no audio */
  }
}

function Music() {
  const { data, setField } = useWizard();
  return (
    <>
      <fieldset className="field field--group">
        <legend className="sr-only">מוזיקה</legend>
        <div className="chips">
          {ORDER.moods.map((m) => (
            <label className="chip chip--ico" key={m.id}>
              <input type="radio" name="mood" value={m.id} data-key="mood" checked={data.mood === m.id} onChange={() => setField("mood", m.id)} />
              <span><Icon name={m.icon} />{m.label}</span>
            </label>
          ))}
        </div>
        <button type="button" className="link-btn" id="listenBtn" onClick={() => playSample(data.mood || "romantic")}>
          <Icon name="music" />להשמיע דוגמה
        </button>
      </fieldset>
      <Field f={SONG_FIELD} />
    </>
  );
}

export function DesignStep() {
  const { type, data } = useWizard();
  const { photos, voice } = useOrder();
  const steps = useMemo(() => buildDemo({ type: type!, data, photos: photos.map((p) => p.url), voice }).steps as KeyedStep[], [type, data, photos, voice]);
  const [partsOpen] = useState(() => !isMobile());
  const c = chosenParts(type!, data).length;
  return (
    <div className="fields" style={paletteStyle(data.palette)}>
      <Accordion id="look" icon="palette" title="המראה של המעטפה" desc="צבעים, בטנה ואות על החותם." defaultOpen status={getPalette(data.palette).label}>
        <Look />
      </Accordion>
      <Accordion id="parts" icon="sparkle" title="מה יהיה בפנים" desc="החלקים שמי שמקבל עובר, לפי הסדר." defaultOpen={partsOpen} status={`${c}/${maxParts()}`} done={c > 0}>
        <Parts steps={steps} />
      </Accordion>
      <Accordion id="voice" icon="mic" title="הודעה קולית" desc="לא אוהבים לכתוב? מקליטים כמה מילים. עד דקה וחצי." status={voice ? fmtTime(voice.dur) : ""} done={!!voice}>
        <VoiceRecorder />
      </Accordion>
      <Accordion id="photos" icon="images" title="תמונות לסקיצה" desc="רשות. לראות איך זה ייראה עם התמונות שלכם." status={photos.length ? `${photos.length} תמונות` : ""} done={!!photos.length}>
        <Photos />
      </Accordion>
      <Accordion id="music" icon="music" title="מוזיקה" desc="מה מתנגן כשהמעטפה נפתחת." status={ORDER.moods.find((m) => m.id === data.mood)?.label || ""}>
        <Music />
      </Accordion>
    </div>
  );
}
