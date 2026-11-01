import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAdminPerm, hashPassword, logActivity } from "@/lib/auth";

const MAX_ACTIVE_ADMINS = 5;

function adminSafe(u: { id: string; email: string; name: string; penName: string | null; status: string; mustChangePassword: boolean; lastLoginAt: Date | null; createdAt: Date; permissions: string }) {
  return {
    id: u.id, email: u.email, name: u.name, penName: u.penName,
    status: u.status, mustChangePassword: u.mustChangePassword,
    lastLoginAt: u.lastLoginAt, createdAt: u.createdAt, permissions: u.permissions,
  };
}

async function listAdmins() {
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  return admins.map(adminSafe);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const admins = await listAdmins();
  const owner = await db.setting.findUnique({ where: { key: "ownerEmail" } });
  const resetRequests = await db.user.findMany({
    where: { resetToken: { not: null }, resetTokenExpiry: { gt: new Date() } },
    select: { id: true, email: true, name: true, resetToken: true, resetTokenExpiry: true, role: true },
  });
  return NextResponse.json({ admins, resetRequests, maxActive: MAX_ACTIVE_ADMINS, ownerEmail: owner?.value ?? "" });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  // managing administrator accounts requires the "admins" module permission
  if (!(await requireAdminPerm(admin, "admins"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const op = String(body.op ?? "");

    // ---- create new administrator (4th / 5th account) ----
    if (op === "create") {
      const activeCount = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
      if (activeCount >= MAX_ACTIVE_ADMINS) {
        return NextResponse.json({ error: `زیادہ سے زیادہ ${MAX_ACTIVE_ADMINS} فعال ایڈمنسٹریٹر ہو سکتے ہیں` }, { status: 400 });
      }
      const email = String(body.email ?? "").trim().toLowerCase();
      const name = String(body.name ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "درست ای میل درج کریں" }, { status: 400 });
      }
      if (!name) return NextResponse.json({ error: "نام ضروری ہے" }, { status: 400 });
      const exists = await db.user.findUnique({ where: { email } });
      if (exists) return NextResponse.json({ error: "یہ ای میل پہلے سے موجود ہے" }, { status: 409 });
      const password = String(body.password ?? "darulhuda");
      const user = await db.user.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
          role: "ADMIN",
          status: "ACTIVE",
          mustChangePassword: true,
          permissions: String(body.permissions ?? "*") || "*",
        },
      });
      await logActivity("admin-create", email, admin.email);
      return NextResponse.json(adminSafe(user), { status: 201 });
    }

    // ---- activate / deactivate ----
    if (op === "toggle") {
      const id = String(body.id ?? "");
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN") {
        return NextResponse.json({ error: "ایڈمنسٹریٹر نہیں ملا" }, { status: 404 });
      }
      const nextStatus = target.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      if (nextStatus === "SUSPENDED") {
        const activeCount = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        if (activeCount <= 1) {
          return NextResponse.json({ error: "آخری فعال ایڈمنسٹریٹر کو معطل نہیں کیا جا سکتا" }, { status: 400 });
        }
        if (target.id === admin.id) {
          return NextResponse.json({ error: "آپ خود کو معطل نہیں کر سکتے" }, { status: 400 });
        }
      }
      const updated = await db.user.update({ where: { id }, data: { status: nextStatus } });
      await logActivity("admin-toggle", `${target.email} → ${nextStatus}`, admin.email);
      return NextResponse.json(adminSafe(updated));
    }

    // ---- update name / permissions ----
    if (op === "update") {
      const id = String(body.id ?? "");
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "نام ضروری ہے" }, { status: 400 });
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN") {
        return NextResponse.json({ error: "ایڈمنسٹریٹر نہیں ملا" }, { status: 404 });
      }
      const updated = await db.user.update({ where: { id }, data: { name } });
      await logActivity("admin-update", target.email, admin.email);
      return NextResponse.json(adminSafe(updated));
    }

    // ---- assign / restrict module permissions ----
    if (op === "set-permissions") {
      const id = String(body.id ?? "");
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN") {
        return NextResponse.json({ error: "ایڈمنسٹریٹر نہیں ملا" }, { status: 404 });
      }
      const owner = await db.setting.findUnique({ where: { key: "ownerEmail" } });
      if (owner?.value && owner.value.trim().toLowerCase() === target.email.toLowerCase()) {
        return NextResponse.json({ error: "بانی ایڈمنسٹریٹر کی اجازتیں تبدیل نہیں ہو سکتیں" }, { status: 400 });
      }
      const perms = String(body.permissions ?? "*").trim() || "*";
      const updated = await db.user.update({ where: { id }, data: { permissions: perms } });
      await logActivity("admin-permissions", `${target.email} → ${perms.slice(0, 120)}`, admin.email);
      return NextResponse.json(adminSafe(updated));
    }

    // ---- revoke (delete) an administrator account ----
    if (op === "revoke") {
      const id = String(body.id ?? "");
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN") {
        return NextResponse.json({ error: "ایڈمنسٹریٹر نہیں ملا" }, { status: 404 });
      }
      const activeCount = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
      if (target.status === "ACTIVE" && activeCount <= 1) {
        return NextResponse.json({ error: "آخری فعال ایڈمنسٹریٹر کو ہٹایا نہیں جا سکتا" }, { status: 400 });
      }
      if (target.id === admin.id) {
        return NextResponse.json({ error: "آپ اپنا اکاؤنٹ نہیں ہٹا سکتے" }, { status: 400 });
      }
      await db.poem.updateMany({ where: { userId: id }, data: { userId: null } });
      await db.article.updateMany({ where: { userId: id }, data: { userId: null } });
      await db.news.updateMany({ where: { userId: id }, data: { userId: null } });
      await db.user.delete({ where: { id } });
      await logActivity("admin-revoke", target.email, admin.email);
      return NextResponse.json({ ok: true });
    }

    // ---- reset another admin's password (admin-mediated recovery) ----
    if (op === "reset-password") {
      const id = String(body.id ?? "");
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN") {
        return NextResponse.json({ error: "ایڈمنسٹریٹر نہیں ملا" }, { status: 404 });
      }
      const newPassword = String(body.password ?? "darulhuda");
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے" }, { status: 400 });
      }
      await db.user.update({
        where: { id },
        data: { passwordHash: hashPassword(newPassword), mustChangePassword: true, resetToken: null, resetTokenExpiry: null },
      });
      await logActivity("admin-reset-password", target.email, admin.email);
      return NextResponse.json({ ok: true, initialPassword: newPassword === "darulhuda" ? "darulhuda" : undefined });
    }

    // ---- generate a one-time reset link for a pending recovery request ----
    if (op === "reset-link") {
      const id = String(body.id ?? "");
      const target = await db.user.findUnique({ where: { id } });
      if (!target || !target.resetToken) {
        return NextResponse.json({ error: "بازیابی کی درخواست نہیں ملی" }, { status: 404 });
      }
      await logActivity("admin-reset-link", target.email, admin.email);
      return NextResponse.json({
        url: `/reset-password?token=${target.resetToken}`,
        expiry: target.resetTokenExpiry,
      });
    }

    return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "کارروائی میں خرابی", detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // self-service: dismiss the mustChangePassword reminder (they already changed it)
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  const body = (await req.json()) as Record<string, unknown>;
  if (body.op === "ack-password-changed") {
    await db.user.update({ where: { id: admin.id }, data: { mustChangePassword: false } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 400 });
}
