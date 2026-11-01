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
import { Megaphone, Eye } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getNews(id: string) {
  const item = await db.news.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, penName: true } } },
  });
  if (!item) return null;
  if (item.status !== "PUBLISHED") {
    const me = await getSessionUser();
    const allowed = me && (me.role === "ADMIN" || me.id === item.userId);
    if (!allowed) return null;
  }
  return item;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getNews(id);
  return { title: item ? item.title : "خبر" };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, settings] = await Promise.all([getNews(id), getSettings()]);
  if (!item) notFound();

  const wm = watermarkFromSettings(settings);
  const wmOn = wm.enabled && wm.types.includes("news");
  const showViews = settings.showViewCounts !== "0";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ViewTracker type="news" id={item.id} />
      <main className="flex-1 paper-bg">
        <article className="mx-auto max-w-4xl px-4 py-10">
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
            <nav className="text-xs font-naskh text-muted-foreground">
              <Link href="/" className="hover:text-primary">ہوم</Link> / <Link href="/news" className="hover:text-primary">ادبی خبریں</Link> / <span className="text-primary">{item.category}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              {showViews && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card px-3 py-1.5 text-sm font-latin text-muted-foreground" dir="ltr">
                  <Eye className="h-4 w-4" /> {item.views}
                </span>
              )}
              <LikeButton resourceType="news" resourceId={item.id} enabled={settings.likesEnabled !== "0"} showCount={settings.showLikeCounts !== "0"} />
            </div>
          </div>

          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] px-6 py-10 sm:px-10 md:px-14">
            {wmOn && <Watermark config={wm} />}
            <header className="relative z-10 text-center">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-naskh text-primary">{item.category}</span>
              <h1 className="mt-3 font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink md:text-4xl">
                {item.title}
              </h1>
              {item.excerpt && (
                <p className="mx-auto mt-3 max-w-2xl border-s-4 border-gold bg-accent/60 px-4 py-3 text-start font-naskh text-[15px] leading-8 text-foreground/85">
                  {item.excerpt}
                </p>
              )}
              <p className="mt-3 font-naskh text-sm text-muted-foreground">
                {item.sourceName ?? "پیامِ ادب"} · <span className="font-latin" dir="ltr">{new Date(item.publishedAt ?? item.createdAt).toLocaleDateString("en-GB")}</span>
              </p>
            </header>

            {!item.coverUrl && (
              <div className="relative z-10 mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full bg-secondary">
                <Megaphone className="h-12 w-12 text-gold" />
              </div>
            )}
            {item.coverUrl && (
               
              <img src={item.coverUrl} alt={item.title} className="relative z-10 mx-auto mt-6 max-h-[26rem] rounded-lg object-cover" />
            )}

            <div className="relative z-10 mt-8">
              {item.content.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} className="literary-content text-justify text-[17px]">
                  {para.trim()}
                </p>
              ))}
            </div>

            <p className="relative z-10 mt-8 border-t border-gold/25 pt-3 text-center text-xs font-latin text-muted-foreground">
              {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString("en-GB")} · پیامِ ادب
            </p>
          </div>

          <div className="no-print mt-10">
            <Comments
              resourceType="news"
              resourceId={item.id}
              enabled={settings.commentsEnabled !== "0"}
              guestsAllowed={settings.commentsGuests !== "0"}
            />
          </div>
        </article>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
