/**
 * Payam-e-Adab — database seed script
 * Creates admin user, settings, poets, classic poems, articles, books,
 * newspaper edition, daily sher, word of day, competitions, events, behrs, qafiya.
 * Idempotent: skips items that already exist.
 */
const { PrismaClient } = require("@prisma/client");
const { scryptSync, randomBytes } = require("crypto");
const { POETS, POEMS } = require("./content-poets");
const { ARTICLES, BOOKS } = require("./content-articles");
const { DAILY_SHERS, WORDS_OF_DAY, COMPETITIONS, EVENTS, BEHRS, QAFIYA } = require("./content-misc");

const db = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function currentWeekLabel(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `ہفتہ ${week}، ${date.getFullYear()}`;
}

const SETTINGS = {
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
  footerNote: "© پیامِ ادب — تمام حقوق محفوظ ہیں",
};

async function main() {
  console.log("Seeding Payam-e-Adab database...");

  // ---------- users ----------
  const admin = await db.user.upsert({
    where: { email: "mdnematullah1343@gmail.com" },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: "mdnematullah1343@gmail.com",
      passwordHash: hashPassword("darulhuda"),
      mustChangePassword: true,
      name: "ایڈمن — پیامِ ادب",
      penName: "مدیواتی بورڈ",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Admin user ready:", admin.email);

  const demo = await db.user.upsert({
    where: { email: "shayar@demo.pk" },
    update: {},
    create: {
      email: "shayar@demo.pk",
      passwordHash: hashPassword("demo@1234"),
      name: "نمائندہ شاعر",
      penName: "شاعرِ نمائندہ",
      role: "USER",
      status: "ACTIVE",
    },
  });
  console.log("Demo user ready:", demo.email);

  // ---------- settings ----------
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log("Settings seeded:", Object.keys(SETTINGS).length);

  // ---------- poets ----------
  const poetByTakhallus = {};
  for (const p of POETS) {
    const found = await db.poet.findFirst({ where: { takhallus: p.takhallus } });
    if (found) {
      poetByTakhallus[p.takhallus] = found;
      continue;
    }
    poetByTakhallus[p.takhallus] = await db.poet.create({ data: p });
  }
  console.log("Poets seeded:", Object.keys(poetByTakhallus).length);

  // ---------- poems (classic) ----------
  let poemCount = 0;
  for (const poem of POEMS) {
    const poet = poetByTakhallus[poem.poetTakhallus];
    const exists = await db.poem.findFirst({ where: { title: poem.title, poetId: poet?.id || null } });
    if (exists) continue;
    await db.poem.create({
      data: {
        title: poem.title,
        content: poem.content,
        category: poem.category,
        poetName: poet ? poet.name : poem.poetTakhallus,
        poetId: poet?.id || null,
        tags: poem.tags,
        status: "PUBLISHED",
        featured: !!poem.featured,
        views: poem.featured ? 40 + poemCount * 7 : 5 + poemCount * 3,
        publishedAt: new Date(),
      },
    });
    poemCount++;
  }
  console.log("Classic poems seeded:", poemCount);

  // one pending demo poem to populate moderation queue
  const pendingExists = await db.poem.findFirst({ where: { title: "نمونہ: زیرِ جائزہ غزل" } });
  if (!pendingExists) {
    await db.poem.create({
      data: {
        title: "نمونہ: زیرِ جائزہ غزل",
        content: `یہ نمونہ تحریر صرف جانچ کے لیے ہے
کہ ادارتی نظام کس طرح کام کرتا ہے`,
        category: "غزل",
        poetName: demo.penName || demo.name,
        userId: demo.id,
        status: "PENDING",
      },
    });
  }
  console.log("Pending demo poem ensured");

  // ---------- articles ----------
  let artCount = 0;
  for (const a of ARTICLES) {
    const exists = await db.article.findFirst({ where: { title: a.title } });
    if (exists) continue;
    await db.article.create({
      data: {
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        category: a.category,
        authorName: a.authorName,
        tags: a.tags,
        status: "PUBLISHED",
        featured: !!a.featured,
        views: a.featured ? 60 + artCount * 9 : 8 + artCount * 4,
        publishedAt: new Date(),
      },
    });
    artCount++;
  }
  console.log("Articles seeded:", artCount);

  // ---------- books ----------
  let bookCount = 0;
  for (const b of BOOKS) {
    const exists = await db.book.findFirst({ where: { title: b.title } });
    if (exists) continue;
    await db.book.create({ data: { ...b, views: b.featured ? 30 : 4 } });
    bookCount++;
  }
  console.log("Books seeded:", bookCount);

  // ---------- newspaper edition ----------
  const weekLabel = currentWeekLabel();
  const editionExists = await db.newspaperEdition.findFirst({ where: { pdfUrl: "/newspaper/shumara-1.pdf" } });
  if (!editionExists) {
    await db.newspaperEdition.create({
      data: {
        title: "پیامِ ادب — ہفتہ وار ادبی شمارہ",
        editionNumber: "۱",
        weekLabel,
        pdfUrl: "/newspaper/shumara-1.pdf",
        notes: "پہلا ڈیجیٹل شمارہ — ادبی خبریں، آج کا شعر، کتب خانہ اور خاص مضامین",
        published: true,
      },
    });
    console.log("Newspaper edition seeded (week:", weekLabel + ")");
  } else {
    console.log("Newspaper edition already present");
  }

  // ---------- daily sher ----------
  let sherCount = 0;
  for (let i = 0; i < DAILY_SHERS.length; i++) {
    const s = DAILY_SHERS[i];
    const exists = await db.dailySher.findFirst({ where: { text: s.text } });
    if (exists) continue;
    await db.dailySher.create({
      data: { ...s, active: i === 0, date: i === 0 ? new Date() : null },
    });
    sherCount++;
  }
  console.log("Daily shers seeded:", sherCount);

  // ---------- word of day ----------
  let wordCount = 0;
  for (let i = 0; i < WORDS_OF_DAY.length; i++) {
    const w = WORDS_OF_DAY[i];
    const exists = await db.wordOfDay.findFirst({ where: { word: w.word } });
    if (exists) continue;
    await db.wordOfDay.create({
      data: { ...w, active: i === 0, date: i === 0 ? new Date() : null },
    });
    wordCount++;
  }
  console.log("Words of day seeded:", wordCount);

  // ---------- competitions ----------
  let compCount = 0;
  for (const c of COMPETITIONS) {
    const exists = await db.competition.findFirst({ where: { title: c.title } });
    if (exists) continue;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    await db.competition.create({ data: { ...c, startDate: start, endDate: end } });
    compCount++;
  }
  console.log("Competitions seeded:", compCount);

  // ---------- events ----------
  let evCount = 0;
  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const exists = await db.event.findFirst({ where: { title: e.title } });
    if (exists) continue;
    const date = new Date();
    date.setDate(date.getDate() + 10 + i * 14);
    await db.event.create({ data: { ...e, date } });
    evCount++;
  }
  console.log("Events seeded:", evCount);

  // ---------- behrs (skip: classical meters are built into lib/taqti.ts; DB table is for admin custom behrs) ----------
  console.log("Behrs skipped (classical meters built into taqti engine)");

  // ---------- qafiya ----------
  let qCount = 0;
  for (const q of QAFIYA) {
    const exists = await db.qafiyaEntry.findFirst({ where: { word: q.word } });
    if (exists) continue;
    await db.qafiyaEntry.create({ data: q });
    qCount++;
  }
  console.log("Qafiya entries seeded:", qCount);

  // ---------- summary ----------
  const counts = {
    users: await db.user.count(),
    poets: await db.poet.count(),
    poems: await db.poem.count(),
    articles: await db.article.count(),
    books: await db.book.count(),
    editions: await db.newspaperEdition.count(),
    dailySher: await db.dailySher.count(),
    wordOfDay: await db.wordOfDay.count(),
    competitions: await db.competition.count(),
    events: await db.event.count(),
    behrs: await db.behr.count(),
    qafiya: await db.qafiyaEntry.count(),
    settings: await db.setting.count(),
  };
  console.log("SEED COMPLETE:", JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
