import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { SITE } from "@/data/site";
import { Reveal, SectionHead } from "./sections";

const T = SITE.testimonials;

/** Real WhatsApp screenshots from a customer, with a zoom (lightbox). */
export function Testimonials() {
  const [shot, setShot] = useState<{ src: string; alt: string } | null>(null);
  const box = useRef<HTMLDialogElement>(null);
  const last = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = box.current;
    if (!d) return;
    const onClose = () => last.current?.focus();
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const open = (b: HTMLButtonElement, src: string, alt: string) => {
    last.current = b;
    setShot({ src, alt });
    if (box.current?.showModal) box.current.showModal();
    else window.open(src, "_blank");
  };

  return (
    <>
      <section className="section section--tint" id="testimonials" aria-labelledby="tTitle">
        <div className="container">
          <SectionHead kicker={T.kicker} title={T.title} subtitle={T.subtitle} id="tTitle" />
          <ol className="reviews" id="testimonialsList">
            {T.items.map((t, i) => (
              <Reveal as="li" key={i} className="review" style={{ "--d": i * 140 + "ms" } as CSSProperties}>
                <p className="review__time"><span className="review__clock">{t.time}</span>{t.step}</p>
                <figure className="review__card">
                  <button type="button" className="review__shot" data-full={t.image} data-alt={t.alt} onClick={(e) => open(e.currentTarget, t.image, t.alt)}>
                    <img src={t.image} alt={t.alt} width={t.w} height={t.h} loading="lazy" decoding="async" />
                    <span className="review__zoom" aria-hidden="true"><Icon name="search" />להגדלה</span>
                    <span className="sr-only">הגדלת צילום המסך</span>
                  </button>
                  <figcaption>
                    <blockquote><p>{t.quote}</p></blockquote>
                    <span className="review__who">עדי · לקוחה אמיתית</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
      {/* the promo popup is rendered between these two by HomePage, like the original markup */}
      <dialog className="lightbox" id="lightbox" aria-label="צילום מסך מוגדל" ref={box} onClick={(e) => e.target === box.current && box.current.close()}>
        <button type="button" className="lightbox__close" id="lightboxClose" aria-label="סגירה" onClick={() => box.current?.close()}>
          <Icon name="x" />
        </button>
        <img id="lightboxImg" src={shot?.src || undefined} alt={shot?.alt || ""} />
      </dialog>
    </>
  );
}
