/** Client-safe admin resource configurations. */

/** Admin permission modules — mirrors the server-side list in lib/auth.ts (keys must stay in sync). */
export const ADMIN_MODULES: { key: string; label: string }[] = [
  { key: "submissions", label: "منظوری مرکز و شیڈول" },
  { key: "content", label: "مواد (شاعری، مضامین، خبریں، کتب، شخصیات، مقابلے)" },
  { key: "newspaper", label: "اخبار، الفاظ، اشعار، بینرز" },
  { key: "homepage", label: "ہوم پیج مینجمنٹ" },
  { key: "appearance", label: "لوگو، فونٹس، ظاہری شکل" },
  { key: "settings", label: "سائٹ ترتیبات و SEO" },
  { key: "ads", label: "اشتہارات" },
  { key: "mail", label: "ای میل سینٹر" },
  { key: "engagement", label: "تبصرے و پسندیدگیاں" },
  { key: "tools", label: "قافیہ و بحریں" },
  { key: "users", label: "صارفین و مصنفین" },
  { key: "admins", label: "ایڈمنسٹریٹرز کا انتظام" },
  { key: "security", label: "سیکیورٹی، لاگز و بازیافت" },
];

export type FieldType =
  | "text" | "textarea" | "number" | "bool" | "date" | "select" | "image" | "pdf";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  hint?: string;
  full?: boolean;
};

export type ResourceConfig = {
  key: string;
  title: string;
  subtitle: string;
  fields: FieldDef[];
  columns: { key: string; label: string; type?: "text" | "image" | "badge" | "bool" }[];
  searchHint: string;
};

export const ADMIN_RESOURCES: Record<string, ResourceConfig> = {
  books: {
    key: "books", title: "کتب خانہ", subtitle: "ڈیجیٹل کتب کا انتظام",
    searchHint: "کتاب یا مصنف تلاش کریں…",
    fields: [
      { key: "title", label: "عنوان", type: "text" },
      { key: "author", label: "مصنف", type: "text" },
      { key: "translator", label: "مترجم", type: "text" },
      { key: "category", label: "شعبہ", type: "select", options: ["شاعری", "افسانہ", "ناول", "تحقیق", "تنقید", "تاریخ", "سوانح", "اسلامی ادب", "بچوں کا ادب", "زبان و قواعد", "دیگر"] },
      { key: "year", label: "سالِ اشاعت", type: "text" },
      { key: "pages", label: "صفحات", type: "text" },
      { key: "coverUrl", label: "سرورق", type: "image", hint: "سفارش: 600×900 پکسل (تناسب 2:3)" },
      { key: "description", label: "تعارف", type: "textarea", full: true },
      { key: "featured", label: "نمایاں کتاب (ہوم پیج پر ظاہر ہوگی)", type: "bool", full: true },
    ],
    columns: [
      { key: "coverUrl", label: "سرورق", type: "image" },
      { key: "title", label: "عنوان" },
      { key: "author", label: "مصنف" },
      { key: "category", label: "شعبہ" },
      { key: "featured", label: "نمایاں", type: "bool" },
    ],
  },
  poets: {
    key: "poets", title: "شعرا و ادبا", subtitle: "ادبی شخصیات کے پروفائلز",
    searchHint: "نام تلاش کریں…",
    fields: [
      { key: "name", label: "نام", type: "text" },
      { key: "takhallus", label: "تخلص", type: "text" },
      { key: "era", label: "دور", type: "text", hint: "مثلاً: 1797 – 1869" },
      { key: "photoUrl", label: "تصویر", type: "image", hint: "سفارش: 400×400 پکسل (مربع)" },
      { key: "bio", label: "تعارف", type: "textarea", full: true },
      { key: "style", label: "ادبی اسلوب", type: "textarea", full: true },
      { key: "works", label: "اہم تصانیف (ہر سطر پر ایک)", type: "textarea", full: true },
      { key: "awards", label: "اعزازات", type: "textarea", full: true },
      { key: "featured", label: "نمایاں شخصیت (ہوم پیج پر ظاہر ہوگی)", type: "bool", full: true },
    ],
    columns: [
      { key: "photoUrl", label: "تصویر", type: "image" },
      { key: "name", label: "نام" },
      { key: "takhallus", label: "تخلص" },
      { key: "era", label: "دور" },
      { key: "featured", label: "نمایاں", type: "bool" },
    ],
  },
  newspaper: {
    key: "newspaper", title: "ہفتہ وار اخبار", subtitle: "تیار شدہ شمارے صرف اپلوڈ کریں — ڈیزائن کی ضرورت نہیں",
    searchHint: "شمارہ تلاش کریں…",
    fields: [
      { key: "title", label: "شمارے کا عنوان", type: "text" },
      { key: "editionNumber", label: "شمارہ نمبر", type: "text" },
      { key: "weekLabel", label: "ہفتہ", type: "text", hint: "مثلاً: ہفتہ 42، 2026 — اس لیبل سے اس ہفتے کا شمارہ منتخب ہوتا ہے" },
      { key: "pdfUrl", label: "اخبار کی PDF فائل *", type: "pdf", hint: "سفارش: A4 سائز، مکمل شمارہ ایک فائل میں" },
      { key: "coverUrl", label: "پہلے صفحے کی تصویر", type: "image", hint: "سفارش: 600×848 پکسل (A4 تناسب)" },
      { key: "notes", label: "نوٹس (اختیاری)", type: "textarea", full: true },
      { key: "published", label: "شائع شدہ (قارئین کو نظر آئے گا)", type: "bool", full: true },
    ],
    columns: [
      { key: "coverUrl", label: "سرورق", type: "image" },
      { key: "title", label: "عنوان" },
      { key: "weekLabel", label: "ہفتہ" },
      { key: "editionNumber", label: "نمبر" },
      { key: "published", label: "شائع", type: "bool" },
    ],
  },
  words: {
    key: "words", title: "آج کا لفظ", subtitle: "ہوم پیج اور لغت کے لیے الفاظ",
    searchHint: "لفظ تلاش کریں…",
    fields: [
      { key: "word", label: "لفظ", type: "text" },
      { key: "meaning", label: "معنی", type: "text" },
      { key: "englishMeaning", label: "انگریزی معنی", type: "text" },
      { key: "synonyms", label: "مترادف (کاما لے کر الگ)", type: "text" },
      { key: "antonyms", label: "متضاد (کاما لے کر الگ)", type: "text" },
      { key: "example", label: "مثال جملہ", type: "textarea", full: true },
      { key: "usage", label: "ادبی استعمال / نوٹ", type: "textarea", full: true },
      { key: "active", label: "شائع کریں (آج کا لفظ بن جائے گا — آخری فعال لفظ ہوم پیج پر دکھے گا)", type: "bool", full: true },
    ],
    columns: [
      { key: "word", label: "لفظ" },
      { key: "meaning", label: "معنی" },
      { key: "active", label: "فعال", type: "bool" },
    ],
  },
  shers: {
    key: "shers", title: "آج کا شعر", subtitle: "روزانہ کا منتخب شعر",
    searchHint: "شعر تلاش کریں…",
    fields: [
      { key: "text", label: "شعر (دونوں مصرعے — درمیان میں انٹر)", type: "textarea", full: true },
      { key: "poetName", label: "شاعر", type: "text" },
      { key: "active", label: "شائع کریں (آخری فعال شعر ہوم پیج پر دکھے گا)", type: "bool", full: true },
    ],
    columns: [
      { key: "text", label: "شعر" },
      { key: "poetName", label: "شاعر" },
      { key: "active", label: "فعال", type: "bool" },
    ],
  },
  competitions: {
    key: "competitions", title: "ادبی مقابلے", subtitle: "مقابلے اور ان کے پوسٹرز",
    searchHint: "مقابلہ تلاش کریں…",
    fields: [
      { key: "title", label: "مقابلے کا عنوان", type: "text" },
      { key: "description", label: "تفصیل", type: "textarea", full: true },
      { key: "rules", label: "شرائط", type: "textarea", full: true },
      { key: "startDate", label: "آغاز کی تاریخ", type: "date" },
      { key: "endDate", label: "آخری تاریخ", type: "date" },
      { key: "posterUrl", label: "پوسٹر", type: "image", hint: "سفارش: A4 عمودی 2480×3508 پکسل (300 DPI) — تناسب 5:7" },
      { key: "posterSize", label: "پوسٹر سائز ہدایت", type: "text" },
      { key: "resultNote", label: "نتیجہ اعلان (اختیاری)", type: "textarea", full: true },
      { key: "active", label: "جاری رکھیں (ہوم پیج پر ظاہر ہوگا)", type: "bool", full: true },
    ],
    columns: [
      { key: "posterUrl", label: "پوسٹر", type: "image" },
      { key: "title", label: "عنوان" },
      { key: "endDate", label: "آخری تاریخ", type: "badge" },
      { key: "active", label: "جاری", type: "bool" },
    ],
  },
  events: {
    key: "events", title: "ادبی تقریبات", subtitle: "مشاعرے، سیمینار اور کتاب رونمائی",
    searchHint: "تقریب تلاش کریں…",
    fields: [
      { key: "title", label: "تقریب کا عنوان", type: "text" },
      { key: "eventType", label: "قسم", type: "select", options: ["مشاعرہ", "سیمینار", "ورکشاپ", "کتاب رونمائی", "ادبی نشست", "آن لائن پروگرام"] },
      { key: "description", label: "تفصیل", type: "textarea", full: true },
      { key: "date", label: "تاریخ", type: "date" },
      { key: "time", label: "وقت", type: "text", hint: "مثلاً: شام 6 بجے" },
      { key: "venue", label: "مقام", type: "text" },
      { key: "posterUrl", label: "پوسٹر", type: "image", hint: "سفارش: A4 زمینی 3508×2480 پکسل (300 DPI) — تناسب 7:5" },
      { key: "posterSize", label: "پوسٹر سائز ہدایت", type: "text" },
    ],
    columns: [
      { key: "posterUrl", label: "پوسٹر", type: "image" },
      { key: "title", label: "عنوان" },
      { key: "eventType", label: "قسم" },
      { key: "venue", label: "مقام" },
    ],
  },
  banners: {
    key: "banners", title: "ہوم پیج بینرز", subtitle: "ہیرو امیج، سائیڈ بینرز اور اشتہاری جگہ",
    searchHint: "بینر تلاش کریں…",
    fields: [
      { key: "title", label: "بینر کا نام", type: "text" },
      { key: "position", label: "مقام", type: "select", options: ["HERO", "SIDE"], hint: "HERO = ہوم پیج کا اوپر والا ہیرو پس منظر، SIDE = سائیڈ اشتہاری کالم" },
      { key: "imageUrl", label: "تصویر", type: "image", hint: "HERO: 1920×640 پکسل (3:1) · SIDE: 600×800 پکسل (3:4) — موبائل پر خودکار فٹ ہوں گے" },
      { key: "linkUrl", label: "لنک (اختیاری)", type: "text" },
      { key: "recommendedSize", label: "سائز کی ہدایت", type: "text" },
      { key: "sortOrder", label: "ترتیب (چھوٹا نمبر پہلے)", type: "number" },
      { key: "active", label: "فعال", type: "bool", full: true },
    ],
    columns: [
      { key: "imageUrl", label: "تصویر", type: "image" },
      { key: "title", label: "نام" },
      { key: "position", label: "مقام", type: "badge" },
      { key: "sortOrder", label: "ترتیب" },
      { key: "active", label: "فعال", type: "bool" },
    ],
  },
  qafiya: {
    key: "qafiya", title: "قافیہ مینجمنٹ", subtitle: "قافیوں کے گروہ — عوامی قافیہ اوزار میں دستیاب",
    searchHint: "قافیہ تلاش کریں…",
    fields: [
      { key: "word", label: "بنیادی قافیہ / گروہ", type: "text" },
      { key: "pattern", label: "قافیے کا سانچہ (آخری حروف)", type: "text", hint: "مثلاً: انی، ار، ام" },
      { key: "meaning", label: "معنی / نوٹ", type: "text" },
      { key: "rhymes", label: "قافیے کے الفاظ (ہر سطر پر ایک لفظ)", type: "textarea", full: true, hint: "مثلاً پانی کے گروہ میں: کہانی، ثمانی، نشانی…" },
      { key: "notes", label: "اضافی نوٹ", type: "textarea", full: true },
    ],
    columns: [
      { key: "word", label: "گروہ" },
      { key: "pattern", label: "سانچہ" },
      { key: "rhymes", label: "الفاظ" },
    ],
  },
  behrs: {
    key: "behrs", title: "بحریں و ارکان", subtitle: "تقطیع اوزار کا حوالہ ڈیٹا",
    searchHint: "بحر تلاش کریں…",
    fields: [
      { key: "name", label: "بحر کا نام", type: "text" },
      { key: "nameEn", label: "انگریزی نام", type: "text" },
      { key: "arkan", label: "ارکان", type: "text" },
      { key: "pattern", label: "سانچہ (S/L میں، مثلاً SLLLSLLLSLL)", type: "text", hint: "S = کوتاہ، L = بلند — یہ سانچہ تقطیع انجن میں استعمال ہوگا" },
      { key: "example", label: "نمونہ مصرع", type: "textarea", full: true },
      { key: "notes", label: "واقعات و تفصیل", type: "textarea", full: true },
    ],
    columns: [
      { key: "name", label: "بحر" },
      { key: "arkan", label: "ارکان" },
      { key: "pattern", label: "سانچہ" },
    ],
  },
  users: {
    key: "users", title: "صارفین", subtitle: "رجسٹرڈ ممبران کا انتظام",
    searchHint: "نام یا ای میل تلاش کریں…",
    fields: [
      { key: "name", label: "نام", type: "text" },
      { key: "penName", label: "قلمی نام", type: "text" },
      { key: "bio", label: "تعارف", type: "textarea", full: true },
      { key: "photoUrl", label: "تصویر", type: "image", hint: "سفارش: 400×400 پکسل" },
      { key: "role", label: "کردار", type: "select", options: ["USER", "ADMIN"] },
      { key: "status", label: "حالت", type: "select", options: ["ACTIVE", "SUSPENDED"] },
    ],
    columns: [
      { key: "photoUrl", label: "تصویر", type: "image" },
      { key: "name", label: "نام" },
      { key: "penName", label: "قلمی نام" },
      { key: "role", label: "کردار", type: "badge" },
      { key: "status", label: "حالت", type: "badge" },
    ],
  },
};

export const SPECIAL_RESOURCES: Record<string, ResourceConfig & { api: "poems" | "articles" | "news" }> = {
  news: {
    key: "news", api: "news",
    title: "ادبی خبریں", subtitle: "ادبی خبریں اور اعلانات — منظوری اور اشاعت کا کنٹرول",
    searchHint: "خبر تلاش کریں…",
    fields: [
      { key: "title", label: "سرخی", type: "text" },
      { key: "sourceName", label: "ذرائع / سیکشن", type: "text" },
      { key: "category", label: "قسم", type: "select", options: ["ادبی خبریں", "تازہ اعلانات", "اعزازات", "کتاب رونمائی", "مشاعرہ"] },
      { key: "status", label: "حالت", type: "select", options: ["DRAFT", "PENDING", "REVISION", "APPROVED", "PUBLISHED", "REJECTED", "SCHEDULED", "ARCHIVED"] },
      { key: "publishAt", label: "شیڈول کا وقت (SCHEDULED کے لیے)", type: "date", hint: "مقررہ وقت پر خودکار شائع ہو جائے گا" },
      { key: "featured", label: "نمایاں (ہوم پیج پر ظاہر ہوگی)", type: "bool", full: true },
      { key: "excerpt", label: "خلاصہ", type: "textarea", full: true },
      { key: "content", label: "مکمل خبر", type: "textarea", full: true },
      { key: "feedback", label: "ادارتی رائے", type: "textarea", full: true },
      { key: "tags", label: "ٹیگز", type: "text" },
      { key: "coverUrl", label: "تصویر", type: "image", hint: "سفارش: 1200×675 پکسل (16:9)" },
      { key: "topicImageUrl", label: "موضوع کی تصویر", type: "image", hint: "سفارش: 1200×675 پکسل" },
    ],
    columns: [
      { key: "coverUrl", label: "تصویر", type: "image" },
      { key: "title", label: "سرخی" },
      { key: "sourceName", label: "ذرائع" },
      { key: "status", label: "حالت", type: "badge" },
      { key: "featured", label: "نمایاں", type: "bool" },
    ],
  },
  poems: {
    key: "poems", api: "poems",
    title: "شاعری", subtitle: "تمام شاعری — منظوری، اصلاح اور اشاعت کا کنٹرول",
    searchHint: "شعر یا شاعر تلاش کریں…",
    fields: [
      { key: "title", label: "عنوان", type: "text" },
      { key: "poetName", label: "شاعر / تخلص", type: "text" },
      { key: "category", label: "صنف", type: "select", options: ["غزل", "نظم", "رباعی", "قطعہ", "مرثیہ", "حمد", "نعت", "منقبت", "سلام", "صوفی شاعری", "عشقیہ شاعری", "سماجی شاعری", "قومی شاعری"] },
      { key: "status", label: "حالت", type: "select", options: ["DRAFT", "PENDING", "REVISION", "APPROVED", "PUBLISHED", "REJECTED", "SCHEDULED", "ARCHIVED"] },
      { key: "publishAt", label: "شیڈول کا وقت (SCHEDULED کے لیے)", type: "date", hint: "مقررہ وقت پر خودکار شائع ہو جائے گا" },
      { key: "featured", label: "نمایاں (ہوم پیج پر آدھا پیش منظر)", type: "bool", full: true },
      { key: "content", label: "مکمل کلام", type: "textarea", full: true },
      { key: "feedback", label: "ادارتی رائے (مصنف کو نظر آئے گی)", type: "textarea", full: true },
      { key: "tags", label: "ٹیگز", type: "text" },
      { key: "coverUrl", label: "شاعر کی تصویر", type: "image", hint: "سفارش: 600×400 پکسل" },
      { key: "topicImageUrl", label: "موضوع کی تصویر", type: "image", hint: "سفارش: 1200×700 پکسل" },
    ],
    columns: [
      { key: "title", label: "عنوان" },
      { key: "poetName", label: "شاعر" },
      { key: "category", label: "صنف" },
      { key: "status", label: "حالت", type: "badge" },
      { key: "featured", label: "نمایاں", type: "bool" },
    ],
  },
  articles: {
    key: "articles", api: "articles",
    title: "مضامین", subtitle: "تمام مضامین — منظوری، اصلاح اور اشاعت کا کنٹرول",
    searchHint: "مضمون تلاش کریں…",
    fields: [
      { key: "title", label: "عنوان", type: "text" },
      { key: "authorName", label: "مصنف", type: "text" },
      { key: "category", label: "صنف", type: "select", options: ["ادبی مضامین", "تحقیقی مضامین", "تنقید", "تاریخ ادب", "زبان و ادب", "تہذیب و ثقافت", "ادبی شخصیات", "کتابوں پر تبصرے", "موجودہ ادبی مسائل"] },
      { key: "status", label: "حالت", type: "select", options: ["DRAFT", "PENDING", "REVISION", "APPROVED", "PUBLISHED", "REJECTED", "SCHEDULED", "ARCHIVED"] },
      { key: "publishAt", label: "شیڈول کا وقت (SCHEDULED کے لیے)", type: "date", hint: "مقررہ وقت پر خودکار شائع ہو جائے گا" },
      { key: "featured", label: "نمایاں (ہوم پیج پر آدھا پیش منظر)", type: "bool", full: true },
      { key: "excerpt", label: "خلاصہ", type: "textarea", full: true },
      { key: "content", label: "مکمل تحریر", type: "textarea", full: true },
      { key: "feedback", label: "ادارتی رائے (مصنف کو نظر آئے گی)", type: "textarea", full: true },
      { key: "tags", label: "ٹیگز", type: "text" },
      { key: "coverUrl", label: "مصنف کی تصویر", type: "image", hint: "سفارش: 600×400 پکسل" },
      { key: "topicImageUrl", label: "موضوع کی تصویر", type: "image", hint: "سفارش: 1200×700 پکسل" },
    ],
    columns: [
      { key: "title", label: "عنوان" },
      { key: "authorName", label: "مصنف" },
      { key: "category", label: "صنف" },
      { key: "status", label: "حالت", type: "badge" },
      { key: "featured", label: "نمایاں", type: "bool" },
    ],
  },
};

export const STATUS_URDU_ADMIN: Record<string, string> = {
  DRAFT: "مسودہ", PENDING: "زیرِ جائزہ", REVISION: "اصلاح مطلوب",
  APPROVED: "منظور شدہ", PUBLISHED: "شائع شدہ", REJECTED: "مسترد",
  SCHEDULED: "شیڈول شدہ", ARCHIVED: "آرکائیو",
};
