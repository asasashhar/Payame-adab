import Link from "next/link";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export type AdItem = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  slot: string;
  width: string | null;
};

/**
 * Sticky advertisement rail for the homepage's empty side columns.
 * Renders nothing (clean space) when no active ad exists for the slot.
 */
export async function AdRail({
  slot,
  className,
  maxWidth,
  side = "start",
}: {
  slot: "LEFT" | "RIGHT";
  className?: string;
  maxWidth: number;
  side?: "start" | "end";
}) {
  let ads: AdItem[] = [];
  try {
    ads = await db.advertisement.findMany({
      where: { slot, active: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    });
  } catch {
    ads = [];
  }
  if (!ads.length) return null;

  return (
    <aside
      className={cn(
        "hidden w-[240px] shrink-0 xl:block 2xl:w-[300px]",
        side === "start" ? "order-first" : "order-last",
        className
      )}
      aria-label={slot === "LEFT" ? "بایاں اشتہارات" : "دایاں اشتہارات"}
    >
      <div className="sticky top-6 flex flex-col gap-4 pb-8">
        <p className="text-center text-[11px] font-naskh tracking-wide text-muted-foreground/70">
          — اشتہار —
        </p>
        {ads.map((ad) => {
          const w = Math.min(Number(ad.width ?? 0) || maxWidth, 360);
          const img = (
             
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-auto w-full rounded-xl border border-gold/30 bg-card object-contain shadow-md transition-shadow hover:shadow-lg"
              style={{ maxWidth: `${w}px` }}
              loading="lazy"
            />
          );
          return (
            <div key={ad.id} className="flex justify-center">
              {ad.linkUrl ? (
                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  title={ad.title}
                  className="block transition-transform hover:scale-[1.015]"
                >
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/** Compact inline (client-safe) ad list used on other pages if needed. */
export function AdList({ ads, maxWidth }: { ads: AdItem[]; maxWidth: number }) {
  if (!ads.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {ads.map((ad) => (
        <Link key={ad.id} href={ad.linkUrl || "#"} target={ad.linkUrl ? "_blank" : undefined} rel="noopener noreferrer">
          { }
          <img src={ad.imageUrl} alt={ad.title} className="h-auto w-full rounded-lg border border-gold/30 object-contain" style={{ maxWidth: `${Math.min(Number(ad.width ?? 0) || maxWidth, 360)}px` }} loading="lazy" />
        </Link>
      ))}
    </div>
  );
}
