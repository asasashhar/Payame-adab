import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, requireAdminPerm, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { siteUrlFrom } from "@/lib/mailer";
import { notifyModeration, contentUrl } from "@/lib/moderation";
import { REGISTRY, getDelegate, coerceFields } from "@/lib/api-registry";

const RESOURCE_MODULE: Record<string, string> = {
  news: "content", books: "content", poets: "content",
  newspaper: "newspaper", words: "newspaper", shers: "newspaper", banners: "newspaper",
  competitions: "content", events: "content",
  qafiya: "tools", behrs: "tools", users: "users",
};

const MODERATION_KINDS: Record<string, "PUBLISHED" | "APPROVED" | "REJECTED" | "REVISION" | "PENDING"> = {
  PUBLISHED: "PUBLISHED", APPROVED: "APPROVED", REJECTED: "REJECTED",
  REVISION: "REVISION", PENDING: "PENDING",
};
const RESOURCE_PATH: Record<string, "poem" | "article" | "news"> = {
  poems: "poem", articles: "article", news: "news",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await ctx.params;
  const def = REGISTRY[resource];
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const delegate = getDelegate(db, def.model);
  const item = (await delegate.findUnique({ where: { id } })) as Record<string, unknown> | null;
  if (!item) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";
  // public reads must respect the resource's publication filter (no leaking drafts)
  if (!isAdmin) {
    if (!def.publicRead) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
    if (def.publicWhere) {
      for (const [k, v] of Object.entries(def.publicWhere)) {
        if (item[k] !== v) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
      }
    }
  }
  if (resource === "users") delete item.passwordHash;
  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await ctx.params;
  const def = REGISTRY[resource];
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const mod = RESOURCE_MODULE[resource];
  if (mod && !(await requireAdminPerm(admin, mod))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    // safety: role/status changes go through dedicated user-management endpoints
    if (resource === "users") {
      delete body.role;
      delete body.status;
      delete body.passwordHash;
    }
    const data = coerceFields(def, body);
    if (def.fields.status && data.status === "PUBLISHED") {
       
      (data as any).publishedAt = new Date();
    }
    const delegate = getDelegate(db, def.model);
    const before = await delegate.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
    // moderation guard: rejecting / requesting revision requires a personal message
    if (def.fields.status && typeof data.status === "string" && ["REJECTED", "REVISION"].includes(data.status)) {
      const msg = String(data.feedback ?? (before as { feedback?: string }).feedback ?? "").trim();
      if (!msg) {
        return NextResponse.json({ error: "مستردی/اصلاح کے لیے ذاتی پیغام لازمی ہے" }, { status: 400 });
      }
    }
    const item = await delegate.update({ where: { id }, data });
    // editorial notification for the moderated content types
    const path = RESOURCE_PATH[resource];
    if (path && def.fields.status && typeof data.status === "string" && data.status !== (before as { status: string }).status && MODERATION_KINDS[data.status]) {
      const s = await getSettings();
      const url = data.status === "PUBLISHED" ? contentUrl(path, id, siteUrlFrom(req, s)) : undefined;
      await notifyModeration({
        kind: MODERATION_KINDS[data.status],
        item: item as { id: string; title: string; feedback?: string | null; userId?: string | null },
        resourceType: path,
        authorFallback: (item as { poetName?: string | null; authorName?: string | null }).poetName ?? (item as { authorName?: string | null }).authorName ?? null,
        url,
      });
    }
    await logActivity("update", `${resource}/${id}`, admin.email);
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json({ error: "اپ ڈیٹ میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await ctx.params;
  const def = REGISTRY[resource];
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const mod = RESOURCE_MODULE[resource];
  if (mod && !(await requireAdminPerm(admin, mod))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }

  try {
    const delegate = getDelegate(db, def.model);
    const item = (await delegate.findUnique({ where: { id } })) as Record<string, unknown> | null;
    if (!item) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
    // snapshot for "Recently Deleted" restore (content resources only)
    if (["news", "books", "poets", "words", "shers", "competitions", "events", "banners", "qafiya", "behrs"].includes(resource)) {
      await db.deletedItem.create({
        data: {
          resourceType: resource,
          resourceId: id,
          title: String(item.title ?? item.word ?? item.name ?? id),
          payload: JSON.stringify(item),
          deletedBy: admin.email,
        },
      });
    }
    await delegate.delete({ where: { id } });
    await logActivity("delete", `${resource}/${id}`, admin.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "حذف میں خرابی", detail: String(e) }, { status: 400 });
  }
}
