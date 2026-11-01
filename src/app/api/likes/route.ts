import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { getOrCreateVisitorId } from "@/lib/visitor";

const RESOURCE_PUBLISHED: Record<string, Record<string, unknown>> = {
  poem: { status: "PUBLISHED" },
  article: { status: "PUBLISHED" },
  book: {},
  news: { status: "PUBLISHED" },
};

async function validResource(type: string, id: string) {
  const model = type as "poem" | "article" | "book" | "news";
  if (!RESOURCE_PUBLISHED[type]) return false;
  const row = await (db[model] as { findFirst: (a: unknown) => Promise<unknown> }).findFirst({
    where: { id, ...RESOURCE_PUBLISHED[type] },
  });
  return Boolean(row);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("resourceType") ?? "";
  const id = sp.get("resourceId") ?? "";
  if (!RESOURCE_PUBLISHED[type] || !id) {
    return NextResponse.json({ error: "غلط درخواست" }, { status: 400 });
  }
  const count = await db.like.count({ where: { resourceType: type, resourceId: id } });
  const me = await getSessionUser();
  const vid = await getOrCreateVisitorId();
  let liked = false;
  if (me) {
    liked = Boolean(await db.like.findFirst({ where: { resourceType: type, resourceId: id, userId: me.id } }));
  }
  if (!liked) {
    liked = Boolean(await db.like.findFirst({ where: { resourceType: type, resourceId: id, visitorId: vid, userId: null } }));
  }
  return NextResponse.json({ count, liked });
}

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (settings.likesEnabled === "0") {
    return NextResponse.json({ error: "پسندیدگی فی الحال بند ہے" }, { status: 403 });
  }
  const me = await getSessionUser();
  if (!me && settings.likesGuests === "0") {
    return NextResponse.json({ error: "پسند کرنے کے لیے لاگ اِن کریں" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, string>;
  const type = String(body.resourceType ?? "");
  const id = String(body.resourceId ?? "");
  if (!RESOURCE_PUBLISHED[type] || !id) {
    return NextResponse.json({ error: "غلط درخواست" }, { status: 400 });
  }
  if (!(await validResource(type, id))) {
    return NextResponse.json({ error: "مواد نہیں ملا" }, { status: 404 });
  }
  const vid = await getOrCreateVisitorId();

  // duplicate-vote prevention: one like per account, else one per visitor
  const existing = me
    ? await db.like.findFirst({ where: { resourceType: type, resourceId: id, userId: me.id } })
    : await db.like.findFirst({ where: { resourceType: type, resourceId: id, visitorId: vid, userId: null } });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    const count = await db.like.count({ where: { resourceType: type, resourceId: id } });
    return NextResponse.json({ liked: false, count });
  }
  await db.like.create({
    data: { resourceType: type, resourceId: id, userId: me?.id ?? null, visitorId: vid },
  });
  const count = await db.like.count({ where: { resourceType: type, resourceId: id } });
  if (me) await logActivity("like", `${type}/${id}`, me.email);
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(req: NextRequest) {
  // admin removal of suspicious likes
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  await db.like.delete({ where: { id } });
  await logActivity("like-delete", id, admin.email);
  return NextResponse.json({ ok: true });
}
