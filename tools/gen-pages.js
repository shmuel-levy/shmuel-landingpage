/* =========================================================
   בונה את עמודי האירוע (HTML סטטי, כדי שגוגל יקרא את כל הטקסט)
   ואת sitemap.xml.   הרצה:  node tools/gen-pages.js
   התוכן: tools/pages-data.js · מחירים, טלפון וכתובת: config.js
   ========================================================= */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "config.js"), "utf8"), ctx);
const S = ctx.window.SITE;
const PAGES = require("./pages-data.js");
const BASE = S.siteUrl.replace(/\/?$/, "/");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const minPrice = Math.min(...S.pricing.plans.map((p) => p.price));
const premium = (S.pricing.plans.find((p) => p.id === "premium") || S.pricing.plans[0]).price;
const FILL = {
  price: `החל מ-${minPrice} ₪, ומשלמים רק אחרי שראיתם את הגרסה הסופית ואהבתם. בתקופות מבצע המחיר נמוך יותר, והוא מחושב לבד בטופס.`,
  perKid: `חבילת פרימיום עולה ${premium} ₪. בכיתה של 25 ילדים זה פחות מ-${Math.ceil(premium / 25)} ₪ להורה, ובמבצע אפילו פחות.`,
};
const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => FILL[k] || "");

const A11Y = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/ {4}<div class="a11y" id="a11y">[\s\S]*?\n {4}<\/div>\n(?= {2}<\/aside>)/)[0];

function page(P) {
  const url = BASE + P.slug + ".html";
  const order = `order.html?type=${P.type}&amp;src=page-${P.slug}`;
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: P.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: fill(f.a) } })),
  };
  const others = PAGES.filter((o) => o.slug !== P.slug);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(P.title)}</title>
  <meta name="description" content="${esc(P.desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="#FFF7F8" />
  <meta property="og:title" content="${esc(P.h1)}" />
  <meta property="og:description" content="${esc(P.desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="he_IL" />
  <meta property="og:image" content="${BASE}images/og.jpg" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" href="images/favicon.png" />
  <link rel="apple-touch-icon" href="images/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&family=Suez+One&family=Playpen+Sans+Hebrew:wght@500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="envelope.css" />
  <link rel="stylesheet" href="styles.css" />
  <script src="a11y.js"></script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body class="ev-page">
  <!-- נוצר אוטומטית מ-tools/pages-data.js. לא לערוך כאן: לשנות שם ולהריץ node tools/gen-pages.js -->
  <a class="skip-link" href="#main">דילוג לתוכן הראשי</a>
  <header class="header is-scrolled">
    <div class="container header__inner">
      <a href="index.html" class="brand" aria-label="Matanot, לעמוד הבית">
        <img class="brand__mark" src="images/favicon.png" alt="" width="44" height="44" />
        <span class="brand__text"><b lang="en">Matanot</b><small>הפתעות בקישור</small></span>
      </a>
      <div class="header__actions">
        <a class="wa-icon" data-wa target="_blank" rel="noopener" aria-label="שליחת הודעה בווטסאפ (נפתח בחלון חדש)"><span data-icon="whatsapp"></span></a>
        <a class="btn btn--primary btn--sm" href="${order}">הזמנה</a>
      </div>
    </div>
  </header>

  <main id="main">
    <section class="ev-hero" id="top" aria-labelledby="evTitle">
      <div class="container ev-hero__grid">
        <div>
          <p class="kicker-pill"><span data-icon="sparkle"></span>${esc(P.kicker)}</p>
          <h1 id="evTitle">${esc(P.h1)}</h1>
          <p class="ev-hero__lead">${esc(P.lead)}</p>
          <div class="ev-hero__ctas">
            <a class="btn btn--primary btn--lg" href="${order}"><span>${esc(P.cta)}</span><span data-icon="arrow-left"></span></a>
            <a class="btn btn--ghost btn--lg" href="demos/${P.demo}.html"><span data-icon="eye"></span>לראות דוגמה</a>
          </div>
          <p class="ev-price" id="evPrice">החל מ-${minPrice} ₪ · סקיצה מיד, משלמים רק אחרי שאהבתם</p>
        </div>
        <a class="ev-shot" href="demos/${P.demo}.html" aria-label="לפתוח את הדוגמה: ${esc(P.label)}">
          <img src="images/examples/${P.shot}.webp" alt="" width="780" height="1520" decoding="async" fetchpriority="high" />
          <span class="ev-shot__tag" aria-hidden="true"><span data-icon="tap"></span>לנסות בעצמכם</span>
        </a>
      </div>
    </section>

    <section class="section section--tint" aria-labelledby="ideasTitle">
      <div class="container">
        <header class="section__head"><h2 class="section__title" id="ideasTitle">${esc(P.ideasTitle)}</h2></header>
        <ul class="ev-ideas">
${P.ideas.map((it, i) => `          <li class="ev-idea"><span class="tile tile--${(i % 6) + 1}" aria-hidden="true"><span data-icon="${it.icon}"></span></span><div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div></li>`).join("\n")}
        </ul>
      </div>
    </section>

    <section class="section" aria-labelledby="howTitle">
      <div class="container">
        <header class="section__head"><h2 class="section__title" id="howTitle">איך זה עובד?</h2></header>
        <ol class="ev-steps">
          <li><b>ממלאים טופס קצר</b><span>מספרים על מי שמקבל: שמות, זיכרונות, בדיחות פנימיות. אפשר גם להקליט.</span></li>
          <li><b>רואים סקיצה מיד</b><span>המעטפה בצבעים שבחרתם, עם השם, והתחלה של המסע.</span></li>
          <li><b>מקבלים תוך 24 שעות</b><span>אני מעצב את הגרסה הסופית. אוהבים? משלמים ושולחים בווטסאפ.</span></li>
        </ol>
      </div>
    </section>

    <section class="section section--tint" aria-labelledby="faqTitle">
      <div class="container container--narrow">
        <header class="section__head"><h2 class="section__title" id="faqTitle">שאלות נפוצות</h2></header>
        <div class="faq">
${P.faq.map((f) => `          <details class="faq__item"><summary>${esc(f.q)}<span class="faq__plus" aria-hidden="true"><span data-icon="plus"></span></span></summary><p>${esc(fill(f.a))}</p></details>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="ev-final" aria-labelledby="finalTitle">
      <div class="container">
        <h2 id="finalTitle">3 דקות של טופס, וסקיצה מיד</h2>
        <p class="section__subtitle">בלי התחייבות. משלמים רק אחרי שרואים את הגרסה הסופית.</p>
        <div class="ev-hero__ctas ev-final__ctas">
          <a class="btn btn--primary btn--lg" href="${order}"><span>${esc(P.cta)}</span><span data-icon="arrow-left"></span></a>
          <a class="btn btn--ghost btn--lg" data-wa target="_blank" rel="noopener"><span data-icon="whatsapp"></span>שאלה בווטסאפ<span class="sr-only"> (נפתח בחלון חדש)</span></a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <p class="ev-more__title">עוד רעיונות לפי אירוע</p>
      <nav class="ev-more" aria-label="עוד רעיונות לפי אירוע">
${others.map((o) => `        <a href="${o.slug}.html">${esc(o.label)}</a>`).join("\n")}
        <a href="index.html#examples">כל הדוגמאות</a>
      </nav>
      <nav class="footer__links" aria-label="מידע משפטי">
        <a href="negishut.html">הצהרת נגישות</a>
        <a href="privacy.html">מדיניות פרטיות</a>
        <a href="terms.html">תנאי שירות</a>
      </nav>
      <p class="footer__copy">© 2026 <span lang="en">Matanot</span> · שמואל לוי</p>
    </div>
  </footer>

  <aside aria-label="יצירת קשר ונגישות">
    <div class="cta-bar" id="ctaBar">
      <a class="btn btn--primary cta-bar__main" href="${order}"><span data-icon="wand"></span>לבנות סקיצה, 3 דקות</a>
      <a class="wa-icon cta-bar__wa" data-wa target="_blank" rel="noopener" aria-label="שליחת הודעה בווטסאפ (נפתח בחלון חדש)"><span data-icon="whatsapp"></span></a>
    </div>
${A11Y}  </aside>

  <script src="config.js"></script>
  <script src="track.js"></script>
  <script src="icons.js"></script>
  <script src="page.js"></script>
  <script src="menu.js"></script>
</body>
</html>
`;
}

for (const P of PAGES) {
  fs.writeFileSync(path.join(ROOT, P.slug + ".html"), page(P));
  console.log("page", P.slug + ".html");
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const demos = fs.readdirSync(path.join(ROOT, "demos")).filter((f) => f.endsWith(".html") && f !== "preview.html");
const urls = [["", "1.0"], ["order.html", "0.9"]]
  .concat(PAGES.map((p) => [p.slug + ".html", "0.8"]))
  .concat(demos.map((d) => ["demos/" + d, "0.5"]))
  .concat([["terms.html", "0.2"], ["privacy.html", "0.2"], ["negishut.html", "0.2"]]);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, pr]) => `  <url><loc>${BASE}${u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
console.log("sitemap.xml:", urls.length, "urls");
