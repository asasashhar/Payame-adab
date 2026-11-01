import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { siteUrlFrom } from "@/lib/mailer";
import { notifyModeration, contentUrl } from "@/lib/moderation";

const MODERATION_KINDS: Record<string, "PUBLISHED" | "APPROVED" | "REJECTED" | "REVISION" | "PENDING"> = {
  PUBLISHED: "PUBLISHED", APPROVED: "APPROVED", REJECTED: "REJECTED",
  REVISION: "REVISION", PENDING: "PENDING",
};

/** Literary news — public reads only PUBLISHED; admins read everything. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";
  const mine = sp.get("mine") === "1" && user;
  const all = sp.get("all") === "1" && isAdmin;

  const where: Record<string, unknown> = {};
  if (mine) {
    where.userId = user!.id;
  } else if (!all) {
    where.status = "PUBLISHED";
  }
  const category = sp.get("category");
  if (category && category !== "تمام") where.category = category;
  const status = sp.get("status");
  if (all && status && status !== "all") where.status = status;
  const q = sp.get("q");
  if (q) {
    where.OR = [{ title: { contains: q } }, { content: { contains: q } }, { excerpt: { contains: q } }];
  }
  if (sp.get("featured") === "1") where.featured = true;

  const limit = Math.min(Number(sp.get("limit") ?? 50), 100);
  const skip = Number(sp.get("offset") ?? 0);
  const orderBy = sp.get("sort") === "views" ? { views: "desc" as const } : { createdAt: "desc" as const };

  const items = await db.news.findMany({
    where,
    orderBy,
    take: limit,
    skip,
    include: mine || all ? { user: { select: { id: true, name: true, penName: true, photoUrl: true } } } : undefined,
  });
  const total = await db.news.count({ where });
  return NextResponse.json({ items, total });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "خبر بھیجنے کے لیے لاگ اِن کریں" }, { status: 401 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "سرخی اور متن ضروری ہیں" }, { status: 400 });
    }
    const status = user.role === "ADMIN" && typeof body.status === "string" && body.status
      ? body.status
      : body.status === "DRAFT" ? "DRAFT" : "PENDING";
    const publishAt = body.status === "SCHEDULED" && body.publishAt ? new Date(String(body.publishAt)) : null;
    const item = await db.news.create({
      data: {
        title,
        content,
        excerpt: body.excerpt ? String(body.excerpt) : null,
        sourceName: body.sourceName ? String(body.sourceName) : null,
        category: String(body.category ?? "ادبی خبریں"),
        authorName: body.authorName ? String(body.authorName) : (user.penName || user.name),
        userId: user.id,
        coverUrl: body.coverUrl ? String(body.coverUrl) : null,
        topicImageUrl: body.topicImageUrl ? String(body.topicImageUrl) : null,
        tags: body.tags ? String(body.tags) : null,
        status,
        publishAt,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    await logActivity("submission", `news: ${title}`, user.email);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "بھیجنے میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
    const existing = await db.news.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
    const data: Record<string, unknown> = {};
    for (const k of ["title", "excerpt", "content", "sourceName", "category", "authorName", "tags", "status", "feedback"]) {
      if (k in body) data[k] = body[k] === null ? null : String(body[k]);
    }
    for (const k of ["featured"]) if (k in body) data[k] = Boolean(body[k]);
    for (const k of ["coverUrl", "topicImageUrl"]) {
      if (k in body) data[k] = body[k] === null ? null : String(body[k]);
    }
    if ("publishAt" in body) {
      data.publishAt = body.publishAt ? new Date(String(body.publishAt)) : null;
    }
    const newStatus = typeof data.status === "string" ? data.status : existing.status;
    if (newStatus === "REJECTED" || newStatus === "REVISION") {
      const msg = String(data.feedback ?? existing.feedback ?? "").trim();
      if (!msg) {
        return NextResponse.json({ error: "مستردی/اصلاح کے لیے ذاتی پیغام لازمی ہے — مصنف کو وجہ لکھ کر بھیجی جائے گی" }, { status: 400 });
      }
    }
    if (data.status === "PUBLISHED") data.publishedAt = new Date();
    const item = await db.news.update({ where: { id }, data });
    const nextStatus = data.status as string | undefined;
    if (nextStatus && nextStatus !== existing.status && MODERATION_KINDS[nextStatus]) {
      const s = await getSettings();
      const url = nextStatus === "PUBLISHED" ? contentUrl("news", item.id, siteUrlFrom(req, s)) : undefined;
      await notifyModeration({
        kind: MODERATION_KINDS[nextStatus],
        item,
        resourceType: "news",
        authorFallback: item.authorName,
        url,
      });
    }
    await logActivity("news-update", `${id} → ${String(data.status ?? "")}`, admin.email);
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json({ error: "اپ ڈیٹ میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  const item = await db.news.findUnique({ where: { id } });
  if (item) {
    await db.deletedItem.create({
      data: {
        resourceType: "news",
        resourceId: id,
        title: item.title,
        payload: JSON.stringify(item),
        deletedBy: admin.email,
      },
    });
  }
  await db.news.delete({ where: { id } });
  await logActivity("news-delete", id, admin.email);
  return NextResponse.json({ ok: true });
}
