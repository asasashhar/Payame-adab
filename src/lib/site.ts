import { db } from "@/lib/db";

export const SITE_DEFAULTS = {
  siteName: "پیامِ ادب",
  siteNameEn: "Payam-e-Adab",
  tagline: "اردو ادب، روایت سے نئی نسل تک",
  heroTitle: "اردو ادب کا ڈیجیٹل سرمایہ",
  heroSubtitle:
    "اردو زبان و ادب کے فروغ، تحفظ، اشاعت اور نئی نسل تک رسائی کا ایک جدید پلیٹ فارم۔",
  contactEmail: "payameadab@gmail.com",
  contactPhone: "9199258187",
  aboutText:
    "پیامِ ادب اردو زبان و ادب کے فروغ، تحفظ اور ڈیجیٹل اشاعت کے لیے وقف ایک ادبی ادارہ ہے۔ ہمارا مقصد کلاسیکی اور معاصر اردو ادب کو نئی نسل تک پہنچانا، نئے لکھنے والوں کو ایک معیاری پلیٹ فارم فراہم کرنا اور اردو ادب کا ڈیجیٹل سرمایہ تیار کرنا ہے۔",
  submissionGuidelines:
    "اپنی تحریر بھیجنے سے پہلے یہ باتیں ذہن میں رکھیں: تحریر اصل ہونی چاہیے، کسی اور کی تحریر نقل نہ ہو۔ شاعری میں قافیے اور وزن کا خیال رکھیں۔ مضامین میں حوالہ جات درج کریں۔ تمام تحریریں ادارتی معائنے کے بعد شائع ہوتی ہیں۔",
  footerNote: "© پیامِ ادب — تمام حقوق محفوظ ہیں",
};

export const POEM_CATEGORIES = [
  "غزل", "نظم", "رباعی", "قطعہ", "مرثیہ", "حمد", "نعت", "منقبت",
  "سلام", "صوفی شاعری", "عشقیہ شاعری", "سماجی شاعری", "قومی شاعری",
];

export const ARTICLE_CATEGORIES = [
  "ادبی مضامین", "تحقیقی مضامین", "تنقید", "تاریخ ادب", "زبان و ادب",
  "تہذیب و ثقافت", "ادبی شخصیات", "کتابوں پر تبصرے", "موجودہ ادبی مسائل",
];

export const BOOK_CATEGORIES = [
  "شاعری", "افسانہ", "ناول", "تحقیق", "تنقید", "تاریخ", "سوانح",
  "اسلامی ادب", "بچوں کا ادب", "زبان و قواعد", "دیگر",
];

export const STATUS_URDU: Record<string, string> = {
  DRAFT: "مسودہ",
  PENDING: "زیرِ جائزہ",
  REVISION: "اصلاح مطلوب",
  APPROVED: "منظور شدہ",
  PUBLISHED: "شائع شدہ",
  REJECTED: "مسترد",
  SCHEDULED: "شیڈول شدہ",
  ARCHIVED: "آرکائیو",
};

/** Extra (non-brand) setting keys managed from the admin dashboard. */
export const EXTENDED_SETTING_DEFAULTS: Record<string, string> = {
  // branding
  logoUrl: "/brand/logo-badge.png",
  logoHorizontalUrl: "/brand/logo-horizontal.png",
  heroImage: "/brand/hero-emblem.jpg",
  heroBadge: "پیامِ ادب · Payam-e-Adab",
  // appearance
  themePreset: "emerald",
  fontBody: "jameel-noori-nastaleeq",
  fontHeading: "jameel-noori-nastaleeq",
  fontBodySize: "17",
  fontHeadingSize: "30",
  fontLineHeight: "230",
  // custom colors (empty = use the selected theme preset values)
  colorPrimary: "",
  colorGold: "",
  colorBackground: "",
  colorForeground: "",
  // editable email templates — empty = built-in Urdu template
  // placeholders: [مصنف کا نام] [تحریر کا عنوان] [سائٹ کا نام] [لنک] [وجہ] [تجاویز]
  mailTpl_PUBLISHED_subject: "",
  mailTpl_PUBLISHED_body: "",
  mailTpl_APPROVED_subject: "",
  mailTpl_APPROVED_body: "",
  mailTpl_REJECTED_subject: "",
  mailTpl_REJECTED_body: "",
  mailTpl_REVISION_subject: "",
  mailTpl_REVISION_body: "",
  mailTpl_PENDING_subject: "",
  mailTpl_PENDING_body: "",
  mailTpl_VERIFY_subject: "",
  mailTpl_VERIFY_body: "",
  mailTpl_RESET_subject: "",
  mailTpl_RESET_body: "",
  // watermark
  watermarkEnabled: "1",
  watermarkOpacity: "6",
  watermarkSize: "340",
  watermarkPosition: "center",
  watermarkTypes: JSON.stringify(["poem", "article", "book", "news"]),
  // features
  showViewCounts: "1",
  showLikeCounts: "1",
  commentsEnabled: "1",
  commentsGuests: "1",
  likesEnabled: "1",
  likesGuests: "1",
  // homepage
  homeSections: JSON.stringify([
    { key: "hero", label: "ہیرو سیکشن", visible: true },
    { key: "poets", label: "نمایاں شعرا و ادبا", visible: true },
    { key: "sherWord", label: "آج کا شعر و آج کا لفظ", visible: true },
    { key: "latestPoems", label: "تازہ شاعری", visible: true },
    { key: "latestArticles", label: "تازہ مضامین", visible: true },
    { key: "news", label: "ادبی خبریں", visible: true },
    { key: "booksPopular", label: "نئی کتب و مقبول تحریریں", visible: true },
    { key: "newspaper", label: "ڈیجیٹل اخبار", visible: true },
    { key: "competitions", label: "ادبی مقابلے", visible: true },
  ]),
  // site url (used in email links) + owner
  siteUrl: "",
  ownerEmail: "mdnematullah1343@gmail.com",
  // e-mail notifications (SMTP) — leave smtpHost empty to queue without sending
  mailEnabled: "1",
  smtpHost: "",
  smtpPort: "587",
  smtpSecure: "0",
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "پیامِ ادب <payameadab@gmail.com>",
  requireEmailVerification: "1",
  // global typography scale in percent (100 = base size, 112 = slightly larger)
  fontScale: "112",
  // side advertisements
  adsMaxWidth: "300",
  // admin-manageable categories
  poemCategories: "غزل,نظم,رباعی,قطعہ,مرثیہ,حمد,نعت,منقبت,سلام,صوفی شاعری,عشقیہ شاعری,سماجی شاعری,قومی شاعری",
  articleCategories: "ادبی مضامین,تحقیقی مضامین,تنقید,تاریخ ادب,زبان و ادب,تہذیب و ثقافت,ادبی شخصیات,کتابوں پر تبصرے,موجودہ ادبی مسائل",
  bookCategories: "شاعری,افسانہ,ناول,تحقیق,تنقید,تاریخ,سوانح,اسلامی ادب,بچوں کا ادب,زبان و قواعد,دیگر",
  newsCategories: "ادبی خبریں,تازہ اعلانات,اعزازات,کتاب رونمائی,مشاعرہ",
  // SEO
  seoTitle: "پیامِ ادب — اردو ادب، روایت سے نئی نسل تک",
  seoDescription: "پیامِ ادب: اردو زبان و ادب کے فروغ، تحفظ اور ڈیجیٹل اشاعت کا جدید پلیٹ فارم — شاعری، مضامین، کتب خانہ، ڈیجیٹل اخبار، ادبی خبریں، قافیہ اور تقطیع کے اوزار۔",
  seoKeywords: "پیامِ ادب,اردو ادب,اردو شاعری,غزل,کتب خانہ,اردو اخبار,ادبی خبریں,Payam-e-Adab,Urdu literature",
  // social + navigation (JSON or empty for defaults)
  socialLinks: "[]",
  navLinks: "",
  footerLinks: "",
};

/** Every admin-writable setting key (brand + extended). */
export const ALL_SETTING_KEYS: string[] = [
  ...Object.keys(SITE_DEFAULTS),
  ...Object.keys(EXTENDED_SETTING_DEFAULTS),
];

export type WatermarkConfig = {
  enabled: boolean;
  opacity: number; // percent 0..100
  size: number; // px
  position: "center" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
  types: string[]; // poem | article | book | news
};

export function watermarkFromSettings(s: Record<string, string>): WatermarkConfig {
  let types: string[] = ["poem", "article", "book", "news"];
  try {
    const parsed = JSON.parse(s.watermarkTypes ?? "[]");
    if (Array.isArray(parsed) && parsed.length) types = parsed.map(String);
  } catch { /* keep defaults */ }
  const allowed = ["center", "top-start", "top-end", "bottom-start", "bottom-end"];
  const position = allowed.includes(s.watermarkPosition) ? s.watermarkPosition : "center";
  return {
    enabled: s.watermarkEnabled !== "0",
    opacity: Math.min(30, Math.max(1, Number(s.watermarkOpacity ?? 6) || 6)),
    size: Math.min(720, Math.max(120, Number(s.watermarkSize ?? 340) || 340)),
    position: position as WatermarkConfig["position"],
    types,
  };
}

export function homeSectionsFromSettings(s: Record<string, string>): { key: string; label: string; visible: boolean }[] {
  try {
    const parsed = JSON.parse(s.homeSections ?? "[]");
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch { /* fallback */ }
  try {
    return JSON.parse(EXTENDED_SETTING_DEFAULTS.homeSections);
  } catch {
    return [];
  }
}

export function csvCategories(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  const list = value.split(",").map((x) => x.trim()).filter(Boolean);
  return list.length ? list : fallback;
}

export type ThemePreset = "emerald" | "navy" | "maroon";

export const THEME_PRESETS: Record<ThemePreset, { label: string; vars: Record<string, string> }> = {
  emerald: {
    label: "زمرد و سنہری (موجود)",
    vars: {
      "--primary": "#0e5b43",
      "--emerald-deep": "#0e5b43",
      "--emerald-ink": "#0a3f2f",
      "--sidebar": "#0e5b43",
      "--sidebar-accent": "#0a3f2f",
      "--sidebar-border": "#0a3f2f",
      "--gold": "#b8922e",
      "--gold-soft": "#d9bc6a",
    },
  },
  navy: {
    label: "نیلا سنہری (برانڈ لاگو کے مطابق)",
    vars: {
      "--primary": "#122a5c",
      "--emerald-deep": "#122a5c",
      "--emerald-ink": "#0c1d42",
      "--sidebar": "#122a5c",
      "--sidebar-accent": "#0c1d42",
      "--sidebar-border": "#0c1d42",
      "--gold": "#b8922e",
      "--gold-soft": "#d9bc6a",
    },
  },
  maroon: {
    label: "عنابی سنہری",
    vars: {
      "--primary": "#6d1f2c",
      "--emerald-deep": "#6d1f2c",
      "--emerald-ink": "#4d1420",
      "--sidebar": "#6d1f2c",
      "--sidebar-accent": "#4d1420",
      "--sidebar-border": "#4d1420",
      "--gold": "#b8922e",
      "--gold-soft": "#d9bc6a",
    },
  },
};

export async function getSettings(): Promise<Record<string, string>> {
  const map: Record<string, string> = {
    ...SITE_DEFAULTS,
    ...EXTENDED_SETTING_DEFAULTS,
  };
  try {
    const rows = await db.setting.findMany();
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return map;
  }
}

/**
 * Publishes any scheduled content whose time has arrived.
 * Called from high-traffic server loads (homepage, admin dashboard) and the
 * view-tracking API so scheduled posts go live without external cron.
 */
export async function publishDueSchedules(): Promise<number> {
  try {
    const now = new Date();
    let total = 0;
    for (const delegate of [db.poem, db.article, db.news]) {
      const due = await (delegate as { findMany: (a: unknown) => Promise<{ id: string }[]> }).findMany({
        where: { status: "SCHEDULED", publishAt: { lte: now } },
        select: { id: true },
      });
      if (!due.length) continue;
       
      const d = delegate as any;
      await d.updateMany({
        where: { id: { in: due.map((x) => x.id) } },
        data: { status: "PUBLISHED", publishedAt: now },
      });
      total += due.length;
    }
    return total;
  } catch {
    return 0;
  }
}
