import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    select: { email: true, role: true, status: true, mustChangePassword: true, lastLoginAt: true, createdAt: true },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
  });
  console.log("=== USERS ===");
  for (const u of users) console.log(`${u.role.padEnd(6)} ${u.status.padEnd(8)} ${u.email.padEnd(38)} mustChange=${u.mustChangePassword} lastLogin=${u.lastLoginAt?.toISOString() ?? "-"}`);

  const counts = {
    poems: await db.poem.count(),
    articles: await db.article.count(),
    news: await db.news.count(),
    books: await db.book.count(),
    comments: await db.comment.count(),
    likes: await db.like.count(),
    pageViews: await db.pageView.count(),
    logs: await db.activityLog.count(),
    deleted: await db.deletedItem.count(),
    settings: await db.setting.count(),
    admins: await db.user.count({ where: { role: "ADMIN" } }),
  };
  console.log("=== COUNTS ===", JSON.stringify(counts));

  const byStatus = await db.$queryRawUnsafe<{ status: string; c: number }[]>(
    `SELECT status, COUNT(*) as c FROM Poem GROUP BY status UNION ALL SELECT 'ART:'||status, COUNT(*) FROM Article GROUP BY status`
  );
  console.log("=== CONTENT BY STATUS ===", JSON.stringify(byStatus));

  const settings = await db.setting.findMany({ orderBy: { key: "asc" } });
  console.log("=== SETTINGS ===");
  for (const s of settings) console.log(`${s.key} = ${s.value.slice(0, 80)}`);
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
