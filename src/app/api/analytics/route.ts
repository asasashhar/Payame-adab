import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const range = Math.min(365, Math.max(1, Number(sp.get("days") ?? 30)));
  const type = sp.get("type") ?? "all"; // all | poem | article | book | news
  const category = sp.get("category") ?? "";
  const author = sp.get("author") ?? "";

  const now = new Date();
  const today = dayKey(now);
  const daysAgo = (n: number) => dayKey(new Date(now.getTime() - n * 86400000));
  const date7 = daysAgo(6);
  const date30 = daysAgo(29);

  // optional content filter → restrict analytics to matching resource ids
  let idFilter: string[] | null = null;
  if (type !== "all" || category || author) {
    const models = (type === "all" ? ["poem", "article", "book", "news"] : [type]) as ("poem" | "article" | "book" | "news")[];
    const ids: string[] = [];
    for (const m of models) {
      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (author) {
        if (m === "poem") where.poetName = { contains: author };
        else if (m === "article" || m === "news") where.authorName = { contains: author };
        else where.author = { contains: author };
      }
       
      const rows = await (db as any)[m].findMany({ where, select: { id: true } });
      ids.push(...rows.map((r: { id: string }) => r.id));
    }
    idFilter = ids;
  }

  const baseWhere: Record<string, unknown> = {};
  if (idFilter) {
    baseWhere.resourceId = { in: idFilter };
    baseWhere.resourceType = { not: null };
  }

  const pv = (extra: Record<string, unknown> = {}) => db.pageView.count({ where: { ...baseWhere, ...extra } });

  const [
    totalViews, todayViews, views7, views30,
    uniqueAll, uniqueToday, unique7, unique30,
  ] = await Promise.all([
    pv(), pv({ day: today }), pv({ day: { gte: date7 } }), pv({ day: { gte: date30 } }),
    db.pageView.findMany({ where: baseWhere, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.pageView.findMany({ where: { ...baseWhere, day: today }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.pageView.findMany({ where: { ...baseWhere, day: { gte: date7 } }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.pageView.findMany({ where: { ...baseWhere, day: { gte: date30 } }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
  ]);

  // daily series for the range
  const from = daysAgo(range - 1);
  const rows = await db.pageView.groupBy({
    by: ["day"],
    where: { ...baseWhere, day: { gte: from } },
    _count: { _all: true },
  });
  const visitorRows = await db.pageView.groupBy({
    by: ["day"],
    where: { ...baseWhere, day: { gte: from } },
    _count: { visitorId: true },
  });
  // unique visitors per day needs a per-day distinct — approximate with groupBy count of visitorId
  const seriesMap: Record<string, { views: number }> = {};
  for (const r of rows) seriesMap[r.day] = { views: r._count._all };
  const series: { day: string; views: number; visitors: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const day = daysAgo(i);
    series.push({
      day,
      views: seriesMap[day]?.views ?? 0,
      visitors: visitorRows.find((v) => v.day === day)?._count.visitorId ?? 0,
    });
  }

  // top content by recorded views
  const topAgg = await db.pageView.groupBy({
    by: ["resourceType", "resourceId"],
    where: { ...baseWhere, resourceId: { not: null } },
    _count: { resourceId: true },
    orderBy: { _count: { resourceId: "desc" } },
    take: 40,
  });
  const top: { id: string; type: string; title: string; author: string; views: number }[] = [];
  for (const row of topAgg) {
    const t = row.resourceType as "poem" | "article" | "book" | "news";
    const rid = row.resourceId as string;
    if (!t || !rid) continue;
     
    const model = (db as any)[t];
    const authorField = t === "poem" ? "poetName" : t === "book" ? "author" : "authorName";
    const item = await model.findUnique({
      where: { id: rid },
      select: { id: true, title: true, [authorField]: true },
    });
    if (!item) continue;
    top.push({
      id: item.id, type: t, title: item.title,
      author: item[authorField] ?? "—",
      views: row._count.resourceId,
    });
    if (top.length >= 10) break;
  }

  // top categories / authors from published content
   
  const catCounts: Record<string, { name: string; count: number }[]> = {};
  for (const m of ["poem", "article", "book", "news"] as const) {
    const g = await (db as any)[m].groupBy({
      by: ["category"],
      where: m === "book" ? {} : { status: "PUBLISHED" },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 8,
    });
    catCounts[m] = g.map((x: { category: string; _count: { _all: number } }) => ({ name: x.category, count: x._count._all }));
  }

  // likes
  const likeWhere: Record<string, unknown> = {};
  if (idFilter) likeWhere.resourceId = { in: idFilter };
  const totalLikes = await db.like.count({ where: likeWhere });
  const likesToday = await db.like.count({ where: { ...likeWhere, createdAt: { gte: new Date(today) } } });
  const topLikesAgg = await db.like.groupBy({
    by: ["resourceType", "resourceId"],
    where: likeWhere,
    _count: { resourceId: true },
    orderBy: { _count: { resourceId: "desc" } },
    take: 10,
  });
  const topLikes: { id: string; type: string; title: string; likes: number }[] = [];
  for (const row of topLikesAgg) {
    const t = row.resourceType as "poem" | "article" | "book" | "news";
    const rid = row.resourceId as string;
    if (!t || !rid) continue;
     
    const item = await (db as any)[t].findUnique({ where: { id: rid }, select: { id: true, title: true } });
    if (item) topLikes.push({ id: item.id, type: t, title: item.title, likes: row._count.resourceId });
  }

  // recent likes (suspicion inspection)
  const recentLikes = await db.like.findMany({
    where: likeWhere,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  });

  // comments
  const cWhere: Record<string, unknown> = {};
  if (idFilter) cWhere.resourceId = { in: idFilter };
  const [commentsPending, commentsApproved, commentsRejected, commentsTotal] = await Promise.all([
    db.comment.count({ where: { ...cWhere, status: "PENDING" } }),
    db.comment.count({ where: { ...cWhere, status: "APPROVED" } }),
    db.comment.count({ where: { ...cWhere, status: "REJECTED" } }),
    db.comment.count({ where: cWhere }),
  ]);

  // most-viewed authors (aggregate from top content)
  const authorViews: Record<string, number> = {};
  for (const t of top) authorViews[t.author] = (authorViews[t.author] ?? 0) + t.views;
  const topAuthors = Object.entries(authorViews)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, views]) => ({ name, views }));

  return NextResponse.json({
    totals: { totalViews, todayViews, views7, views30, uniqueAll, uniqueToday, unique7, unique30 },
    series,
    top,
    topAuthors,
    categories: catCounts,
    likes: { total: totalLikes, today: likesToday, top: topLikes, recent: recentLikes },
    comments: { pending: commentsPending, approved: commentsApproved, rejected: commentsRejected, total: commentsTotal },
    range, type, category, author,
  });
}
