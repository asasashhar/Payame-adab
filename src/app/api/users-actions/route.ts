import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdminPerm, logActivity } from "@/lib/auth";

/**
 * POST /api/users-actions — admin user management operations
 * (permission: users). The generic resource API never touches
 * role/status, so this is the single controlled entry point.
 * Ops: verify | unverify | suspend | activate | set-permissions
 */
export async function POST(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "users"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const op = String(body.op ?? "");
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id ضروری ہے" }, { status: 400 });
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "صارف نہیں ملا" }, { status: 404 });

    switch (op) {
      case "verify":
        await db.user.update({ where: { id }, data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null } });
        break;
      case "unverify":
        await db.user.update({ where: { id }, data: { emailVerified: false } });
        break;
      case "suspend":
        if (user.role === "ADMIN") {
          return NextResponse.json({ error: "ایڈمنسٹریٹر کو یہاں سے معطل نہیں کیا جا سکتا — ایڈمنسٹریٹرز سیکشن استعمال کریں" }, { status: 400 });
        }
        await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
        break;
      case "activate":
        await db.user.update({ where: { id }, data: { status: "ACTIVE" } });
        break;
      case "set-permissions": {
        if (user.role !== "ADMIN") {
          return NextResponse.json({ error: "یہ صرف ایڈمنسٹریٹرز کے لیے ہے" }, { status: 400 });
        }
        const perms = String(body.permissions ?? "*").trim() || "*";
        await db.user.update({ where: { id }, data: { permissions: perms } });
        await logActivity("admin-permissions", `${user.email} → ${perms.slice(0, 120)}`, admin.email);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 400 });
    }
    await logActivity(`user-${op}`, user.email, admin.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "کارروائی میں خرابی", detail: String(e) }, { status: 400 });
  }
}
