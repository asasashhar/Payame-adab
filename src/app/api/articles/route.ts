import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { siteUrlFrom } from "@/lib/mailer";
import { notifyModeration, contentUrl } from "@/lib/moderation";

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
  const q = sp.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
      { authorName: { contains: q } },
    ];
  }
  if (sp.get("featured") === "1") where.featured = true;

  const limit = Math.min(Number(sp.get("limit") ?? 50), 100);
  const skip = Number(sp.get("offset") ?? 0);
  const orderBy = sp.get("sort") === "views" ? { views: "desc" as const } : { createdAt: "desc" as const };

  const items = await db.article.findMany({
    where,
    orderBy,
    take: limit,
    skip,
    include: mine || all ? { user: { select: { id: true, name: true, penName: true, photoUrl: true } } } : undefined,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "تحریر بھیجنے کے لیے لاگ اِن کریں" }, { status: 401 });
  if (user.role !== "ADMIN") {
    const s = await getSettings();
    if (s.requireEmailVerification === "1" && user.emailVerified === false) {
      return NextResponse.json({ error: "براہ کرم پہلے اپنی ای میل کی تصدیق کریں — ڈیش بورڈ سے تصدیقی ای میل دوبارہ بھیجی جا سکتی ہے" }, { status: 403 });
    }
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "عنوان اور متن ضروری ہیں" }, { status: 400 });
    }
    const status = user.role === "ADMIN" && typeof body.status === "string" && body.status
      ? body.status
      : body.status === "DRAFT" ? "DRAFT" : "PENDING";
    const article = await db.article.create({
      data: {
        title,
        content,
        excerpt: body.excerpt ? String(body.excerpt) : null,
        category: String(body.category ?? "ادبی مضامین"),
        authorName: body.authorName ? String(body.authorName) : user.penName || user.name,
        userId: user.id,
        coverUrl: body.coverUrl ? String(body.coverUrl) : null,
        topicImageUrl: body.topicImageUrl ? String(body.topicImageUrl) : null,
        tags: body.tags ? String(body.tags) : null,
        status,
      },
    });
    await logActivity("submission", `article: ${title}`, user.email);
    return NextResponse.json(article, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "بھیجنے میں خرابی", detail: String(e) }, { status: 400 });
  }
}

const MODERATION_KINDS: Record<string, "PUBLISHED" | "APPROVED" | "REJECTED" | "REVISION" | "PENDING"> = {
  PUBLISHED: "PUBLISHED", APPROVED: "APPROVED", REJECTED: "REJECTED",
  REVISION: "REVISION", PENDING: "PENDING",
};

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "اجازت نہیں" }, { status: 401 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });

    const admin = user.role === "ADMIN" ? user : null;
    let selfEdit = false;
    if (!admin) {
      if (existing.userId !== user.id) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
      if (!["DRAFT", "REVISION"].includes(existing.status)) {
        return NextResponse.json({ error: "یہ تحریر اب قابلِ ترمیم نہیں — ادارتی جائزے میں ہے" }, { status: 403 });
      }
      selfEdit = true;
    }

    const data: Record<string, unknown> = {};
    const editable = selfEdit
      ? ["title", "content", "excerpt", "category", "authorName", "tags", "coverUrl", "topicImageUrl"]
      : ["title", "content", "excerpt", "category", "authorName", "tags", "status", "feedback", "coverUrl", "topicImageUrl"];
    for (const k of editable) {
      if (k in body) data[k] = body[k] === null ? null : String(body[k]);
    }
    if (!selfEdit) {
      for (const k of ["featured"]) if (k in body) data[k] = Boolean(body[k]);
      if ("publishAt" in body) {
        data.publishAt = body.publishAt ? new Date(String(body.publishAt)) : null;
      }
    }

    const newStatus = selfEdit ? "PENDING" : typeof data.status === "string" ? data.status : existing.status;
    if (!selfEdit && (newStatus === "REJECTED" || newStatus === "REVISION")) {
      const msg = String(data.feedback ?? existing.feedback ?? "").trim();
      if (!msg) {
        return NextResponse.json({ error: "مستردی/اصلاح کے لیے ذاتی پیغام لازمی ہے — مصنف کو وجہ لکھ کر بھیجی جائے گی" }, { status: 400 });
      }
    }
    if (selfEdit) {
      data.status = body.status === "DRAFT" ? "DRAFT" : "PENDING";
      data.feedback = null;
    }
    if (data.status === "PUBLISHED") data.publishedAt = new Date();

    const article = await db.article.update({ where: { id }, data });

    const nextStatus = data.status as string | undefined;
    if (!selfEdit && nextStatus && nextStatus !== existing.status && MODERATION_KINDS[nextStatus]) {
      const s = await getSettings();
      const url = nextStatus === "PUBLISHED" ? contentUrl("article", article.id, siteUrlFrom(req, s)) : undefined;
      await notifyModeration({
        kind: MODERATION_KINDS[nextStatus],
        item: article,
        resourceType: "article",
        authorFallback: article.authorName,
        url,
      });
    }
    await logActivity(selfEdit ? "self-edit" : "article-update", `${id} → ${data.status ?? ""}`, user.email);
    return NextResponse.json(article);
  } catch (e) {
    return NextResponse.json({ error: "اپ ڈیٹ میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  const item = await db.article.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
  await db.deletedItem.create({
    data: { resourceType: "articles", resourceId: id, title: item.title, payload: JSON.stringify(item), deletedBy: admin.email },
  });
  await db.article.delete({ where: { id } });
  await logActivity("article-delete", id, admin.email);
  return NextResponse.json({ ok: true });
}
