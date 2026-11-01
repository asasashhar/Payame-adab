/**
 * Payam-e-Adab — UPGRADE seed (v2)
 * - Registers the three authorized administrator accounts (initial password: darulhuda)
 *   and fixes the email typo of the previous admin (mdnematulah -> mdnematullah).
 * - Installs the new setting defaults (fonts, watermark, homepage, features, SEO, theme).
 * - Seeds literary news items.
 * Idempotent — safe to run repeatedly.
 */
const { PrismaClient } = require("@prisma/client");
const { scryptSync, randomBytes } = require("crypto");
const db = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ADMINS = [
  { email: "mdnematullah1343@gmail.com", name: "محمد نعمت اللہ" },
  { email: "sadaemaqbul@gmail.com", name: "صدائے اقبال" },
  { email: "payameadab@gmail.com", name: "پیامِ ادب" },
];

const HOME_SECTIONS = [
  { key: "hero", label: "ہیرو سیکشن", visible: true },
  { key: "poets", label: "نمایاں شعرا و ادبا", visible: true },
  { key: "sherWord", label: "آج کا شعر و آج کا لفظ", visible: true },
  { key: "latestPoems", label: "تازہ شاعری", visible: true },
  { key: "latestArticles", label: "تازہ مضامین", visible: true },
  { key: "news", label: "ادبی خبریں", visible: true },
  { key: "booksPopular", label: "نئی کتب و مقبول تحریریں", visible: true },
  { key: "newspaper", label: "ڈیجیٹل اخبار", visible: true },
  { key: "competitions", label: "ادبی مقابلے", visible: true },
];

const SETTINGS = {
  // branding
  logoUrl: "/brand/logo-badge.png",
  logoHorizontalUrl: "/brand/logo-horizontal.png",
  heroImage: "/brand/hero-emblem.jpg",
  heroBadge: "پیامِ ادب · Payam-e-Adab",
  contactEmail: "payameadab@gmail.com",
  // appearance
  themePreset: "emerald",
  fontBody: "jameel-noori-nastaleeq",
  fontHeading: "jameel-noori-nastaleeq",
  fontBodySize: "17",
  fontHeadingSize: "30",
  fontLineHeight: "230",
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
  homeSections: JSON.stringify(HOME_SECTIONS),
  // categories (admin-manageable)
  poemCategories: "غزل,نظم,رباعی,قطعہ,مرثیہ,حمد,نعت,منقبت,سلام,صوفی شاعری,عشقیہ شاعری,سماجی شاعری,قومی شاعری",
  articleCategories: "ادبی مضامین,تحقیقی مضامین,تنقید,تاریخ ادب,زبان و ادب,تہذیب و ثقافت,ادبی شخصیات,کتابوں پر تبصرے,موجودہ ادبی مسائل",
  bookCategories: "شاعری,افسانہ,ناول,تحقیق,تنقید,تاریخ,سوانح,اسلامی ادب,بچوں کا ادب,زبان و قواعد,دیگر",
  newsCategories: "ادبی خبریں,تازہ اعلانات,اعزازات,کتاب رونمائی,مشاعرہ",
  // SEO
  seoTitle: "پیامِ ادب — اردو ادب، روایت سے نئی نسل تک",
  seoDescription: "پیامِ ادب: اردو زبان و ادب کے فروغ، تحفظ اور ڈیجیٹل اشاعت کا جدید پلیٹ فارم — شاعری، مضامین، کتب خانہ، ڈیجیٹل اخبار، ادبی خبریں، قافیہ اور تقطیع کے اوزار۔",
  seoKeywords: "پیامِ ادب,اردو ادب,اردو شاعری,غزل,کتب خانہ,اردو اخبار,ادبی خبریں,Payam-e-Adab,Urdu literature",
  // social
  socialLinks: JSON.stringify([]),
  // navigation (empty = use built-in defaults)
  navLinks: "",
  footerLinks: "",
};

const NEWS = [
  {
    title: "پیامِ ادب کا ڈیجیٹل پلیٹ فارم جاری — اردو ادب اب نئی نسل تک ایک کلک کے فاصلے پر",
    excerpt: "اردو زبان و ادب کے فروغ کے لیے وقف ادبی ادارہ پیامِ ادب کا مکمل ڈیجیٹل پلیٹ فارم جاری ہو گیا ہے جس میں شاعری، مضامین، کتب خانہ اور ہفتہ وار ڈیجیٹل اخبار شامل ہیں۔",
    content: "اردو زبان و ادب کی ڈیجیٹل اشاعت کے سلسلے میں ایک اہم اضافہ ہوا ہے۔ پیامِ ادب کا نئ پلیٹ فارم قارئین کے لیے دستیاب ہے جس میں کلاسیکی اور معاصر شاعری کا وسیع ذخیرہ، ادبی و تحقیقی مضامین، ڈیجیٹل کتب خانہ اور ہفتہ وار ادبی اخبار شامل ہیں۔\n\nپلیٹ فارم پر نئے لکھنے والے اپنی تحریریں بھیج سکتے ہیں جو ادارتی معائنے کے بعد شائع کی جاتی ہیں۔ قافیہ تلاش اور تقطیع جیسے اوزار طلبہ اور شعرا کے لیے خصوصی طور پر تیار کیے گئے ہیں۔\n\nادارے کا مقصد اردو ادب کا ڈیجیٹل سرمایہ تیار کرنا اور اسے نئی نسل تک پہنچانا ہے۔ تمام خدمات مفت دستیاب ہیں۔",
    sourceName: "ادارتی خبر",
    status: "PUBLISHED",
    featured: true,
  },
  {
    title: "نئے ادبی مقابلے کا اعلان — غزل اور نظم کے باب میں تحریریں موصول ہوں گی",
    excerpt: "پیامِ ادب کی جانب سے نئے ادبی مقابلے کا اعلان کیا گیا ہے۔ شرکا اپنی غزلیں اور نظمیں آن لائن جمع کروا سکتے ہیں۔",
    content: "پیامِ ادب نے نئے ادبی مقابلے کا اعلان کر دیا ہے۔ مقابلے میں غزل اور نظم کی اصناف شامل ہیں۔ تمام شرکا کو مشروط ہے کہ وہ اپنی اصل تحریریں پلیٹ فارم کے ذریعے جمع کروائیں۔\n\nمنتخب تحریریں ہفتہ وار اخبار اور اصلی ویب سائٹ پر شائع کی جائیں گی اور نمایاں شرکا کو اعزازی اسناد دی جائے گی۔\n\nشرائط میں وزن اور قافیے کی پابندی، اصل تحریر اور ادارتی معائنہ شامل ہے۔",
    sourceName: "اعلانات",
    status: "PUBLISHED",
  },
  {
    title: "اردو کتب خانہ میں اضافہ — کلاسیکی اور معاصر تصانیف ڈیجیٹل قارئین کے لیے دستیاب",
    excerpt: "کتب خانہ سیکشن میں نئی کلاسیکی اور معاصر تصانیف شامل کی گئی ہیں۔ قارئین مفت مطالعہ کر سکتے ہیں۔",
    content: "پیامِ ادب کے ڈیجیٹل کتب خانے میں اردو ادب کی نمایاں تصانیف کا اضافہ جاری ہے۔ شاعری، افسانہ، تحقیق اور تنقید کے اہم شعبوں کی کتب شامل کی جا رہی ہیں۔\n\nہر کتاب کے ساتھ مصنف کا تعارف، سنِ اشاعت اور موضوع کی تفصیل بھی فراہم کی جاتی ہے تاکہ طلبہ اور محققین کے لیے حوالہ کا کام آسان ہو سکے۔\n\nقارئین اپنی تجاویز بھی بھیج سکتے ہیں کہ کس کتاب کو کتب خانے میں شامل کیا جائے۔",
    sourceName: "ادارتی خبر",
    status: "PUBLISHED",
  },
  {
    title: "آج کا لفظ اور قافیہ تلاش کے نئے اوزار — طلبہ کے لیے خصوصی سہولت",
    excerpt: "لغت کے ساتھ روزانہ کا نیا لفظ اور قافیوں کا تفصیلی ذخیرہ اب ویب سائٹ پر دستیاب ہے۔",
    content: "پیامِ ادب نے اردو زبان سیکھنے والے طلبہ کے لیے روزانہ کا نیا لفظ، اس کے معنی، مترادف، متضاد اور مثالی جملے شائع کرنے کا آغاز کیا ہے۔\n\nاس کے علاوہ قافیہ تلاش کا اوزار بھی موجود ہے جس میں سیکڑوں قافیوں کے گروہ ترتیب دیے گئے ہیں۔ شعرا اپنے کلام میں قافیوں کی مناسب انتخاب کے لیے اس کا استعمال کر سکتے ہیں۔\n\nتقطیع کا اوزار عروض کی مشق کے لیے مہیا کیا گیا ہے جو مصرعے کے ارکان اور بحر خودکار طور پر بتاتا ہے۔",
    sourceName: "ادارتی خبر",
    status: "PUBLISHED",
  },
];

async function main() {
  console.log("=== Payam-e-Adab upgrade seed ===");

  // 1) fix old admin email (typo) -> authorized spelling, reset to initial password
  const oldAdmin = await db.user.findUnique({ where: { email: "mdnematulah1343@gmail.com" } });
  const newAdmin = await db.user.findUnique({ where: { email: "mdnematullah1343@gmail.com" } });
  if (oldAdmin && newAdmin && oldAdmin.id !== newAdmin.id) {
    // transfer content ownership then remove the typo'd duplicate
    await db.poem.updateMany({ where: { userId: oldAdmin.id }, data: { userId: newAdmin.id } });
    await db.article.updateMany({ where: { userId: oldAdmin.id }, data: { userId: newAdmin.id } });
    await db.news.updateMany({ where: { userId: oldAdmin.id }, data: { userId: newAdmin.id } });
    await db.user.delete({ where: { id: oldAdmin.id } });
    console.log("old typo'd admin merged into mdnematullah1343");
  }
  if (newAdmin) {
    await db.user.update({
      where: { id: newAdmin.id },
      data: {
        passwordHash: hashPassword("darulhuda"),
        mustChangePassword: true,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("admin password reset to initial:", "mdnematullah1343@gmail.com");
  } else if (oldAdmin) {
    await db.user.update({
      where: { id: oldAdmin.id },
      data: {
        email: "mdnematullah1343@gmail.com",
        passwordHash: hashPassword("darulhuda"),
        mustChangePassword: true,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("admin email fixed: mdnematulah1343 -> mdnematullah1343 (password reset to initial)");
  }

  // 2) ensure the three authorized admins
  for (const a of ADMINS) {
    const existing = await db.user.findUnique({ where: { email: a.email } });
    if (existing) {
      await db.user.update({
        where: { email: a.email },
        data: { role: "ADMIN", status: "ACTIVE", name: a.name },
      });
      console.log("admin ensured:", a.email);
    } else {
      await db.user.create({
        data: {
          email: a.email,
          name: a.name,
          passwordHash: hashPassword("darulhuda"),
          role: "ADMIN",
          status: "ACTIVE",
          mustChangePassword: true,
        },
      });
      console.log("admin created:", a.email);
    }
  }

  // active admin cap note: 3 active of max 5
  const adminCount = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
  console.log("active admins:", adminCount, "(max 5)");

  // 3) settings
  for (const [key, value] of Object.entries(SETTINGS)) {
    const exists = await db.setting.findUnique({ where: { key } });
    if (!exists) await db.setting.create({ data: { key, value } });
  }
  console.log("settings ensured:", Object.keys(SETTINGS).length);

  // 4) literary news
  for (const n of NEWS) {
    const exists = await db.news.findFirst({ where: { title: n.title } });
    if (exists) continue;
    await db.news.create({
      data: { ...n, publishedAt: n.status === "PUBLISHED" ? new Date() : null },
    });
  }
  console.log("news seeded:", NEWS.length);

  console.log("=== upgrade seed complete ===");
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
