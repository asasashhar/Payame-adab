import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { getDelegate } from "@/lib/api-registry";

/** Restore a soft-deleted item from the DeletedItem archive. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const items = await db.deletedItem.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const body = (await req.json()) as Record<string, string>;
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });

  const snapshot = await db.deletedItem.findUnique({ where: { id } });
  if (!snapshot) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });

  const resourceMap: Record<string, string> = {
    news: "news", books: "book", poets: "poet", words: "wordOfDay", shers: "dailySher",
    competitions: "competition", events: "event", banners: "banner", qafiya: "qafiyaEntry", behrs: "behr",
    poems: "poem", articles: "article",
  };
  const model = resourceMap[snapshot.resourceType];
  if (!model) return NextResponse.json({ error: "اس قسم کی بحالی معاون نہیں" }, { status: 400 });

  try {
    const payload = JSON.parse(snapshot.payload) as Record<string, unknown>;
    delete payload.id;
    // strip relation fields that can't be recreated directly
    delete payload.user;
    delete payload.createdAt;
    delete payload.updatedAt;
    for (const key of Object.keys(payload)) {
      if (payload[key] === undefined) delete payload[key];
      if (typeof payload[key] === "string" && /^\d{4}-\d{2}-\d{2}T/.test(payload[key])) {
        payload[key] = new Date(payload[key]);
      }
    }
    const delegate = getDelegate(db, model);
    await delegate.create({ data: payload });
    await db.deletedItem.delete({ where: { id } });
    await logActivity("restore", `${snapshot.resourceType}/${snapshot.title}`, admin.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "بحالی میں خرابی", detail: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  await db.deletedItem.delete({ where: { id } });
  await logActivity("deleted-purge", id, admin.email);
  return NextResponse.json({ ok: true });
}
