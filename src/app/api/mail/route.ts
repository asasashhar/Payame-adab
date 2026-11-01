import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireAdminPerm, logActivity } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { attemptSend, queueMail, renderMail } from "@/lib/mailer";

/**
 * GET /api/mail — Mail Center data: settings (secrets masked),
 * counters and the latest 200 log rows. Admin, permission: mail.
 * GET /api/mail?id=<mailLogId> — single row incl. full HTML body (preview).
 */
export async function GET(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "mail"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }

  // single mail with body (preview)
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const row = await db.mailLog.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "ریکارڈ نہیں ملا" }, { status: 404 });
    return NextResponse.json({
      id: row.id, toEmail: row.toEmail, subject: row.subject, kind: row.kind,
      status: row.status, bodyHtml: row.bodyHtml, error: row.error,
      attempts: row.attempts, createdAt: row.createdAt, sentAt: row.sentAt,
    });
  }

  const s = await getSettings();
  const [logs, counts] = await Promise.all([
    db.mailLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.mailLog.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counters = { SENT: 0, FAILED: 0, PENDING: 0 };
  for (const c of counts) counters[c.status as keyof typeof counters] = c._count._all;
  return NextResponse.json({
    smtpConfigured: Boolean((s.smtpHost ?? "").trim()) && s.mailEnabled === "1",
    smtpHost: s.smtpHost ?? "",
    smtpPort: s.smtpPort ?? "587",
    smtpUser: s.smtpUser ?? "",
    smtpFrom: s.smtpFrom ?? "",
    mailEnabled: s.mailEnabled === "1",
    counters,
    logs: logs.map((l) => ({
      id: l.id, toEmail: l.toEmail, subject: l.subject, kind: l.kind, status: l.status,
      error: l.error, attempts: l.attempts, createdAt: l.createdAt, sentAt: l.sentAt,
      relatedType: l.relatedType, relatedId: l.relatedId,
    })),
  });
}

/**
 * POST /api/mail — operations:
 *  - { op: "save-smtp", ...smtp fields }  (also mailEnabled)
 *  - { op: "send-test", to }
 *  - { op: "resend", id }
 */
export async function POST(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "mail"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const op = String(body.op ?? "");

    if (op === "save-smtp") {
      const upserts: { key: string; value: string }[] = [];
      const fields: [string, unknown][] = [
        ["mailEnabled", body.mailEnabled === false ? "0" : "1"],
        ["smtpHost", String(body.smtpHost ?? "").trim()],
        ["smtpPort", String(Number(body.smtpPort ?? 587) || 587)],
        ["smtpSecure", body.smtpSecure === "1" || body.smtpSecure === true ? "1" : "0"],
        ["smtpUser", String(body.smtpUser ?? "").trim()],
        ["smtpFrom", String(body.smtpFrom ?? "").trim()],
      ];
      for (const [key, value] of fields) upserts.push({ key, value: String(value) });
      // only overwrite the password when a new one is provided (never blank it accidentally)
      if (typeof body.smtpPass === "string" && body.smtpPass.length > 0) {
        upserts.push({ key: "smtpPass", value: body.smtpPass });
      }
      for (const u of upserts) {
        await db.setting.upsert({ where: { key: u.key }, create: u, update: { value: u.value } });
      }
      await logActivity("mail-settings", `host=${String(body.smtpHost ?? "")}`, admin.email);
      return NextResponse.json({ ok: true });
    }

    if (op === "send-test") {
      const to = String(body.to ?? admin.email).trim();
      const settings = await getSettings();
      const rendered = renderMail("TEST", { authorName: admin.name, title: "" }, settings.siteUrl ?? "");
      const row = await db.mailLog.create({
        data: {
          toEmail: to, subject: rendered.subject, bodyHtml: rendered.html,
          kind: "TEST", status: "PENDING", relatedType: "user", relatedId: admin.id,
        },
      });
      const ok = await attemptSend(row.id, settings);
      return NextResponse.json({ ok, id: row.id });
    }

    if (op === "resend") {
      const id = String(body.id ?? "");
      const row = await db.mailLog.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "نہیں ملا" }, { status: 404 });
      const ok = await attemptSend(id);
      return NextResponse.json({ ok });
    }

    if (op === "delete") {
      const id = String(body.id ?? "");
      await db.mailLog.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "نامعلوم کارروائی" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "کارروائی میں خرابی", detail: String(e) }, { status: 400 });
  }
}
