import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAdminPerm, logActivity } from "@/lib/auth";
import fs from "fs";
import path from "path";

/**
 * SQLite database backup management (admin only).
 * - GET  ?action=list          → list existing backups (name, size, date)
 * - GET  ?file=<name>          → download one backup file
 * - POST                       → create a fresh consistent snapshot (VACUUM INTO)
 * - DELETE ?file=<name>        → delete one backup file
 */
const NAME_RE = /^payameadab-\d{4}-\d{2}-\d{2}-\d{6}\.db$/;

/** Resolve the real db/ directory from DATABASE_URL (absolute file: path), falling back to cwd. */
function dbDir(): string {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("file:")) {
    const p = url.slice(5).split("?")[0];
    if (path.isAbsolute(p)) return path.dirname(p);
  }
  return path.join(process.cwd(), "db");
}

const BACKUP_DIR = path.join(dbDir(), "backups");

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function safeFile(name: string | null): string | null {
  if (!name || !NAME_RE.test(name)) return null;
  const full = path.join(BACKUP_DIR, name);
  if (!full.startsWith(BACKUP_DIR)) return null; // path traversal guard
  return full;
}

async function guard() {
  const admin = await requireAdmin();
  if (!admin) return null;
  if (!(await requireAdminPerm(admin, "settings"))) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });

  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (file) {
    const full = safeFile(file);
    if (!full || !fs.existsSync(full)) {
      return NextResponse.json({ error: "بیک اپ نہیں ملا" }, { status: 404 });
    }
    const buf = fs.readFileSync(full);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
        "Content-Length": String(buf.length),
      },
    });
  }

  ensureDir();
  const list = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => NAME_RE.test(f))
    .map((f) => {
      const st = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: st.size, createdAt: st.mtime.toISOString() };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
  return NextResponse.json({ backups: list });
}

export async function POST(req: NextRequest) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });

  try {
    ensureDir();
    const name = `payameadab-${stamp()}.db`;
    const target = path.join(BACKUP_DIR, name);
    await db.$executeRawUnsafe(`VACUUM INTO '${target}'`);
    const size = fs.statSync(target).size;
    await logActivity("backup", `${name} (${size} bytes)`, admin.email);
    return NextResponse.json({ ok: true, name, size });
  } catch (e) {
    return NextResponse.json({ error: "بیک اپ نہیں بنا سکے", detail: String(e).slice(0, 300) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "اجازت نہیں" }, { status: 403 });

  const url = new URL(req.url);
  const full = safeFile(url.searchParams.get("file"));
  if (!full || !fs.existsSync(full)) {
    return NextResponse.json({ error: "بیک اپ نہیں ملا" }, { status: 404 });
  }
  fs.unlinkSync(full);
  await logActivity("backup-delete", path.basename(full), admin.email);
  return NextResponse.json({ ok: true });
}
