import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { useSurprise } from "../context";
import { Medal, Photo, StepShell, Sub, Title } from "../parts";
import type { FinalStep, LockedStep } from "../types";

const SKETCH_NOTE = "זו רק סקיצה לכיוון. את הגרסה האמיתית אני בונה ביד: מנסח את המילים, מעצב עם התמונות שלכם, ומוסיף רגעים שלא מופיעים כאן.";

/* ---------- the sketch stops halfway: what's still waiting, and a blurred ending ---------- */
export function LockedView({ s }: { s: LockedStep }) {
  const { fill, restart, announce } = useSurprise();
  const t = s.teaser || {};
  useEffect(() => announce("הסקיצה נגמרת כאן. את ההמשך שמואל בונה ביד"), [announce]);
  return (
    <StepShell type="locked">
      <Medal name={s.icon || "lock"} cls="" />
      <Title text={s.title || "וזה רק חצי"} />
      <Sub text={s.sub} />
      <ol className="locked" aria-label="מה עוד מחכה בהפתעה">
        {(s.items || []).map((it, i) => (
          <li key={i} style={{ "--i": i } as CSSProperties}>
            <span className="locked__ico" aria-hidden="true"><Icon name={it.icon || "sparkle"} /></span>
            <span>{it.label}</span>
            <Icon name="lock" className="locked__lock" />
          </li>
        ))}
      </ol>
      <div className="locked__final" aria-hidden="true">
        <div className="locked__card">
          <b>{fill(t.title)}</b>
          <i /><i /><i /><i />
          <em>{fill(t.sign)}</em>
        </div>
        <p className="locked__cap"><Icon name="lock" />הסוף נחשף רק אצל מי שמקבל</p>
      </div>
      <div className="outro">
        <button type="button" className="btn btn--ghost replay" onClick={restart}>
          <Icon name="replay" />
          לצפות שוב
        </button>
        <p className="sketch-note"><Icon name="pencil" />{SKETCH_NOTE}</p>
      </div>
    </StepShell>
  );
}

/* ---------- WhatsApp reply to the sender (gift mode) ---------- */
function ReplyBox({ phone, name, quick }: { phone: string; name?: string; quick?: string[] }) {
  const options = quick || ["וואו, אין לי מילים", "התרגשתי ממש", "זה הדבר הכי מתוק שיש", "תודה, מכל הלב"];
  const [pick, setPick] = useState(0);
  const href = "https://wa.me/" + String(phone).replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(options[pick]);
  return (
    <div className="replybox">
      <p className="replybox__t" id="rbTitle"><Icon name="reply" />{name ? `רוצה לענות ל${name}?` : "רוצה לענות?"}</p>
      <div className="replybox__chips" role="group" aria-labelledby="rbTitle">
        {options.map((q, i) => (
          <button key={i} type="button" className="replybox__chip" aria-pressed={i === pick} onClick={() => setPick(i)}>
            {q}
          </button>
        ))}
      </div>
      <a className="btn btn--primary replybox__send" target="_blank" rel="noopener" href={href}>
        <Icon name="whatsapp" />
        שליחת תגובה בווטסאפ<span className="sr-only"> (נפתח בחלון חדש)</span>
      </a>
    </div>
  );
}

/* ---------- the ending: a letter, an invitation or a boarding pass ---------- */
export function FinalView({ s }: { s: FinalStep }) {
  const { demo, fill, restart, burst, reduce, track, gift, sketch, pageName, siteUrl } = useSurprise();
  useEffect(() => {
    track("demo_complete", { demo: pageName });
    const t = setTimeout(() => burst(120), reduce ? 0 : 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const R = demo.reply?.phone ? demo.reply : null;
  const heading = (
    <h1 className="step__title" tabIndex={-1}>
      {fill(s.title)}
    </h1>
  );
  let body;
  if (s.variant === "ticket" && s.ticket) {
    const t = s.ticket;
    body = (
      <article className="ticket" aria-label="כרטיס עלייה למטוס">
        <div className="ticket__head">
          <span className="ticket__air"><Icon name="plane" />{t.airline || "Matanot Air"}</span>
          <span lang="en">BOARDING PASS</span>
        </div>
        <div className="ticket__route">
          <div><b>{t.from.code}</b><small>{fill(t.from.city)}</small></div>
          <div className="ticket__plane" aria-hidden="true"><Icon name="plane" /></div>
          <div><b>{t.to.code}</b><small>{fill(t.to.city)}</small></div>
        </div>
        <dl className="ticket__grid">
          {t.fields.map((f, i) => (
            <div key={i}><dt>{f.label}</dt><dd>{fill(f.value)}</dd></div>
          ))}
        </dl>
        <div className="ticket__tear" aria-hidden="true" />
        <div className="ticket__foot">
          <p className="ticket__note">{fill(t.note)}</p>
          <div className="barcode" aria-hidden="true" />
        </div>
      </article>
    );
  } else if (s.variant === "invite") {
    body = (
      <article className="invite">
        {s.photo ? <Photo p={s.photo} cls="photo--invite" /> : <Medal name={s.icon} cls="" />}
        {heading}
        <dl className="invite__lines">
          {(s.lines || []).map((l, i) => (
            <div key={i}><dt><Icon name={l.icon || "sparkle"} />{l.label}</dt><dd>{fill(l.value)}</dd></div>
          ))}
        </dl>
        {s.note && <p className="sign">{fill(s.note)}</p>}
      </article>
    );
  } else {
    body = (
      <article className="letter">
        {s.photo ? <Photo p={s.photo} cls="photo--invite" /> : <Medal name={s.icon} cls="" />}
        {heading}
        {([] as string[]).concat(s.text || []).map((p, i) => (
          <p key={i} className="letter__text">{fill(p)}</p>
        ))}
        {s.sign && <p className="sign">{fill(s.sign)}</p>}
      </article>
    );
  }

  const replay = (label: string) => (
    <button type="button" className="btn btn--ghost replay" onClick={restart}>
      <Icon name="replay" />
      {label}
    </button>
  );
  let outro;
  if (gift) {
    outro = (
      <div className="outro">
        {R && <ReplyBox phone={R.phone} name={R.name} quick={R.quick} />}
        {replay("לחוות שוב מההתחלה")}
        {demo.credit !== false && (
          <a className="credit" href={`${siteUrl}?src=gift`} target="_blank" rel="noopener">
            <img src={`${siteUrl}images/favicon.png`} alt="" width="28" height="28" />
            <span>נוצר באהבה ב-<b lang="en">Matanot</b> · רוצים להכין הפתעה כזו?</span>
            <span className="sr-only"> (נפתח בחלון חדש)</span>
          </a>
        )}
      </div>
    );
  } else if (sketch) {
    outro = (
      <div className="outro">
        {R && <ReplyBox phone={R.phone} name={R.name} quick={R.quick} />}
        {replay("לצפות שוב")}
        <p className="sketch-note"><Icon name="pencil" />{SKETCH_NOTE}</p>
      </div>
    );
  } else {
    const orderHref = `../order.html?${demo.orderType ? `type=${demo.orderType}&` : ""}src=demo-${pageName}`;
    outro = (
      <div className="outro">
        {replay("לחוות שוב מההתחלה")}
        <a className="madeby" href={orderHref}>
          <img src="../images/favicon.png" alt="" width="52" height="52" />
          <span>
            <b>רוצים הפתעה כזו?</b>
            <small>ממלאים פרטים, רואים סקיצה מיד, ומקבלים את ההפתעה תוך 24 שעות</small>
          </span>
          <em>לבנות סקיצה<Icon name="arrow-left" /></em>
        </a>
      </div>
    );
  }

  return (
    <StepShell type="final">
      {s.variant === "ticket" && heading}
      {body}
      {outro}
    </StepShell>
  );
}
