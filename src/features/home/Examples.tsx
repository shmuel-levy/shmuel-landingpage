import { useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { useReveal } from "@/hooks/useReveal";
import { useTilt } from "@/hooks/usePointerFx";
import type { ExampleItem } from "@/types/content";
import { Reveal, SectionHead } from "./sections";

const E = SITE.examples;
const FEW = 4; // phones: the first 4, the rest on demand (no sideways scrolling)
const catLabel = (id: string) => E.categories.find((c) => c.id === id)?.label || "";

function ExampleCard({ e, i, shown, pop }: { e: ExampleItem; i: number; shown: boolean; pop: number }) {
  const [ref, reveal] = useReveal<HTMLElement>();
  useTilt(ref as React.RefObject<HTMLElement>, 7);
  // `pop` re-mounts the card's class so the filter animation replays
  const cls = `example tone-${e.tone} ${pop ? "reveal is-visible pop" : reveal}`;
  return (
    <article ref={ref} key={pop} className={cls} data-cat={e.cat} hidden={!shown} style={{ "--d": (i % 4) * 90 + "ms" } as CSSProperties}>
      <div className="example__thumb" aria-hidden="true">
        <span className="example__glare" />
        <div className="mini-phone">
          <img src={e.shot} alt="" width="390" height="760" loading="lazy" decoding="async" />
        </div>
        <span className="example__badge"><Icon name={e.icon} /></span>
      </div>
      <div className="example__body">
        <span className="tag">{catLabel(e.cat)}</span>
        <h3>{e.title}</h3>
        <p>{e.text}</p>
        <ul className="pills" aria-label="מה יש בפנים">
          {e.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="example__links">
          <a className="example__link" href={e.url}>
            פתחו את הדוגמה
            <Icon name="arrow-left" />
            <span className="sr-only">: {e.title}</span>
          </a>
          <a className="example__want" href={`order.html?type=${e.order}`}>
            רוצה כזה<span className="sr-only">: {e.title}</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function Examples() {
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [pop, setPop] = useState(0);
  const [status, setStatus] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const collapsed = cat === "all" && !expanded;

  const choose = (id: string) => {
    setCat(id);
    setPop((p) => p + 1);
    const n = id === "all" ? E.items.length : E.items.filter((x) => x.cat === id).length;
    setStatus(`מוצגות ${n} דוגמאות`);
  };

  return (
    <section className="section section--tint" id="examples" aria-labelledby="exTitle">
      <div className="container">
        <SectionHead kicker={E.kicker} title={E.title} subtitle={E.subtitle} id="exTitle" />
        <Reveal className="tabs" aria-label="סינון לפי קטגוריה" id="tabs" role="group">
          {E.categories.map((c) => (
            <button key={c.id} type="button" className="tab" data-cat={c.id} aria-pressed={cat === c.id} onClick={() => choose(c.id)}>
              {c.icon && <Icon name={c.icon} />}
              {c.label}
            </button>
          ))}
        </Reveal>
        <p className="sr-only" id="exStatus" aria-live="polite">{status}</p>
        <div className={"examples" + (collapsed ? " is-collapsed" : "")} id="examplesList" ref={list}>
          {E.items.map((e, i) => (
            <ExampleCard key={e.url + pop} e={e} i={i} pop={pop} shown={cat === "all" || e.cat === cat} />
          ))}
        </div>
        <button
          type="button"
          className="btn btn--ghost more-btn"
          id="exMore"
          aria-expanded={expanded}
          aria-controls="examplesList"
          hidden={cat !== "all" || E.items.length <= FEW}
          onClick={() => {
            const open = !expanded;
            setExpanded(open);
            if (open) setTimeout(() => list.current?.querySelectorAll(".example")[FEW]?.querySelector("a")?.focus(), 0);
          }}
        >
          <Icon name="plus" />
          <span id="exMoreText">{expanded ? "להציג פחות" : `עוד ${E.items.length - FEW} דוגמאות`}</span>
        </button>
      </div>
    </section>
  );
}
