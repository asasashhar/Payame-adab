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
import { ArticleCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/site/share-button";
import { Download, Eye } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getArticle(id: string) {
  try {
    const article = await db.article.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, penName: true } } },
    });
    if (!article) return null;
    if (article.status !== "PUBLISHED") {
      const me = await getSessionUser();
      const allowed = me && (me.role === "ADMIN" || me.id === article.userId);
      if (!allowed) return null;
    }
    return article;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  return { title: article ? article.title : "مضمون" };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, settings] = await Promise.all([getArticle(id), getSettings()]);
  if (!article) notFound();

  const related = await db.article.findMany({
    where: { status: "PUBLISHED", category: article.category, id: { not: article.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const wm = watermarkFromSettings(settings);
  const wmOn = wm.enabled && wm.types.includes("article");
  const showViews = settings.showViewCounts !== "0";
  const author = article.authorName ?? article.user?.penName ?? article.user?.name ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ViewTracker type="article" id={article.id} />
      <main className="flex-1 paper-bg">
        <article className="mx-auto max-w-4xl px-4 py-10">
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
            <nav className="text-xs font-naskh text-muted-foreground">
              <Link href="/" className="hover:text-primary">ہوم</Link> / <Link href="/articles" className="hover:text-primary">مضامین</Link> / <span className="text-primary">{article.category}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              {showViews && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card px-3 py-1.5 text-sm font-latin text-muted-foreground" dir="ltr">
                  <Eye className="h-4 w-4" /> {article.views}
                </span>
              )}
              <LikeButton resourceType="article" resourceId={article.id} enabled={settings.likesEnabled !== "0"} showCount={settings.showLikeCounts !== "0"} />
              <Button asChild className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
                <a href={`/articles/${article.id}/print`} target="_blank" rel="noopener">
                  <Download className="h-4 w-4" /> پی ڈی ایف ڈاؤن لوڈ کریں
                </a>
              </Button>
              <ShareButton title={article.title} />
            </div>
          </div>

          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] px-6 py-10 sm:px-10 md:px-14">
            {wmOn && <Watermark config={wm} />}
            <header className="relative z-10 text-center">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-naskh text-primary">{article.category}</span>
              <h1 className="mt-3 font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink md:text-4xl">
                {article.title}
              </h1>
              {author && <p className="mt-1 font-naskh text-base text-gold">تحریر: {author}</p>}
              <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden>
                <span className="h-px w-20 bg-gold/50" />
                <span className="h-2 w-2 rotate-45 border border-gold" />
                <span className="h-px w-20 bg-gold/50" />
              </div>
            </header>

            {article.topicImageUrl && (
               
              <img src={article.topicImageUrl} alt={article.title} className="relative z-10 mx-auto mt-6 max-h-96 rounded-lg object-cover" />
            )}

            <div className="relative z-10 mt-8">
              <p className="mb-6 border-s-4 border-gold bg-accent/60 px-4 py-3 font-naskh text-[15px] leading-8 text-foreground/85">
                {article.excerpt}
              </p>
              {article.content.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} className="literary-content text-justify text-[17px]">
                  {para.trim()}
                </p>
              ))}
            </div>

            <p className="relative z-10 mt-8 border-t border-gold/25 pt-3 text-center text-xs font-latin text-muted-foreground">
              {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en-GB")} · پیامِ ادب
            </p>
          </div>

          {/* comments */}
          <div className="no-print mt-10">
            <Comments
              resourceType="article"
              resourceId={article.id}
              enabled={settings.commentsEnabled !== "0"}
              guestsAllowed={settings.commentsGuests !== "0"}
            />
          </div>

          {related.length > 0 && (
            <section className="no-print mt-10">
              <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">متعلقہ مضامین</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} showViews={showViews} />
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
