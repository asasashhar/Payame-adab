const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log("USERS:", JSON.stringify(users, null, 2));
  const counts = {
    poems: await db.poem.count(),
    articles: await db.article.count(),
    books: await db.book.count(),
    poets: await db.poet.count(),
    editions: await db.newspaperEdition.count(),
    settings: await db.setting.count(),
    dailySher: await db.dailySher.count(),
    wordOfDay: await db.wordOfDay.count(),
    competitions: await db.competition.count(),
    events: await db.event.count(),
    banners: await db.banner.count(),
  };
  console.log("COUNTS:", JSON.stringify(counts, null, 2));
}
main().catch(e => { console.error("ERR:", e.message); }).finally(() => db.$disconnect());
