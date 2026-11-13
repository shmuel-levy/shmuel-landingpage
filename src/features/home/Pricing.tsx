import { useState, type CSSProperties } from "react";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { planPrice } from "@/lib/pricing";
import type { Promo } from "@/types/content";
import { Reveal, SectionHead } from "./sections";

const PR = SITE.pricing;

export function Pricing({ promo }: { promo: Promo | null }) {
  const popular = (PR.plans.find((p) => p.popular) || PR.plans[0]).id;
  const [show, setShow] = useState(popular); // phones: one plan at a time
  const left = useTimeLeft(promo);
  return (
    <section className="section" id="pricing" aria-labelledby="pTitle">
      <div className="container">
        <SectionHead kicker={PR.kicker} title={PR.title} subtitle={PR.subtitle} id="pTitle" />
        {promo && (
          <Reveal as="p" className="promo" id="promoStrip">
            <span className="promo__tag">-{promo.percent}%</span>
            <span className="promo__text"><b>{promo.title}</b>{promo.text} עד {promo.endsLabel}</span>
            <span className="promo__left"><Icon name="clock" /><span id="promoLeft">{left}</span></span>
          </Reveal>
        )}
        <div className="plan-switch" role="group" aria-label="איזו חבילה להציג">
          {PR.plans.map((p) => (
            <button key={p.id} type="button" data-plan={p.id} aria-pressed={show === p.id} aria-controls={`plan-${p.id}`} onClick={() => setShow(p.id)}>
              {p.name} · {planPrice(p, promo)} {PR.currency}
            </button>
          ))}
        </div>
        <div className="plans" id="plans" data-show={show}>
          {PR.plans.map((p, i) => {
            const now = planPrice(p, promo);
            return (
              <Reveal as="article" key={p.id} className={`plan plan--${p.id}${p.popular ? " plan--popular" : ""}`} id={`plan-${p.id}`} style={{ "--d": i * 120 + "ms" } as CSSProperties}>
                {p.popular && <span className="plan__badge"><Icon name="star" />{p.popularLabel}</span>}
                <h3>{p.name}</h3>
                <p className="plan__price">
                  {promo && (
                    <del className="plan__old"><span className="sr-only">במקום </span>{p.price} {PR.currency}</del>
                  )}
                  <span className="plan__now"><span className="plan__num">{now}</span><span className="plan__cur">{PR.currency}</span></span>
                  {promo && <span className="plan__save">חוסכים {p.price - now} {PR.currency}</span>}
                </p>
                <p className="plan__desc">{p.description}</p>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}><Icon name="check" />{f}</li>
                  ))}
                </ul>
                <a className={`btn ${p.popular ? "btn--primary" : "btn--outline"} btn--block`} href={`order.html?plan=${p.id}`}>
                  {p.cta}
                  <Icon name="arrow-left" />
                </a>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="addons">
          <h3>{PR.addonsTitle}</h3>
          <ul id="addons">
            {PR.addons.map((a) => (
              <li key={a.id}>
                <Icon name={a.icon} className="addons__ico" />
                <span>{a.name}</span>
                <strong>+{a.price} {PR.currency}</strong>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal as="p" className="pay-note" id="payNote">
          <Icon name="card" />
          {PR.payNote}
        </Reveal>
      </div>
    </section>
  );
}
