import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useStickyCta } from "@/hooks/useStickyCta";
import { A11yWidget } from "@/components/layout/A11yWidget";
import { ScrollProgress, SiteHeader, SkipLink, WaIcon } from "@/components/layout/Chrome";
import { activePromo, waLink } from "@/lib/pricing";
import { useMagneticButtons } from "@/hooks/usePointerFx";
import { About } from "./About";
import { Examples } from "./Examples";
import { Hero } from "./Hero";
import { Builder, Him } from "./HimAndBuilder";
import { Pricing } from "./Pricing";
import { PromoPopup } from "./PromoPopup";
import { Testimonials } from "./Testimonials";
import { Faq, FinalCta, HomeFooter, HowItWorks, Marquee, Toolbox, Why } from "./sections";

export function HomePage() {
  const promo = useMemo(() => activePromo(), []);
  const pastHero = useStickyCta("top", 0.7, 260);
  const [status, setStatus] = useState("");
  const announce = useCallback((t: string) => setStatus(t), []);
  useMagneticButtons();

  return (
    <>
      <SkipLink />
      <ScrollProgress />
      <SiteHeader
        onHome
        brandHref="#top"
        brandLabel="Matanot מתנות, חזרה לראש העמוד"
        actions={
          <>
            <WaIcon />
            <a className="btn btn--primary btn--sm" href="order.html">הזמנה</a>
          </>
        }
      />
      <main id="main">
        <Hero />
        <Marquee />
        <HowItWorks />
        <Examples />
        <Him />
        <Builder />
        <Toolbox />
        <About />
        <Why />
        <Testimonials />
        {promo && <PromoPopup promo={promo} onAnnounce={announce} />}
        <Pricing promo={promo} />
        <Faq />
        <FinalCta />
      </main>
      <HomeFooter />
      <aside aria-label="יצירת קשר ונגישות">
        <div className="cta-bar" id="ctaBar">
          <a className="btn btn--primary cta-bar__main" href="order.html">
            <span data-icon="wand"><Icon name="wand" /></span>
            לבנות סקיצה, 3 דקות
            {promo && <em className="cta-bar__tag">-{promo.percent}%</em>}
          </a>
          <WaIcon className="wa-icon cta-bar__wa" />
        </div>
        <a className={"wa-float" + (pastHero ? " is-shown" : "")} id="waFloat" href={waLink()} target="_blank" rel="noopener" aria-label="שליחת הודעה בווטסאפ (נפתח בחלון חדש)">
          <span data-icon="whatsapp"><Icon name="whatsapp" /></span>
        </a>
        <A11yWidget />
        <p className="sr-only" aria-live="polite">{status}</p>
      </aside>
    </>
  );
}
