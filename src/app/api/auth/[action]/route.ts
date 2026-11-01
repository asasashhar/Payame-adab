import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  hashPassword, verifyPassword, setSessionCookie, clearSessionCookie,
  getSessionUser, requireAdmin, logActivity,
} from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { queueMail, siteUrlFrom } from "@/lib/mailer";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;

  if (action === "register") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";
      const name = (body.name ?? "").trim();
      if (!email || !password || !name) {
        return NextResponse.json({ error: "نام، ای میل اور پاس ورڈ ضروری ہیں" }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے" }, { status: 400 });
      }
      const exists = await db.user.findUnique({ where: { email } });
      if (exists) {
        return NextResponse.json({ error: "یہ ای میل پہلے سے موجود ہے" }, { status: 409 });
      }
      const settings = await getSettings();
      const requireVerification = settings.requireEmailVerification === "1";
      const verifyToken = requireVerification ? crypto.randomBytes(24).toString("hex") : null;
      const user = await db.user.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
          penName: body.penName?.trim() || null,
          emailVerified: !requireVerification,
          verifyToken,
          verifyTokenExpiry: verifyToken ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null,
        },
      });
      if (verifyToken) {
        const base = siteUrlFrom(req, settings);
        await queueMail({
          kind: "VERIFY",
          to: email,
          data: { authorName: name, title: "", url: `${base}/verify?token=${verifyToken}` },
          relatedType: "user",
          relatedId: user.id,
        });
      }
      await setSessionCookie(user.id);
      await logActivity("register", email, email);
      const { passwordHash: _p, ...safe } = user;
      return NextResponse.json({ ...safe, needsVerification: !!verifyToken }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ error: "رجسٹریشن میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  if (action === "login") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const email = (body.email ?? "").trim().toLowerCase();
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
        return NextResponse.json({ error: "ای میل یا پاس ورڈ غلط ہے" }, { status: 401 });
      }
      if (user.status === "SUSPENDED") {
        return NextResponse.json({ error: "آپ کا اکاؤنٹ معطل ہے" }, { status: 403 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await setSessionCookie(user.id);
      const { passwordHash: _p, ...safe } = user;
      return NextResponse.json(safe);
    } catch (e) {
      return NextResponse.json({ error: "لاگ اِن میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  // dedicated admin login: refuses non-admin accounts
  if (action === "admin-login") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const email = (body.email ?? "").trim().toLowerCase();
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
        return NextResponse.json({ error: "ای میل یا پاس ورڈ غلط ہے" }, { status: 401 });
      }
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "یہ اکاؤنٹ ایڈمنسٹریٹر نہیں ہے" }, { status: 403 });
      }
      if (user.status === "SUSPENDED") {
        return NextResponse.json({ error: "یہ اکاؤنٹ معطل کر دیا گیا ہے" }, { status: 403 });
      }
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await setSessionCookie(user.id);
      await logActivity("admin-login", email, email);
      const { passwordHash: _p, ...safe } = user;
      return NextResponse.json(safe);
    } catch (e) {
      return NextResponse.json({ error: "لاگ اِن میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  if (action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  // change own password (requires current password)
  if (action === "change-password") {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "لاگ اِن کریں" }, { status: 401 });
    try {
      const body = (await req.json()) as Record<string, string>;
      const current = body.currentPassword ?? "";
      const next = body.newPassword ?? "";
      const row = await db.user.findUnique({ where: { id: user.id } });
      if (!row || !verifyPassword(current, row.passwordHash)) {
        return NextResponse.json({ error: "موجودہ پاس ورڈ غلط ہے" }, { status: 400 });
      }
      if (next.length < 6) {
        return NextResponse.json({ error: "نیا پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے" }, { status: 400 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(next), mustChangePassword: false, resetToken: null, resetTokenExpiry: null },
      });
      await logActivity("password-change", user.email, user.email);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: "پاس ورڈ تبدیل کرنے میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  // consume an email-verification token
  if (action === "verify-email") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const token = String(body.token ?? "");
      if (!token) return NextResponse.json({ error: "ٹوکن درکار ہے" }, { status: 400 });
      const user = await db.user.findFirst({
        where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
      });
      if (!user) {
        return NextResponse.json({ error: "تصدیقی لنک غلط یا میعاد ختم ہے — ڈیش بورڈ سے نیا لنک حاصل کریں" }, { status: 400 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
      });
      await logActivity("email-verified", user.email, user.email);
      return NextResponse.json({ ok: true, email: user.email });
    } catch (e) {
      return NextResponse.json({ error: "تصدیق میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  // resend the verification email (logged-in, unverified users)
  if (action === "resend-verification") {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "لاگ اِن کریں" }, { status: 401 });
    if (user.emailVerified) return NextResponse.json({ ok: true, message: "آپ کی ای میل پہلے ہی تصدیق شدہ ہے" });
    try {
      const token = crypto.randomBytes(24).toString("hex");
      await db.user.update({
        where: { id: user.id },
        data: { verifyToken: token, verifyTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      });
      const settings = await getSettings();
      const base = siteUrlFrom(req, settings);
      await queueMail({
        kind: "VERIFY",
        to: user.email,
        data: { authorName: user.name, title: "", url: `${base}/verify?token=${token}` },
        relatedType: "user",
        relatedId: user.id,
      });
      await logActivity("verify-resend", user.email, user.email);
      return NextResponse.json({ ok: true, message: "تصدیقی ای میل بھیج دی گئی — اپنا ان باکس چیک کریں" });
    } catch (e) {
      return NextResponse.json({ error: "ای میل بھیجنے میں خرابی", detail: String(e) }, { status: 500 });
    }
  }

  // public password-recovery request: queues a token valid 30 minutes and
  // emails the reset link through the configured mail service.
  if (action === "request-reset") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const email = (body.email ?? "").trim().toLowerCase();
      const generic = { ok: true, message: "اگر یہ ای میل درج ہے تو بازیابی کی درخواست موصول ہو گئی ہے۔ براہ کرم ایڈمنسٹریٹر سے رابطہ کریں۔" };
      if (!email) return NextResponse.json(generic);
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        const token = crypto.randomBytes(24).toString("hex");
        await db.user.update({
          where: { id: user.id },
          data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000) },
        });
        const settings = await getSettings();
        const base = siteUrlFrom(req, settings);
        await queueMail({
          kind: "RESET",
          to: email,
          data: { authorName: user.name, title: "", url: `${base}/reset-password?token=${token}` },
          relatedType: "user",
          relatedId: user.id,
        });
        await logActivity("reset-request", email, email);
      }
      return NextResponse.json(generic);
    } catch {
      return NextResponse.json({ ok: true });
    }
  }

  // consume a reset token and set a new password
  if (action === "reset-password") {
    try {
      const body = (await req.json()) as Record<string, string>;
      const token = String(body.token ?? "");
      const password = String(body.password ?? "");
      if (!token || password.length < 6) {
        return NextResponse.json({ error: "ٹوکن اور نئی پاس ورڈ (کم از کم 6 حروف) ضروری ہیں" }, { status: 400 });
      }
      const user = await db.user.findFirst({
        where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
      });
      if (!user) {
        return NextResponse.json({ error: "ٹوکن غلط یا میعاد ختم ہے" }, { status: 400 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password), resetToken: null, resetTokenExpiry: null, mustChangePassword: false },
      });
      await logActivity("reset-consumed", user.email, user.email);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: "بازیابی میں خرابی", detail: String(e) }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 404 });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;
  if (action === "me") {
    const user = await getSessionUser();
    return NextResponse.json(user);
  }
  return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 404 });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;
  if (action !== "profile") {
    return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 404 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لاگ اِن کریں" }, { status: 401 });
  try {
    const body = (await req.json()) as Record<string, string>;
    const data: Record<string, string | null> = {};
    for (const k of ["name", "penName", "bio", "photoUrl"]) {
      if (k in body) data[k] = body[k]?.trim() || null;
      if (k === "name" && body.name?.trim()) data[k] = body.name.trim();
    }
    const updated = await db.user.update({ where: { id: user.id }, data });
    const { passwordHash: _p, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: "پروفائل اپ ڈیٹ میں خرابی", detail: String(e) }, { status: 400 });
  }
}
