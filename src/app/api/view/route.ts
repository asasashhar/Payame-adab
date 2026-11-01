import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getOrCreateVisitorId } from "@/lib/visitor";

const RESOURCE_PUBLISHED: Record<string, Record<string, unknown>> = {
  poem: { status: "PUBLISHED" },
  article: { status: "PUBLISHED" },
  book: {},
  news: { status: "PUBLISHED" },
};

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Records a real page view:
 *  - PageView row (for analytics; deduped per visitor per resource per day)
 *  - resource.views counter (only on first view by that visitor that day)
 * Also publishes any scheduled content whose time has arrived (lightweight cron substitute).
 */
export async function POST(req: NextRequest) {
  try {
    const { type, id, path, referrer } = (await req.json()) as {
      type?: string; id?: string; path?: string; referrer?: string;
    };
    const store = await cookies();
    let vid = store.get("pea_vid")?.value;
    if (!vid) {
      vid = crypto.randomUUID();
      try {
        store.set("pea_vid", vid, {
          httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
        });
      } catch { /* ignore */ }
    }
    const visitorId = vid ?? (await getOrCreateVisitorId());
    const today = dayKey();

    if (id && type && RESOURCE_PUBLISHED[type]) {
      const model = type as "poem" | "article" | "book" | "news";
      const delegate = db[model] as {
        findFirst: (a: unknown) => Promise<{ id: string } | null>;
        update: (a: unknown) => Promise<unknown>;
      };
      const exists = await delegate.findFirst({ where: { id, ...RESOURCE_PUBLISHED[type] } });
      if (exists) {
        const dupe = await db.pageView.findFirst({
          where: { resourceType: type, resourceId: id, visitorId, day: today },
        });
        if (!dupe) {
          await db.pageView.create({
            data: {
              path: path ?? `/${type}/${id}`,
              resourceType: type,
              resourceId: id,
              visitorId,
              referrer: referrer?.slice(0, 300) || null,
              day: today,
            },
          });
          await delegate.update({ where: { id }, data: { views: { increment: 1 } } });
        }
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: false });
    }

    // generic page view (homepage, lists, …)
    if (path) {
      const dupe = await db.pageView.findFirst({
        where: { path, visitorId, day: today, resourceType: null },
      });
      if (!dupe) {
        await db.pageView.create({
          data: {
            path: path.slice(0, 300),
            resourceType: null,
            resourceId: null,
            visitorId,
            referrer: referrer?.slice(0, 300) || null,
            day: today,
          },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
