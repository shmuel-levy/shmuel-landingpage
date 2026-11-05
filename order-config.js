/* =========================================================
   Matanot: הגדרות טופס ההזמנה
   כל סוג הפתעה מקבל טופס משלו. אפשר להוסיף, למחוק ולשנות שאלות כאן.
   סוגי שדות:
     text, textarea, date, number   ← שדה רגיל
     chips   ← בחירה אחת מתוך כמה (options)
     multi   ← כמה בחירות (options)
     list    ← כמה שורות טקסט (count)
     quiz    ← שאלות טריוויה: שאלה, תשובה נכונה ושתי תשובות שגויות (count)
     notes   ← פתקים: טקסט + ממי (count)
   required: true = חובה.  hint = הסבר קטן מתחת לשאלה.
   ========================================================= */
window.ORDER = {
  types: [
    {
      id: "partner", icon: "hearts", label: "בן / בת זוג", desc: "הזמנה לדייט, יום נישואין, סתם כי בא לך",
      elements: ["envelope", "runaway", "photos", "notes", "final"],
      fields: [
        { id: "nickname", type: "text", label: "כינוי חיבה (אם יש)", placeholder: "למשל: מותק, נונו" },
        { id: "together", type: "text", label: "כמה זמן אתם ביחד?", placeholder: "למשל: 4 שנים" },
        { id: "howMet", type: "textarea", label: "איך הכרתם?", hint: "כמה משפטים. אני הופך את זה לטקסט מרגש.", placeholder: "נפגשנו בחתונה של חברים, ורקדנו כל הלילה..." },
        { id: "insideJoke", type: "text", label: "בדיחה פנימית או משפט שרק שניכם מבינים", placeholder: "למשל: \"עוד פרק אחד וזהו\"" },
        { id: "loves", type: "list", count: 3, label: "3 דברים שאתם הכי אוהבים בו/בה", placeholder: "למשל: הצחוק שלה" },
        { id: "memories", type: "list", count: 4, label: "רגעים משותפים לאלבום", hint: "כיתוב קצר לכל תמונה. את התמונות עצמן מצרפים בשלב העיצוב.", placeholder: "למשל: הטיול לצפון, 2023" },
        { id: "question", type: "text", label: "השאלה עם הכפתור שבורח", placeholder: "נצא לדייט?", hint: "התשובה \"לא\" פשוט בורחת מהאצבע." },
        { id: "finale", type: "chips", label: "מה מחכה בסוף?", required: true, options: ["דייט", "חופשה או טיסה", "מתנה", "רק מכתב אהבה"] },
        { id: "finaleWhen", type: "text", label: "מתי?", placeholder: "למשל: חמישי, 20:00" },
        { id: "finaleWhere", type: "text", label: "איפה? (או רמז)", placeholder: "למשל: מסעדה איטלקית בנמל / יעד: הפתעה" },
        { id: "letter", type: "textarea", label: "המכתב בסוף", hint: "כתבו חופשי, גם בנקודות. אני עוזר לנסח.", placeholder: "מה שבא לכם להגיד לו/לה..." },
      ],
    },
    {
      id: "proposal", icon: "ring", label: "הצעת נישואין", desc: "השאלה הכי גדולה, עם אלבום ולב שמתמלא",
      elements: ["envelope", "photos", "hold", "runaway", "final"],
      fields: [
        { id: "together", type: "text", label: "כמה זמן אתם ביחד?", placeholder: "למשל: 5 שנים" },
        { id: "howMet", type: "textarea", label: "איך הכל התחיל?", placeholder: "הפעם הראשונה שראיתי אותה..." },
        { id: "memories", type: "list", count: 5, label: "רגעים לאלבום, מההתחלה ועד היום", hint: "כיתוב קצר לכל תמונה, לפי הסדר.", placeholder: "למשל: הדייט הראשון בפלורנטין" },
        { id: "proposalPlan", type: "chips", label: "איך האתר משתלב בהצעה?", required: true, options: ["ההצעה בתוך האתר", "האתר מוביל למקום ההצעה", "האתר נשלח אחרי ההצעה, למזכרת"] },
        { id: "placeTime", type: "text", label: "איפה ומתי זה קורה?", placeholder: "למשל: שבת בשקיעה, בחוף הצוק" },
        { id: "whoKnows", type: "text", label: "מי עוד בסוד? (אם צריך לתאם)", placeholder: "למשל: אחותה, נועה" },
        { id: "letter", type: "textarea", label: "מה תרצו להגיד לפני השאלה הגדולה?", placeholder: "כתבו מהלב, אני עוזר לנסח" },
      ],
    },
    {
      id: "birthday", icon: "cake", label: "יום הולדת", desc: "טריוויה, תמונות מביכות ונרות לכיבוי",
      elements: ["envelope", "quiz", "photos", "candles", "final"],
      fields: [
        { id: "age", type: "number", label: "בן/בת כמה?", placeholder: "30", min: 1, max: 120 },
        { id: "relation", type: "chips", label: "מה הקשר ביניכם?", options: ["בן/בת זוג", "חבר/ה", "אח/ות", "הורה", "עמית/ה לעבודה", "ילד/ה"] },
        { id: "hobbies", type: "text", label: "מה הוא/היא הכי אוהב/ת?", placeholder: "למשל: קפה, ים, הארי פוטר" },
        { id: "quiz", type: "quiz", count: 3, label: "טריוויה: כמה הוא/היא מכיר/ה אתכם?", hint: "שאלה, תשובה נכונה ושתי תשובות מצחיקות. אפשר להשאיר ריק ואני אמציא." },
        { id: "memories", type: "list", count: 4, label: "תמונות מביכות או זיכרונות מצחיקים", hint: "כיתוב קצר לכל תמונה", placeholder: "למשל: כיתה ג', והפוני ההוא" },
        { id: "gift", type: "text", label: "יש מתנה בסוף? מה היא?", placeholder: "למשל: כרטיסים להופעה (נחשף בכרטיס גירוד)" },
        { id: "letter", type: "textarea", label: "הברכה בסוף", placeholder: "מה שבא לכם לאחל" },
      ],
    },
    {
      id: "sorry", icon: "flag", label: "התנצלות", desc: "סליחה שאי אפשר להישאר כועסים עליה",
      elements: ["envelope", "notes", "scratch", "runaway", "final"],
      fields: [
        { id: "what", type: "textarea", label: "על מה הסליחה? (רק אם רוצים)", hint: "עוזר לי לכוון את הטון. לא חייב להופיע באתר.", placeholder: "שכחתי את יום הנישואין..." },
        { id: "promises", type: "list", count: 3, label: "הבטחות לעתיד", placeholder: "למשל: לשים תזכורת. שלוש תזכורות." },
        { id: "makeUp", type: "chips", label: "איך מפצים?", options: ["ארוחה", "פרחים", "יום כיף", "מתנה", "עוד לא יודע/ת"] },
        { id: "makeUpText", type: "text", label: "מה בדיוק נחשף בכרטיס הגירוד?", placeholder: "ערב פיצה, פרחים, ואני שוטף כלים שבוע" },
        { id: "noTexts", type: "list", count: 3, label: "מה כתוב על כפתור \"לא סולח/ת\" כשהוא בורח?", placeholder: "למשל: נו בבקשה" },
        { id: "letter", type: "textarea", label: "המכתב בסוף", placeholder: "מה שבא לכם להגיד" },
      ],
    },
    {
      id: "baby", icon: "baby", label: "הודעה על הריון", desc: "לסבא וסבתא, לאחים או לחברים",
      elements: ["envelope", "quiz", "scratch", "countdown", "final"],
      fields: [
        { id: "audience", type: "chips", label: "למי מספרים?", required: true, options: ["הורים (סבא וסבתא)", "אחים", "חברים", "בן/בת הזוג"] },
        { id: "reveal", type: "chips", label: "איך החדשות נחשפות?", options: ["כרטיס גירוד", "לב שמתמלא", "טריוויה ואז חשיפה"] },
        { id: "revealText", type: "text", label: "המשפט שנחשף", placeholder: "אתם הולכים להיות סבא וסבתא!" },
        { id: "dueDate", type: "date", label: "תאריך לידה משוער", hint: "לספירה לאחור" },
        { id: "gender", type: "chips", label: "בן או בת?", options: ["בן", "בת", "עדיין הפתעה"] },
        { id: "quiz", type: "quiz", count: 2, label: "חידון משפחתי לפני החשיפה (רשות)" },
        { id: "letter", type: "textarea", label: "מה תרצו להגיד בסוף?", placeholder: "תודה שאתם ההורים הכי טובים..." },
      ],
    },
    {
      id: "friend", icon: "users", label: "חבר / חברה", desc: "לחבר הכי טוב, לחברה מהגן, לכל החבר'ה",
      elements: ["envelope", "quiz", "photos", "final"],
      fields: [
        { id: "nickname", type: "text", label: "כינוי", placeholder: "למשל: שירוש" },
        { id: "occasion", type: "chips", label: "לכבוד מה?", options: ["יום הולדת", "פרידה / רילוקיישן", "סתם כי בא לי", "תודה", "חתונה"] },
        { id: "howMet", type: "textarea", label: "איך הכרתם?", placeholder: "בתור לאוטובוס, כיתה ז'..." },
        { id: "insideJoke", type: "text", label: "בדיחה פנימית", placeholder: "למשל: \"הפיצה של 3 בלילה\"" },
        { id: "quiz", type: "quiz", count: 3, label: "טריוויה: כמה הוא/היא מכיר/ה אתכם?" },
        { id: "memories", type: "list", count: 4, label: "תמונות מביכות או רגעים משותפים", placeholder: "למשל: הקריוקי באילת" },
        { id: "letter", type: "textarea", label: "המכתב בסוף", placeholder: "מה שבא לכם להגיד" },
      ],
    },
    {
      id: "thanks", icon: "hand-heart", label: "תודה והוקרה", desc: "לגננת, למורה, לצוות או לעמית",
      elements: ["envelope", "photos", "notes", "final"],
      fields: [
        { id: "role", type: "chips", label: "למי התודה?", required: true, options: ["גננת", "מורה", "צוות", "עמית/ה", "מנהל/ת", "רופא/ה או מטפל/ת", "אחר"] },
        { id: "group", type: "text", label: "שם הגן, הכיתה או הצוות", placeholder: "למשל: גן חבצלת" },
        { id: "special", type: "textarea", label: "מה מיוחד בה/בו?", placeholder: "הסבלנות, החיבוקים, הסיפורים..." },
        { id: "notes", type: "notes", count: 6, label: "פתקים מהילדים, מההורים או מהצוות", hint: "כל פתק עם שם. אפשר לשלוח עוד בהמשך." },
        { id: "memories", type: "list", count: 4, label: "רגעים מהשנה לאלבום", placeholder: "למשל: מסיבת חנוכה" },
        { id: "letter", type: "textarea", label: "מכתב התודה", placeholder: "על הסבלנות, החיבוקים והלב הענק..." },
      ],
    },
    {
      id: "family", icon: "home", label: "הורים ומשפחה", desc: "לאמא, לאבא, לסבא וסבתא",
      elements: ["envelope", "photos", "notes", "hold", "final"],
      fields: [
        { id: "relation", type: "chips", label: "למי?", required: true, options: ["אמא", "אבא", "סבא", "סבתא", "אח/ות", "כל המשפחה"] },
        { id: "occasion", type: "chips", label: "לכבוד מה?", options: ["יום הולדת", "יום האם / האב", "חג", "יום נישואין", "סתם כי בא לי"] },
        { id: "memories", type: "list", count: 4, label: "זיכרונות משפחתיים לאלבום", placeholder: "למשל: הטיול לאילת, 1998" },
        { id: "loves", type: "list", count: 3, label: "מה אתם הכי אוהבים בו/בה?", placeholder: "למשל: השניצלים של שישי" },
        { id: "letter", type: "textarea", label: "המכתב בסוף", placeholder: "מה שבא לכם להגיד" },
      ],
    },
    {
      id: "other", icon: "wand", label: "משהו אחר", desc: "יש לכם רעיון? בואו נבנה אותו",
      elements: ["envelope", "final"],
      fields: [
        { id: "occasion", type: "text", label: "לכבוד מה?", required: true, placeholder: "למשל: פרידה מעמית, ברית, קבלה לעבודה" },
        { id: "idea", type: "textarea", label: "ספרו לי על הרעיון", required: true, hint: "מה הייתם רוצים שיקרה כשהם פותחים את הקישור?", placeholder: "שיתחיל ב... ושבסוף..." },
        { id: "memories", type: "list", count: 3, label: "רגעים לאלבום (רשות)", placeholder: "כיתוב לתמונה" },
        { id: "letter", type: "textarea", label: "המכתב בסוף", placeholder: "מה שבא לכם להגיד" },
      ],
    },
  ],

  // מה אפשר להכניס להפתעה (בשלב העיצוב)
  elements: [
    { id: "envelope", icon: "envelope", label: "מעטפה עם חותם" },
    { id: "runaway", icon: "run-btn", label: "כפתור \"לא\" שבורח" },
    { id: "scratch", icon: "scratch", label: "כרטיס גירוד" },
    { id: "quiz", icon: "question", label: "טריוויה" },
    { id: "checklist", icon: "checklist", label: "רשימה לסימון" },
    { id: "photos", icon: "images", label: "אלבום פולרואיד" },
    { id: "countdown", icon: "hourglass", label: "ספירה לאחור" },
    { id: "hold", icon: "heart", label: "לב שמתמלא" },
    { id: "candles", icon: "candle", label: "נרות לכיבוי" },
    { id: "notes", icon: "note", label: "קיר פתקים" },
    { id: "final", icon: "ticket", label: "כרטיס / הזמנה בסוף" },
  ],

  tones: ["רומנטי", "מצחיק", "מרגש", "שובב", "אלגנטי", "קליל"],
  moods: [
    { id: "romantic", label: "רומנטית", icon: "hearts" },
    { id: "happy", label: "שמחה", icon: "party" },
    { id: "emotional", label: "מרגשת", icon: "star" },
    { id: "none", label: "בלי מוזיקה", icon: "volume-off" },
  ],
};
