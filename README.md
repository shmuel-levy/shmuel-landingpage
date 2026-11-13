# Matanot · מתנות — personalized surprises, delivered by link

**Live:** https://shmuel-levy.github.io/shmuel-landingpage/ · **Order wizard:** [`order.html`](https://shmuel-levy.github.io/shmuel-landingpage/order.html) · **Example surprise:** [`demos/love.html`](https://shmuel-levy.github.io/shmuel-landingpage/demos/love.html)

Matanot is a small business I built and run: people order a personal, interactive "surprise site" (a wax-sealed envelope that cracks open, quizzes, a runaway "no" button, photo albums, a voice message…) and send it to someone they love over WhatsApp. This repo is the whole product:

| Part | What it does |
|---|---|
| **Landing page** | Hebrew RTL, mobile-first. A live surprise plays inside a phone mock-up; a cupid shoots the wax seal to open it. |
| **Order wizard** | 5 steps with a different questionnaire per surprise type. Builds a **live, playable sketch** of the surprise from the answers and sends the order to WhatsApp. Voice recording, photos, drag-and-drop ordering of the parts, custom Hebrew date picker, draft autosave. |
| **Surprise engine** | Plays any surprise from plain data: 19 step types (scratch card on canvas, spinning wheel, press-and-hold heart, flip cards…), a synthesized music box, confetti and finishing characters. Powers the 9 examples, the sketch and every real customer gift. |
| **Event pages** | 6 SEO landing pages, statically pre-rendered with React at build time and hydrated in the browser. |

## Tech stack
- **React 19 + TypeScript** (strict), **Vite 6** multi-page build (every public URL kept as-is)
- **Redux Toolkit** for the order wizard, with listener middleware for debounced draft persistence
- **SCSS** partials (one per section/step type)
- **SSG**: `react-dom/server` pre-renders the event pages (`scripts/gen-pages.tsx`) + generates `sitemap.xml`
- Browser APIs: **Web Animations API**, **Web Audio API** (music box + sound effects, no audio files), **MediaRecorder** + **IndexedDB** (voice messages that survive a refresh), **Canvas** (scratch card), Pointer Events (drag-and-drop with FLIP animation), Web Share API
- **Testing**: Vitest + Testing Library (48 unit/component tests), **Playwright** + **axe-core** (98 end-to-end + accessibility tests on mobile and desktop)
- **CI/CD**: GitHub Actions → typecheck, lint, unit, build, e2e → deploy to GitHub Pages
- Accessibility: WCAG 2.1 AA checked by axe in CI, full keyboard support, screen-reader announcements, reduced-motion support, an accessibility menu with 10 adjustments

## Architecture
```
src/
  app/            entry points (one per page type): home, order, surprise, event, legal
  data/           editable content: site.ts (texts, prices, promo), order.ts (questions per type), pages.ts (event pages)
  features/
    surprise/     the engine: SurpriseApp + one component per step type, music, confetti, sketch protection
    order/        the wizard: Redux store, pure logic (sketch builder, WhatsApp message, validation, dates), components
    home/         landing page sections, live hero demo, promo popup
    event/        SEO event page (pre-rendered + hydrated)
  components/     Envelope (staged animation), Icon, layout (header, menu, accessibility widget)
  lib/            fx (character animations), sfx, pricing, tracking/attribution, palettes, motion
  hooks/          scroll reveal, in-view, pointer tilt, sticky CTA
  styles/         SCSS partials
e2e/              Playwright specs (home, order, demos, content)
scripts/          gen-pages.tsx (static generation)
demos/*.html      each surprise = an HTML file with `window.DEMO = { ... }` data
```
Design notes:
- **Data-driven**: a surprise is just JSON (`window.DEMO`), so the same engine plays examples, sketches and paid gifts.
- **Pure core**: the sketch builder (`features/order/logic/demo.ts`) and the order message are pure functions, unit-tested.
- **Imperative where it belongs**: frame-by-frame animation (character scenes, confetti, canvas) lives in small typed modules called from React, not in component state.
- **Migration**: the site started as vanilla JS. It was migrated page by page against a Playwright baseline recorded on the original, plus pixel-diff screenshots, so behaviour and visuals stayed identical (the compiled CSS is byte-identical).

## Scripts
```bash
npm install
npm run dev          # local dev server
npm run build        # pre-render event pages + typecheck + production build → dist/
npm run preview      # serve the build on :4173
npm test             # unit + component tests (Vitest)
npm run test:e2e     # end-to-end + accessibility (Playwright; run after build)
npm run lint         # ESLint
npm run check        # everything above, in CI order
```

---

## לעריכה (עברית)

### איפה משנים מה
| קובץ | מה יש בו |
|---|---|
| `src/data/site.ts` | **כל הטקסטים, המחירים, המבצע והטלפון של האתר** |
| `src/data/order.ts` | **השאלות בטופס ההזמנה**, טופס נפרד לכל סוג הפתעה, והצעות כפתור "רעיון" |
| `src/data/pages.ts` | עמודי האירוע לגוגל ולמודעות. נבנים לבד בכל `npm run build` (וגם `sitemap.xml`) |
| `public/images/` | תמונות האתר, צילומי המסך של הדוגמאות והמלצות |
| `public/demos/photos/` | תמונות לדוגמאות |

אחרי שינוי: `git push` ל-`main`, ו-GitHub Actions בודק, בונה ומעלה לבד.

### מבצע
ב-`src/data/site.ts` → `promo`: אחוז, תאריך סיום וטקסט. אחרי התאריך המבצע נעלם לבד מהמחירים, מהחלון הקופץ ומהטופס. לביטול מוקדם: `active: false`.
החלון הקופץ: `popupEvery` = `"load"` (בכל כניסה), `"session"` (פעם בביקור) או `"week"`. לבדיקה: `index.html?promo=1`.

### איך בונים הפתעה ללקוח
מעתיקים קובץ מ-`demos/` (למשל ל-`demos/noa-dani.html`), משנים את `window.DEMO`, ודוחפים. כל קובץ HTML בתיקייה נבנה לבד.
**חשוב:** בהפתעה אמיתית שמים `mode: "gift"`. זה מסתיר את התווית "אתר לדוגמה", מכבה את המדידה (פרטיות של מי שמקבל), ומוסיף בסוף:
- כפתור תגובה בווטסאפ לשולח: `reply: { phone: "972501234567", name: "דני" }`. אפשר לשנות תגובות מוכנות עם `quick: [...]`.
- שורת קרדיט קטנה. מבטלים עם `credit: false`.

הגדרות: `palette` (blush / ink / lilac / peach / mint / gold), `liner` (dots / stripes / hearts / confetti), `mood` (romantic / happy / emotional), `fx` (הדמות שמסיימת שלב: cupid / chuppah / ring / balloon / stork / dove / plane, או `"none"`) ו-`steps`.

סוגי השלבים:
`envelope` (מעטפה) · `voice` (הודעה קולית: `src`, `duration`, `caption`) · `message` (הודעה, אפשר עם `photo`) · `choice` (בחירה) · `runaway` (כפתור לא שבורח) · `checklist` (רשימה לסימון) · `quiz` (טריוויה) · `scratch` (כרטיס גירוד) · `photos` (אלבום פולרואיד) · `hold` (לב שמתמלא) · `candles` (נרות) · `notes` (קיר פתקים) · `countdown` (ספירה לאחור) · `reasons` (קלפי סיבות) · `openwhen` (מעטפות "תפתחי כש...") · `wheel` (גלגל מזל, עם `key`) · `coupons` (שוברים) · `final` (סיום: `ticket` / `invite` / `card`)

אייקונים: שם מתוך `src/lib/icons.ts` (למשל `heart`, `plane`, `gift`). תשובה בשלב עם `key` מוצגת בהמשך כ-`{key}`. `?step=3` פותח ישר בשלב.

### מדידה ומקור הגעה
ב-`src/data/site.ts` → `analytics`: מזהה GA4 (`G-...`) ו/או Meta Pixel. ריק = לא נטען כלום.
בקישורים במודעות: `?utm_source=instagram&utm_campaign=valentine` (או `?src=tiktok`). המקור נשמר 30 יום ומופיע בהודעת הווטסאפ מהטופס. לבדיקה: `?debug=track`.

### עוד לפני שמפרסמים
- [ ] `terms.html`: להשלים מספר עוסק וכתובת, ולעבור על התנאים מול מי שמבין
- [ ] מזהי מדידה ב-`analytics`
- [ ] מוזיקה: לוודא שכל שיר בהפתעות הוא מספרייה עם רישיון

## Credits
Photos in `public/demos/photos/` are from Unsplash (Unsplash license): Charlie Foster, Mayur Gala, Roberto Nickson, Margaret Barley, kazuend, Kelley Bozarth, Desi Mendoza, Benjamin Combs, Matthew Wiebe, Lechon Kirb, Steven Spassov, Ales Krivec, Olenka Kotyk, veeterzy, Giu Vicente, José Martín, Thomas Lefebvre, Carli Jean, Matthew Skinner, David Mao, Joanna Kosinska, Anthony DELANOIX. Some icon shapes are based on Lucide (ISC).
