import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeTaqti } from "@/lib/taqti";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text?: string };
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "شعر درج کریں" }, { status: 400 });

    const custom = await db.behr.findMany({
      where: { pattern: { not: "" } },
      select: { name: true, pattern: true },
    });
    const result = analyzeTaqti(
      text,
      custom.map((c) => ({ name: c.name, pattern: c.pattern }))
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "تجزیے میں خرابی", detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const behrs = await db.behr.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(behrs);
}
