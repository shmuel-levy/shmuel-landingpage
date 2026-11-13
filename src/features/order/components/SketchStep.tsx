/* Step 5: the live sketch, the order summary and sending it on WhatsApp. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Envelope, type EnvelopeHandle } from "@/components/Envelope";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { getPalette, LINERS } from "@/lib/envelope/palettes";
import { getSource, track } from "@/lib/track";
import type { Promo } from "@/types/content";
import { DEF_LINER, DEF_PALETTE, SKETCH_KEY, typeDef } from "../config";
import { dotted } from "../logic/dates";
import { buildDemo, lockHalf } from "../logic/demo";
import { fmtTime, orderMessage, totals } from "../logic/message";
import { clearDraft, useOrder } from "../store";
import { audioExt, voiceBlob } from "../voice";
import { useWizard } from "./wizard-context";

const NEW_TAB = <span className="sr-only"> (נפתח בחלון חדש)</span>;

export function SketchStep({ promo, onBack }: { promo: Promo | null; onBack: () => void }) {
  const { type, data } = useWizard();
  const { photos, voice } = useOrder();
  const T = typeDef(type)!;
  const t = totals(data, promo);
  const [frameSrc, setFrameSrc] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);

  const msg = useMemo(
    () => orderMessage({ type: type!, data, photos, voice, promo, sourceLabel: getSource()?.label }),
    [type, data, photos, voice, promo],
  );
  const href = `https://wa.me/${SITE.contact.phoneIntl}?text=${encodeURIComponent(msg)}`;

  // build the sketch for the preview page and (re)load the phone
  useEffect(() => {
    const demo = lockHalf(buildDemo({ type: type!, data, photos: photos.map((p) => p.url), voice }), data);
    try {
      localStorage.setItem(SKETCH_KEY, JSON.stringify(demo));
    } catch {
      /* */
    }
    setFrameSrc("demos/preview.html?v=" + Date.now());
    track("sketch_view", { type, plan: data.plan, value: t.sum, voice: !!voice, photos: photos.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice]);

  // a screenshot while the sketch is open hides it for a moment (desktop)
  useEffect(() => {
    const veil = (e: KeyboardEvent) => {
      const k = e.key || "";
      if (k === "PrintScreen" || ((e.metaKey || e.ctrlKey) && e.shiftKey && /^[345sS]$/.test(k))) {
        try {
          frame.current?.contentWindow?.mtVeil?.(3000);
          void navigator.clipboard?.writeText("");
        } catch {
          /* */
        }
      }
    };
    document.addEventListener("keydown", veil);
    document.addEventListener("keyup", veil);
    return () => {
      document.removeEventListener("keydown", veil);
      document.removeEventListener("keyup", veil);
    };
  }, []);

  const rows: [string, string | undefined][] = [
    ["סוג", T.label],
    ["למי", data.recipient],
    ["חתימה", data.from],
    ["עיצוב", `${getPalette(data.palette).label}, בטנת ${LINERS[data.liner as keyof typeof LINERS]}`],
    ["חבילה", t.plan.name + (t.adds.length ? ` + ${t.adds.length} תוספות` : "")],
    ["עד", data.deadline ? dotted(data.deadline) : ""],
  ];

  const onSend = () => {
    setSent(true);
    clearDraft();
    track("send_whatsapp", { type, plan: t.plan.id, value: t.sum, currency: "ILS", voice: !!voice });
  };
  const copy = () => {
    track("copy_summary", { type });
    const done = () => {
      setCopied(true);
      setStatus("הסיכום הועתק. אפשר להדביק בווטסאפ.");
      setTimeout(() => setCopied(false), 2200);
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = msg;
      ta.setAttribute("readonly", "");
      Object.assign(ta.style, { position: "fixed", opacity: "0" });
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch {
        /* */
      }
      ta.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(msg).then(done, fallback);
    else fallback();
  };
  // sending the recording: on phones the share sheet opens (straight to WhatsApp), on desktop it downloads
  const shareVoice = () => {
    const blob = voiceBlob.current;
    if (!voice || !blob) return;
    const name = `matanot-voice-${String(data.recipient || "").trim().replace(/\s+/g, "-") || "hakalata"}.${audioExt(voice.type)}`;
    let file: File | null = null;
    try {
      file = new File([blob], name, { type: voice.type });
    } catch {
      /* old browser */
    }
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: "ההקלטה להפתעה", text: `ההקלטה להפתעה של ${data.recipient || ""}` }).then(() => track("voice_shared", { how: "share" }), () => {});
      return;
    }
    const a = document.createElement("a");
    a.href = voice.url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("ההקלטה ירדה למכשיר. צרפו אותה בשיחת הווטסאפ איתי.");
    track("voice_shared", { how: "download" });
  };

  return (
    <>
      <div className="sketch">
        <div className="sketch__phone">
          <div className="phone phone--sketch">
            <div className="phone__notch" aria-hidden="true" />
            <iframe id="sketchFrame" ref={frame} title="הסקיצה הראשונית של ההפתעה שלכם" loading="lazy" src={frameSrc || undefined} />
          </div>
          <a className="link-btn" href="demos/preview.html" id="fullPreview" target="_blank" rel="noopener" onClick={(e) => {
            e.preventDefault();
            window.open("demos/preview.html", "_blank");
          }}>
            <Icon name="eye" />פתיחה במסך מלא{NEW_TAB}
          </a>
        </div>
        <div className="sketch__side">
          <h3>סיכום ההזמנה</h3>
          <dl className="summary" id="summary">
            {rows.filter((r) => r[1]).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
            <div className="summary__total">
              <dt>סה"כ משוער</dt>
              <dd>{t.sum} ₪{promo && t.full > t.sum && <> <small>(חסכתם {t.full - t.sum} ₪)</small></>}</dd>
            </div>
          </dl>
          <div className="sketch__send">
            <a className="btn btn--wa btn--lg btn--block" id="sendWa" data-send="" href={href} target="_blank" rel="noopener" onClick={onSend}>
              <Icon name="whatsapp" />שליחה לשמואל בווטסאפ{NEW_TAB}
            </a>
          </div>
          <div className="voice-send" id="voiceSend" hidden={!voice}>
            <p><Icon name="mic" /><span>יש לכם הקלטה (<span id="voiceSendLen">{voice ? fmtTime(voice.dur) : ""}</span>). אחרי הסיכום, שלחו לי גם אותה:</span></p>
            <button type="button" className="btn btn--ghost btn--block" id="shareVoice" onClick={shareVoice}><Icon name="send" />שליחת ההקלטה</button>
          </div>
          <button type="button" className="btn btn--ghost btn--block" id="copyMsg" onClick={copy}>
            <Icon name={copied ? "check" : "copy"} />{copied ? "הועתק!" : "העתקת הסיכום"}
          </button>
          <p className="sr-only" id="copyStatus" aria-live="polite">{status}</p>
          <div className="sent-note" id="sentNote" hidden={!sent} role="status">
            <Icon name="check" />
            <p><b>מעולה!</b> ההודעה מוכנה בווטסאפ, רק ללחוץ "שליחה". אחר כך שלחו באותה שיחה את התמונות<span id="sentVoice" hidden={!voice}> ואת ההקלטה (בכפתור "שליחת ההקלטה")</span>, ותוך 24 שעות תקבלו את הגרסה הסופית.</p>
          </div>
          <details className="msg-peek"><summary>מה בדיוק נשלח?</summary><pre id="msgPreview" dir="rtl">{msg}</pre></details>
          <ol className="next-steps">
            <li><b>שולחים</b> את הסיכום בווטסאפ, ואת התמונות באותה שיחה</li>
            <li><b>תוך 24 שעות</b> מקבלים קישור לגרסה הסופית</li>
            <li><b>אוהבים?</b> משלמים בביט או בפייבוקס ושולחים</li>
          </ol>
          <button type="button" className="btn btn--ghost btn--sm" data-back="" onClick={onBack}><Icon name="pencil" />חזרה לעריכה</button>
          <p className="terms-note">השליחה לא מחייבת בתשלום. משלמים רק אחרי שאישרתם את הגרסה הסופית. <a href="terms.html">תנאי השירות</a></p>
        </div>
      </div>
      <div className="sketch-bar">
        <a className="btn btn--wa btn--block" id="sendWa2" data-send="" href={href} target="_blank" rel="noopener" onClick={onSend}>
          <Icon name="whatsapp" />אהבתי! שליחה בווטסאפ{NEW_TAB}
        </a>
      </div>
    </>
  );
}

/* ---------- the envelope in the side panel, live while filling the form ---------- */
export function LiveEnvelope() {
  const { type, data } = useOrder();
  const T = typeDef(type);
  const pal = data.palette || (T ? DEF_PALETTE[T.id] : "blush");
  const theme = getPalette(pal).theme;
  const mark = data.mark != null ? data.mark : String(data.recipient || "").trim().charAt(0);
  const env = useRef<EnvelopeHandle>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState(false);
  const lastPal = useRef(pal);
  useEffect(() => {
    if (lastPal.current === pal) return;
    lastPal.current = pal;
    const s = screen.current;
    if (s) {
      s.classList.remove("is-swap");
      void s.offsetWidth;
      s.classList.add("is-swap");
    }
  }, [pal]);
  return (
    <aside className="live" aria-label="המעטפה שלכם בזמן אמת">
      <p className="live__label"><Icon name="sparkle" />המעטפה שלכם, בזמן אמת</p>
      <div className={"live__screen" + (opening ? " is-opening" : "")} id="liveScreen" ref={screen} style={{ background: theme.bg, "--ink-live": theme.ink } as React.CSSProperties}>
        <p className="live__to" id="liveTo">{data.recipient ? "" : "השם יופיע על המעטפה"}</p>
        <div className="live__env" id="liveEnv">
          <Envelope
            ref={env}
            key={`${pal}-${data.liner}-${mark}-${data.recipient || ""}-${type}`}
            label="הדגמת פתיחת המעטפה"
            mark={mark}
            liner={data.liner || (T ? DEF_LINER[T.id] : "dots")}
            to={data.recipient ? "ל" + data.recipient : ""}
            cardIcon={T ? T.icon : "heart"}
            cardTitle={data.recipient ? "ל" + data.recipient : "למי שאתם אוהבים"}
            cardText={T ? T.label : ""}
            palette={pal}
            onClick={() => {
              if (env.current?.isOpening()) return;
              setOpening(true);
              env.current?.open(() => {
                env.current?.reset();
                setOpening(false);
              }, { hold: 1800 });
            }}
          />
        </div>
        <p className="live__hint"><Icon name="tap" />הקישו על המעטפה לראות איך היא נפתחת</p>
      </div>
    </aside>
  );
}
