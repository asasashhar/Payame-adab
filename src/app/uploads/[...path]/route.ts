import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", pdf: "application/pdf",
};

/**
 * GET /uploads/<year-month>/<file> — serves runtime-uploaded files from disk.
 * The production standalone server only serves public/ assets that existed at
 * build time, so uploads created after a build need this handler. Falls back
 * across both candidate roots (standalone cwd and project root).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  // strict safety: no traversal, exactly two segments (YYYY-MM/name.ext)
  if (parts.length !== 2 || rel.includes("..") || rel.includes("\\")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const [dir, name] = parts;
  if (!/^\d{4}-\d{2}$/.test(dir) || !/^[\w.-]+$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cwd = process.cwd();
  const candidates = [path.join(cwd, "public", "uploads", dir, name)];
  const normCwd = cwd.replace(/[\\/]+$/, "");
  if (normCwd.endsWith(".next/standalone") || normCwd.endsWith(".next\\standalone")) {
    candidates.push(path.join(path.resolve(cwd, "..", ".."), "public", "uploads", dir, name));
  }

  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;
      const ext = (name.split(".").pop() ?? "").toLowerCase();
      const type = MIME[ext] ?? "application/octet-stream";
      const stream = fs.readFileSync(file);
      return new NextResponse(new Uint8Array(stream), {
        status: 200,
        headers: {
          "Content-Type": type,
          "Content-Length": String(stat.size),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch { /* try next candidate */ }
  }
  return new NextResponse("Not found", { status: 404 });
}
