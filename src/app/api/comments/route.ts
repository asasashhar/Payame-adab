import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";

const RESOURCE_MODELS = { poem: "poem", article: "article", book: "book", news: "news" } as const;
type ResourceType = keyof typeof RESOURCE_MODELS;

const RESOURCE_PUBLISHED_WHERE: Record<ResourceType, Record<string, unknown>> = {
  poem: { status: "PUBLISHED" },
  article: { status: "PUBLISHED" },
  book: {},
  news: { status: "PUBLISHED" },
};

function isResourceType(v: string): v is ResourceType {
  return v in RESOURCE_MODELS;
}

async function resourceExists(type: ResourceType, id: string) {
  const model = RESOURCE_MODELS[type] as "poem" | "article" | "book" | "news";
  const row = await (db[model] as { findFirst: (a: unknown) => Promise<unknown> }).findFirst({
    where: { id, ...RESOURCE_PUBLISHED_WHERE[type] },
  });
  return Boolean(row);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("resourceType") ?? "";
  const id = sp.get("resourceId") ?? "";
  const me = await getSessionUser();
  const isAdmin = me?.role === "ADMIN";

  // admin listing with status filter
  if (sp.get("admin") === "1") {
    if (!isAdmin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
    const status = sp.get("status");
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    const items = await db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { user: { select: { name: true, penName: true, email: true, photoUrl: true } } },
    });
    const counts = {
      PENDING: await db.comment.count({ where: { status: "PENDING" } }),
      APPROVED: await db.comment.count({ where: { status: "APPROVED" } }),
      REJECTED: await db.comment.count({ where: { status: "REJECTED" } }),
      total: await db.comment.count(),
    };
    return NextResponse.json({ items, counts });
  }

  if (!isResourceType(type) || !id) return NextResponse.json({ error: "غلط درخواست" }, { status: 400 });
  const items = await db.comment.findMany({
    where: { resourceType: type, resourceId: id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, penName: true, photoUrl: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (settings.commentsEnabled === "0") {
    return NextResponse.json({ error: "تبصرے فی الحال بند ہیں" }, { status: 403 });
  }
  const me = await getSessionUser();
  if (!me && settings.commentsGuests === "0") {
    return NextResponse.json({ error: "تبصرہ بھیجنے کے لیے لاگ اِن کریں" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const type = String(body.resourceType ?? "");
    const id = String(body.resourceId ?? "");
    const text = String(body.body ?? "").trim();
    if (!isResourceType(type) || !id) {
      return NextResponse.json({ error: "غلط درخواست" }, { status: 400 });
    }
    if (text.length < 2 || text.length > 2000) {
      return NextResponse.json({ error: "تبصرہ 2 سے 2000 حروف کے درمیان ہونا چاہیے" }, { status: 400 });
    }
    if (!(await resourceExists(type, id))) {
      return NextResponse.json({ error: "مواد نہیں ملا" }, { status: 404 });
    }
    let guestName: string | null = null;
    let guestEmail: string | null = null;
    if (!me) {
      guestName = String(body.guestName ?? "").trim().slice(0, 60) || "مہمان قاری";
      guestEmail = String(body.guestEmail ?? "").trim().slice(0, 120) || null;
      if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        return NextResponse.json({ error: "درست ای میل درج کریں (یا خالی چھوڑ دیں)" }, { status: 400 });
      }
    }
    // naive spam guard: same visitor repeating identical body within 2 minutes
    const recent = await db.comment.findFirst({
      where: { body: text, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) }, userId: me?.id ?? null },
    });
    if (recent) {
      return NextResponse.json({ error: "یہی تبصرہ ابھی موصول ہو چکا ہے" }, { status: 429 });
    }
    const comment = await db.comment.create({
      data: {
        resourceType: type,
        resourceId: id,
        userId: me?.id ?? null,
        guestName,
        guestEmail,
        body: text,
        status: "PENDING", // always pre-moderated
      },
    });
    if (me) await logActivity("comment", `${type}/${id}`, me.email);
    return NextResponse.json({
      ok: true,
      message: "آپ کا تبصرہ موصول ہو گیا — منظوری کے بعد ظاہر ہوگا۔",
      id: comment.id,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "تبصرہ بھیجنے میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const body = (await req.json()) as Record<string, string>;
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "غلط درخواست" }, { status: 400 });
  }
  const updated = await db.comment.update({ where: { id }, data: { status } });
  await logActivity("comment-moderate", `${id} → ${status}`, admin.email);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  await db.comment.delete({ where: { id } });
  await logActivity("comment-delete", id, admin.email);
  return NextResponse.json({ ok: true });
}
