import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { publishDueSchedules } from "@/lib/site";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });

  // scheduled content whose time has arrived goes live now
  const published = await publishDueSchedules();

  const today = dayKey();
  const week = dayKey(new Date(Date.now() - 6 * 86400000));
  const month = dayKey(new Date(Date.now() - 29 * 86400000));

  const [
    users, adminsActive, poets, poems, poemsPending, poemsScheduled, poemsArchived,
    articles, articlesPending, articlesScheduled, news, newsPending, newsScheduled,
    books, editions, publishedEditions, competitions, events, qafiya,
    publishedPoems, publishedArticles,
    viewsToday, views7, views30, viewsAll,
    visitorsToday, visitors7, visitors30,
    likesTotal, commentsPending, commentsApproved, draftPoems, draftArticles, draftNews,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
    db.poet.count(),
    db.poem.count(),
    db.poem.count({ where: { status: "PENDING" } }),
    db.poem.count({ where: { status: "SCHEDULED" } }),
    db.poem.count({ where: { status: "ARCHIVED" } }),
    db.article.count(),
    db.article.count({ where: { status: "PENDING" } }),
    db.article.count({ where: { status: "SCHEDULED" } }),
    db.news.count(),
    db.news.count({ where: { status: "PENDING" } }),
    db.news.count({ where: { status: "SCHEDULED" } }),
    db.book.count(),
    db.newspaperEdition.count(),
    db.newspaperEdition.count({ where: { published: true } }),
    db.competition.count({ where: { active: true } }),
    db.event.count(),
    db.qafiyaEntry.count(),
    db.poem.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.pageView.count({ where: { day: today } }),
    db.pageView.count({ where: { day: { gte: week } } }),
    db.pageView.count({ where: { day: { gte: month } } }),
    db.pageView.count(),
    db.pageView.findMany({ where: { day: today }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.pageView.findMany({ where: { day: { gte: week } }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.pageView.findMany({ where: { day: { gte: month } }, select: { visitorId: true }, distinct: ["visitorId"] }).then((r) => r.length),
    db.like.count(),
    db.comment.count({ where: { status: "PENDING" } }),
    db.comment.count({ where: { status: "APPROVED" } }),
    db.poem.count({ where: { status: "DRAFT" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.news.count({ where: { status: "DRAFT" } }),
  ]);

  const recentActivity = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return NextResponse.json({
    users, adminsActive, poets, poems, poemsPending, poemsScheduled, poemsArchived,
    articles, articlesPending, articlesScheduled, news, newsPending, newsScheduled,
    books, editions, publishedEditions, competitions, events, qafiya,
    publishedPoems, publishedArticles,
    views: { today: viewsToday, week: views7, month: views30, all: viewsAll },
    visitors: { today: visitorsToday, week: visitors7, month: visitors30 },
    likesTotal, commentsPending, commentsApproved,
    drafts: draftPoems + draftArticles + draftNews,
    recentActivity, publishedNow: published,
  });
}
