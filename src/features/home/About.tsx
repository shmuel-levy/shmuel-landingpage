import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { motionOff } from "@/lib/motion";
import { useInViewOnce } from "@/hooks/useReveal";
import { useTilt } from "@/hooks/usePointerFx";
import { Reveal } from "./sections";

const A = SITE.about;

/** "1", "70+", "100%" → counts up from 0 to the number, keeping the suffix. */
function CountUp({ value, run }: { value: string; run: boolean }) {
  const [text, setText] = useState(value);
  useEffect(() => {
    const n = parseInt(value, 10), suffix = value.replace(/^\d+/, "");
    if (!run || isNaN(n) || motionOff()) return;
    let t0 = 0, raf = 0;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / 1200);
      setText(Math.round(n * (1 - Math.pow(1 - p, 3))) + suffix);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return <span className="stat__num" data-count={value}>{text}</span>;
}

/** The profile photo "builds itself" like a web page: skeleton → scan → photo, then a line of code types itself. */
function Profile({ built }: { built: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  useTilt(ref, 8, 10, false);

  useEffect(() => {
    if (!built) return;
    const off = motionOff();
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setReady(true), off ? 0 : 1600));
    timers.push(
      window.setTimeout(() => {
        if (off) return setCode(A.codeLine);
        let i = 0;
        const tick = () => {
          setCode(A.codeLine.slice(0, ++i));
          if (i < A.codeLine.length) timers.push(window.setTimeout(tick, 38 + Math.random() * 40));
        };
        tick();
      }, off ? 0 : 1500),
    );
    return () => timers.forEach(clearTimeout);
  }, [built]);

  return (
    <div className={"profile" + (built ? " is-built" : "") + (ready ? " is-ready" : "")} id="profile" ref={ref}>
      <div className="profile__window">
        <div className="profile__bar" aria-hidden="true"><i /><i /><i /><em>matanot / shmuel</em></div>
        <div className="profile__canvas">
          <div className="profile__skeleton" aria-hidden="true"><b /><b /><b /><b /><b /></div>
          <img className="profile__photo" src="images/shmuel.jpg" width="820" height="1098" loading="lazy" decoding="async" alt="שמואל לוי, מפתח Full-Stack ומייסד Matanot, מחייך בחולצה כהה על רקע כחול" />
          <div className="profile__scan" aria-hidden="true" />
        </div>
      </div>
      <div className="profile__code" aria-hidden="true">
        <span className="profile__prompt">›</span>
        <code id="codeType">{code}</code>
        <span className="caret" />
      </div>
      <ul className="profile__chips" id="chips" aria-label="טכנולוגיות">
        {A.chips.map((c, i) => (
          <li key={c} className={`chip chip--${i}`} lang="en">{c}</li>
        ))}
      </ul>
      <figure className="profile__sticker" aria-hidden="true">
        <img src="images/favicon.png" alt="" width="96" height="96" loading="lazy" />
        <figcaption>גם זה אני</figcaption>
      </figure>
      <svg className="profile__heart" viewBox="0 0 60 56" aria-hidden="true">
        <path d="M30 50C14 39 5 30 6 19 7 10 14 5 21 6c4 .6 7 3 9 7 2-4 5-7 10-7 8 0 14 6 13 15-1 11-11 20-23 29z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function About() {
  const [built, setBuilt] = useState(false);
  const [more, setMore] = useState(false);
  const section = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (motionOff()) setBuilt(true);
  }, []);
  useInViewOnce(section, () => setBuilt(true), { threshold: 0.3 });

  return (
    <section className="section section--ink" id="about" aria-labelledby="aboutTitle">
      <svg className="wave wave--top" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60V22C240 0 480 44 720 30S1200 0 1440 18V60z" fill="currentColor" />
      </svg>
      <div className="container about" ref={section}>
        <Profile built={built} />
        <Reveal className="about__text">
          <p className="kicker">{A.kicker}</p>
          <h2 className="about__title" id="aboutTitle">{A.title}</h2>
          <div id="aboutParas" className={more ? "is-open" : undefined}>
            {A.paragraphs.slice(0, 2).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="about__more" id="aboutMoreText">
              {A.paragraphs.slice(2).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <button type="button" className="link-btn about__more-btn" id="aboutMore" aria-expanded={more} aria-controls="aboutMoreText" onClick={() => setMore((m) => !m)}>
            <span data-icon={more ? "x" : "plus"}><Icon name={more ? "x" : "plus"} /></span>
            {more ? "לקצר" : "להמשך הסיפור"}
          </button>
          <p className="about__sign">{A.signature}</p>
          <dl className="stats" id="stats">
            {A.stats.map((s) => (
              <div className="stat" key={s.label}>
                <dt>{s.label}</dt>
                <dd><CountUp value={s.num} run={built} /> {s.unit}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
      <div className="container">
        <Reveal as="h3" className="projects__title">{A.projectsTitle}</Reveal>
        <ul className="projects" id="projects">
          {A.projects.map((p, i) => (
            <Reveal as="li" key={p.name} className="project" style={{ "--d": i * 100 + "ms" } as CSSProperties}>
              <h4 lang="en">{p.name}</h4>
              <p>{p.desc}</p>
              <ul className="pills pills--ink">
                {p.tags.map((t) => (
                  <li key={t} lang="en">{t}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </div>
      <svg className="wave wave--bottom" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0V30C260 58 520 14 760 28S1220 58 1440 34V0z" fill="currentColor" />
      </svg>
    </section>
  );
}
