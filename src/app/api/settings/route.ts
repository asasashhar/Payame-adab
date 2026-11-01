import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAdminPerm, logActivity } from "@/lib/auth";
import { getSettings, ALL_SETTING_KEYS } from "@/lib/site";

/** Secrets that must never leave the server via the generic settings API. */
const SECRET_KEYS = new Set(["smtpPass"]);

export async function GET() {
  const settings = await getSettings();
  for (const k of SECRET_KEYS) delete settings[k];
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });
  if (!(await requireAdminPerm(admin, "settings"))) {
    return NextResponse.json({ error: "اس حصے کی اجازت آپ کو نہیں ہے" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const allowed = ALL_SETTING_KEYS;
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.includes(k)) continue;
      await db.setting.upsert({
        where: { key: k },
        update: { value: String(v) },
        create: { key: k, value: String(v) },
      });
    }
    await logActivity("settings", Object.keys(body).join(","), admin.email);
    const settings = await getSettings();
    for (const k of SECRET_KEYS) delete settings[k];
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: "محفوظ کرنے میں خرابی", detail: String(e) }, { status: 400 });
  }
}
