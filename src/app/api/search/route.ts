import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ poems: [], articles: [], books: [], poets: [] });

  const [poems, articles, books, poets] = await Promise.all([
    db.poem.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { poetName: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { views: "desc" },
    }),
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { authorName: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { views: "desc" },
    }),
    db.book.findMany({
      where: {
        OR: [{ title: { contains: q } }, { author: { contains: q } }, { description: { contains: q } }],
      },
      take: 10,
    }),
    db.poet.findMany({
      where: {
        OR: [{ name: { contains: q } }, { takhallus: { contains: q } }, { bio: { contains: q } }],
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ poems, articles, books, poets });
}
