/* Record a voice message (up to 90s) or upload one from the phone. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { motionOff } from "@/lib/motion";
import { track } from "@/lib/track";
import { VOICE_FIELDS, VOICE_IDEA, VOICE_MAX } from "../config";
import { fmtTime } from "../logic/message";
import { orderActions, useAppDispatch, useOrder } from "../store";
import { audioDuration, recMime, recSupported, voiceBlob, voiceDb } from "../voice";
import { Field } from "./Field";

export function VoiceRecorder() {
  const dispatch = useAppDispatch();
  const { type, voice } = useOrder();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [supported, setSupported] = useState(true);
  const rec = useRef<{ media: MediaRecorder | null; stream: MediaStream | null; chunks: Blob[]; t0: number; timer: number; raf: number; ctx: AudioContext | null; busy: boolean }>({ media: null, stream: null, chunks: [], t0: 0, timer: 0, raf: 0, ctx: null, busy: false });
  const bars = useRef<HTMLSpanElement>(null);
  const startBtn = useRef<HTMLButtonElement>(null);
  const stopBtn = useRef<HTMLButtonElement>(null);
  const againBtn = useRef<HTMLButtonElement>(null);
  const uploadLabel = useRef<HTMLLabelElement>(null);

  const say = (t: string) => {
    setStatus("");
    setTimeout(() => setStatus(t), 50);
  };
  const fail = (t: string) => {
    setError(t);
    say(t);
  };

  useEffect(() => {
    const ok = recSupported();
    setSupported(ok);
    if (!ok) setError("הדפדפן הזה לא מאפשר להקליט ישירות. אפשר להקליט בטלפון (למשל בהודעה קולית או בהקלטות) ולהעלות כאן את הקובץ.");
    return () => stop(); // leaving the step stops a running recording
  }, []);

  const keep = (blob: Blob, dur: number, how: string) => {
    if (voice) URL.revokeObjectURL(voice.url);
    voiceBlob.current = blob;
    const t = blob.type || "audio/webm";
    dispatch(orderActions.setVoice({ url: URL.createObjectURL(blob), dur, type: t }));
    void voiceDb.put({ blob, dur, type: t });
    setError("");
    say(`ההקלטה נשמרה, ${fmtTime(dur)} דקות. אפשר להאזין לה כאן.`);
    track("voice_added", { how, seconds: Math.round(dur) });
    setTimeout(() => againBtn.current?.focus(), 0);
  };
  const clear = () => {
    if (voice) URL.revokeObjectURL(voice.url);
    voiceBlob.current = null;
    dispatch(orderActions.clearVoice());
    void voiceDb.del();
  };

  const releaseStream = () => {
    const R = rec.current;
    R.stream?.getTracks().forEach((t) => t.stop());
    R.stream = null;
    try {
      void R.ctx?.close();
    } catch {
      /* */
    }
    R.ctx = null;
  };
  // a small level meter while recording, so you can see the mic hears you
  const meter = (stream: MediaStream) => {
    if (motionOff()) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
      const R = rec.current;
      R.ctx = new AC();
      const an = R.ctx.createAnalyser();
      an.fftSize = 64;
      R.ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        const els = bars.current?.querySelectorAll<HTMLElement>("i");
        if (!els?.length || !R.media) return;
        an.getByteFrequencyData(buf);
        els.forEach((b, i) => (b.style.transform = `scaleY(${(0.15 + (buf[(i + 1) % buf.length] / 255) * 0.95).toFixed(2)})`));
        R.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      /* no meter */
    }
  };

  const start = () => {
    const R = rec.current;
    if (R.busy || R.media) return;
    R.busy = true;
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((stream) => {
        R.busy = false;
        const mime = recMime();
        let mr: MediaRecorder;
        try {
          mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        } catch {
          mr = new MediaRecorder(stream);
        }
        Object.assign(R, { media: mr, stream, chunks: [], t0: Date.now() });
        mr.ondataavailable = (e) => e.data?.size && R.chunks.push(e.data);
        mr.onstop = () => {
          const dur = (Date.now() - R.t0) / 1000;
          const type = (mr.mimeType || mime || "audio/webm").split(";")[0];
          releaseStream();
          R.media = null;
          setRecording(false);
          if (dur < 1 || !R.chunks.length) {
            fail("ההקלטה קצרה מדי. נסו שוב, ודברו קצת יותר.");
            setTimeout(() => startBtn.current?.focus(), 0);
            return;
          }
          keep(new Blob(R.chunks, { type }), dur, "recorded");
        };
        mr.start(250);
        setRecording(true);
        setElapsed(0);
        setError("");
        setTimeout(() => {
          stopBtn.current?.focus();
          meter(stream);
        }, 0);
        say('מקליט. לחצו על "סיום הקלטה" כשתסיימו.');
        R.timer = window.setInterval(() => {
          const sec = (Date.now() - R.t0) / 1000;
          setElapsed(sec);
          if (sec >= VOICE_MAX) stop();
          else if (Math.floor(sec) === VOICE_MAX - 10) say("נשארו 10 שניות");
        }, 250);
      })
      .catch((err: DOMException) => {
        R.busy = false;
        const n = err?.name;
        fail(
          n === "NotAllowedError" || n === "SecurityError"
            ? "לא קיבלנו אישור להשתמש במיקרופון. אפשר לאשר בהגדרות הדפדפן ולנסות שוב, או להעלות הקלטה מהטלפון."
            : n === "NotFoundError"
              ? "לא מצאנו מיקרופון במכשיר הזה. אפשר להעלות הקלטה מהטלפון."
              : "ההקלטה לא עבדה בדפדפן הזה (קורה בדפדפן שבתוך אינסטגרם או טיקטוק). פתחו את הקישור בכרום או בספארי, או העלו הקלטה מהטלפון.",
        );
      });
  };
  function stop() {
    const R = rec.current;
    clearInterval(R.timer);
    cancelAnimationFrame(R.raf);
    if (R.media && R.media.state !== "inactive") R.media.stop();
  }

  const upload = async (f: File | undefined) => {
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(m4a|mp3|wav|ogg|opus|aac|webm)$/i.test(f.name)) return fail("זה לא נראה כמו קובץ שמע. בחרו הקלטה (m4a, mp3, wav).");
    if (f.size > 15 * 1024 * 1024) return fail("הקובץ גדול מדי (מעל 15MB). נסו הקלטה קצרה יותר.");
    keep(f, await audioDuration(f), "upload");
  };

  const fileInput = (
    <input type="file" id="voiceFile" className="file-input" accept="audio/*" aria-label="העלאת קובץ הקלטה מהטלפון" onChange={(e) => {
      void upload(e.target.files?.[0]);
      e.target.value = "";
    }} />
  );
  const err = (
    <p className="rec__err" id="recErr" role="alert" hidden={!error}>
      {error && (<><Icon name="x" /><span>{error}</span></>)}
    </p>
  );

  let body;
  if (recording) {
    body = (
      <>
        <div className="rec__live">
          <button type="button" className="rec__btn is-on" id="recStop" ref={stopBtn} onClick={stop}>
            <Icon name="stop" /><span>סיום הקלטה</span>
          </button>
          <div className="rec__meter" aria-hidden="true">
            <span className="rec__dot" />
            <span className="rec__bars" ref={bars}>{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>
          </div>
          <p className="rec__time"><span id="recTime">{fmtTime(elapsed)}</span> / {fmtTime(VOICE_MAX)}</p>
        </div>
        {err}
      </>
    );
  } else if (voice) {
    body = (
      <>
        <div className="rec__done">
          <audio controls preload="metadata" src={voice.url} aria-label="ההקלטה שלכם" />
          <p className="rec__meta"><Icon name="check" />הוקלט · {fmtTime(voice.dur)}</p>
          <div className="rec__actions">
            <button type="button" className="btn btn--ghost btn--sm" id="recAgain" ref={againBtn} onClick={() => {
              clear();
              if (supported) start();
              else setTimeout(() => uploadLabel.current?.focus(), 0);
            }}>
              <Icon name="replay" />הקלטה מחדש
            </button>
            <button type="button" className="btn btn--ghost btn--sm" id="recDel" onClick={() => {
              clear();
              say("ההקלטה נמחקה");
              setTimeout(() => (startBtn.current || uploadLabel.current)?.focus(), 0);
            }}>
              <Icon name="trash" />מחיקה
            </button>
          </div>
        </div>
        {err}
        {VOICE_FIELDS.map((f) => <Field key={f.id} f={f} />)}
      </>
    );
  } else {
    body = (
      <>
        <p className="rec__idea"><Icon name="sparkle" />{VOICE_IDEA[type || "other"]}</p>
        <div className="rec__start">
          {supported && (
            <button type="button" className="rec__btn" id="recStart" ref={startBtn} onClick={start}>
              <Icon name="mic" /><span>להתחיל להקליט</span>
            </button>
          )}
          {fileInput}
          <label htmlFor="voiceFile" className="btn btn--ghost btn--sm" ref={uploadLabel}>
            <Icon name="upload" />{supported ? "או להעלות הקלטה" : "העלאת הקלטה מהטלפון"}
          </label>
        </div>
        {err}
      </>
    );
  }

  return (
    <div className="field voice-field">
      <p className="field__hint" id="voiceHint">ההקלטה נשמרת רק בטלפון שלכם, עד שתשלחו לי אותה.</p>
      <div className="rec" id="rec" role="group" aria-label="הקלטה קולית" aria-describedby="voiceHint">{body}</div>
      <p className="sr-only" id="recStatus" aria-live="polite">{status}</p>
    </div>
  );
}
