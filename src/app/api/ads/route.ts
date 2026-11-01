import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdminPerm, logActivity } from "@/lib/auth";

/** GET /api/ads — active advertisements for the public homepage rails. */
export async function GET() {
  const [left, right] = await Promise.all([
    db.advertisement.findMany({ where: { slot: "LEFT", active: true }, orderBy: { sortOrder: "asc" } }),
    db.advertisement.findMany({ where: { slot: "RIGHT", active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return NextResponse.json({ left, right });
}

/** POST /api/ads — create (admin, permission: ads). */
export async function POST(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "ads"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();
    if (!title || !imageUrl) {
      return NextResponse.json({ error: "عنوان اور تصویر ضروری ہیں" }, { status: 400 });
    }
    const slot = body.slot === "RIGHT" ? "RIGHT" : "LEFT";
    const ad = await db.advertisement.create({
      data: {
        title,
        imageUrl,
        linkUrl: body.linkUrl ? String(body.linkUrl).trim() : null,
        slot,
        width: body.width ? String(body.width) : null,
        active: body.active === undefined ? true : Boolean(body.active),
        sortOrder: Number(body.sortOrder ?? 0) || 0,
      },
    });
    await logActivity("ad-create", `${slot}: ${title}`, admin.email);
    return NextResponse.json(ad, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "بنانے میں خرابی", detail: String(e) }, { status: 400 });
  }
}

/** PATCH /api/ads — update (admin, permission: ads). */
export async function PATCH(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "ads"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
    const data: Record<string, unknown> = {};
    for (const k of ["title", "imageUrl", "linkUrl", "slot", "width"]) {
      if (k in body) data[k] = body[k] === null || body[k] === undefined ? null : String(body[k]);
    }
    if ("active" in body) data.active = Boolean(body.active);
    if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder ?? 0) || 0;
    const ad = await db.advertisement.update({ where: { id }, data });
    await logActivity("ad-update", String(id), admin.email);
    return NextResponse.json(ad);
  } catch (e) {
    return NextResponse.json({ error: "اپ ڈیٹ میں خرابی", detail: String(e) }, { status: 400 });
  }
}

/** DELETE /api/ads?id= — delete (admin, permission: ads). */
export async function DELETE(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "ads"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
  try {
    await db.advertisement.delete({ where: { id } });
    await logActivity("ad-delete", id, admin.email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
  }
}
