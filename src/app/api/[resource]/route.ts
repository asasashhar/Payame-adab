import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdmin, requireAdminPerm, logActivity } from "@/lib/auth";
import { REGISTRY, getDelegate, coerceFields } from "@/lib/api-registry";

/** Which permission module each resource belongs to (backend-enforced RBAC). */
const RESOURCE_MODULE: Record<string, string> = {
  news: "content", books: "content", poets: "content",
  newspaper: "newspaper", words: "newspaper", shers: "newspaper", banners: "newspaper",
  competitions: "content", events: "content",
  qafiya: "tools", behrs: "tools", users: "users",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const { resource } = await ctx.params;
  const def = REGISTRY[resource];
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";
  const all = sp.get("all") === "1" && isAdmin;

  const where: Record<string, unknown> = {};
  if (!all) {
    if (!def.publicRead) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
    Object.assign(where, def.publicWhere ?? {});
  }
  const q = sp.get("q");
  if (q && def.searchFields) {
    where.OR = def.searchFields.map((f) => ({ [f]: { contains: q } }));
  }
  const limit = Math.min(Number(sp.get("limit") ?? 100), 200);
  const skip = Number(sp.get("offset") ?? 0);
  const sortKey = sp.get("sort");
  const orderBy = sortKey
    ? { [sortKey]: "desc" as const }
    : { createdAt: "desc" as const };

  const delegate = getDelegate(db, def.model);
  const items = (await delegate.findMany({ where, orderBy, take: limit, skip })) as Record<string, unknown>[];
  if (!isAdmin) for (const it of items) delete it.passwordHash;
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const { resource } = await ctx.params;
  const def = REGISTRY[resource];
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const mod = RESOURCE_MODULE[resource];
  if (mod) {
    const ok = await requireAdminPerm(admin, mod);
    if (!ok) return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (resource === "users") {
      // user creation goes through registration/admin endpoints, never here
      return NextResponse.json({ error: "صارفین کے لیے مخصوص کارروائی استعمال کریں" }, { status: 400 });
    }
    const data = coerceFields(def, body);
    // moderation rules: admin-created editable content starts as given (or PENDING)
    if (def.fields.status && !data.status) data.status = "PENDING";
    const delegate = getDelegate(db, def.model);
    const item = await delegate.create({ data });
    const created = item as { title?: string; name?: string; word?: string; id: string };
    await logActivity("create", `${resource}: ${String(created.title ?? created.name ?? created.word ?? created.id)}`, admin.email);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "بنانے میں خرابی", detail: String(e) }, { status: 400 });
  }
}
