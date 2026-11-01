import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSettings, watermarkFromSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Watermark } from "@/components/site/watermark";
import { ViewTracker } from "@/components/site/view-tracker";
import { LikeButton } from "@/components/site/like-button";
import { Comments } from "@/components/site/comments";
import { PoemCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/site/share-button";
import { Download, Eye } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getPoem(id: string) {
  try {
    const poem = await db.poem.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, penName: true } } },
    });
    if (!poem) return null;
    if (poem.status !== "PUBLISHED") {
      const me = await getSessionUser();
      const allowed = me && (me.role === "ADMIN" || me.id === poem.userId);
      if (!allowed) return null;
    }
    return poem;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const poem = await getPoem(id);
  return { title: poem ? poem.title : "شاعری" };
}

export default async function PoemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [poem, settings] = await Promise.all([getPoem(id), getSettings()]);
  if (!poem) notFound();

  const related = await db.poem.findMany({
    where: { status: "PUBLISHED", category: poem.category, id: { not: poem.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const wm = watermarkFromSettings(settings);
  const wmOn = wm.enabled && wm.types.includes("poem");
  const showViews = settings.showViewCounts !== "0";
  const poetLabel = poem.poetName ?? poem.user?.penName ?? poem.user?.name ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ViewTracker type="poem" id={poem.id} />
      <main className="flex-1 paper-bg">
        <article className="mx-auto max-w-4xl px-4 py-10">
          {/* action bar */}
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
            <nav className="text-xs font-naskh text-muted-foreground">
              <Link href="/" className="hover:text-primary">ہوم</Link> / <Link href="/poetry" className="hover:text-primary">شاعری</Link> / <span className="text-primary">{poem.category}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              {showViews && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card px-3 py-1.5 text-sm font-latin text-muted-foreground" dir="ltr">
                  <Eye className="h-4 w-4" /> {poem.views}
                </span>
              )}
              <LikeButton resourceType="poem" resourceId={poem.id} enabled={settings.likesEnabled !== "0"} showCount={settings.showLikeCounts !== "0"} />
              <Button asChild className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
                <a href={`/poetry/${poem.id}/print`} target="_blank" rel="noopener">
                  <Download className="h-4 w-4" /> پی ڈی ایف ڈاؤن لوڈ کریں
                </a>
              </Button>
              <ShareButton title={poem.title} />
            </div>
          </div>

          {/* content sheet with the official logo watermark */}
          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] px-6 py-10 sm:px-10 md:px-14">
            {wmOn && <Watermark config={wm} />}
            <header className="relative z-10 text-center">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-naskh text-primary">{poem.category}</span>
              <h1 className="mt-3 font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink md:text-4xl">
                {poem.title}
              </h1>
              {poetLabel && (
                <Link
                  href={poem.poetId ? `/poets/${poem.poetId}` : `/search?q=${encodeURIComponent(poetLabel)}`}
                  className="mt-1 inline-block font-naskh text-base text-gold hover:text-primary"
                >
                  — {poetLabel}
                </Link>
              )}
              <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden>
                <span className="h-px w-20 bg-gold/50" />
                <span className="h-2 w-2 rotate-45 border border-gold" />
                <span className="h-px w-20 bg-gold/50" />
              </div>
            </header>

            {poem.topicImageUrl && (
               
              <img src={poem.topicImageUrl} alt={poem.title} className="relative z-10 mx-auto mt-6 max-h-96 rounded-lg object-cover" />
            )}

            <div className="relative z-10 mt-8 literary-content text-center">
              {poem.content.split(/\n\s*\n/).filter(Boolean).map((couplet, i) => (
                <p key={i} className="couplet whitespace-pre-line">
                  {couplet.trim()}
                </p>
              ))}
            </div>

            {poetLabel && (
              <p className="relative z-10 mt-8 text-center font-nastaliq-tight text-lg text-gold">
                — {poetLabel}
              </p>
            )}
            <p className="relative z-10 mt-6 border-t border-gold/25 pt-3 text-center text-xs font-latin text-muted-foreground">
              {new Date(poem.publishedAt ?? poem.createdAt).toLocaleDateString("en-GB")} · پیامِ ادب
            </p>
          </div>

          {/* comments */}
          <div className="no-print mt-10">
            <Comments
              resourceType="poem"
              resourceId={poem.id}
              enabled={settings.commentsEnabled !== "0"}
              guestsAllowed={settings.commentsGuests !== "0"}
            />
          </div>

          {/* related */}
          {related.length > 0 && (
            <section className="no-print mt-10">
              <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">متعلقہ شاعری</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <PoemCard key={p.id} poem={p} showViews={showViews} />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
