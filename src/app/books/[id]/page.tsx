import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings, watermarkFromSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Watermark } from "@/components/site/watermark";
import { ViewTracker } from "@/components/site/view-tracker";
import { LikeButton } from "@/components/site/like-button";
import { Comments } from "@/components/site/comments";
import { BookCard } from "@/components/site/cards";
import { BookOpen, CalendarDays, Eye, FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "کتاب" };

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, settings] = await Promise.all([db.book.findUnique({ where: { id } }), getSettings()]);
  if (!book) notFound();

  const related = await db.book.findMany({
    where: { category: book.category, id: { not: book.id } },
    take: 4,
  });

  const wm = watermarkFromSettings(settings);
  const wmOn = wm.enabled && wm.types.includes("book");
  const showViews = settings.showViewCounts !== "0";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ViewTracker type="book" id={book.id} />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <nav className="mb-6 text-xs font-naskh text-muted-foreground">
            <Link href="/" className="hover:text-primary">ہوم</Link> / <Link href="/books" className="hover:text-primary">کتب خانہ</Link> / <span className="text-primary">{book.category}</span>
          </nav>

          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] p-6 sm:p-10">
            {wmOn && <Watermark config={wm} />}
            <div className="relative z-10 grid gap-8 md:grid-cols-[240px_1fr]">
              <div>
                {book.coverUrl ? (
                   
                  <img src={book.coverUrl} alt={book.title} className="w-full rounded-lg border border-gold/30 shadow-md object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-gold/30 bg-secondary">
                    <BookOpen className="h-14 w-14 text-gold" />
                  </div>
                )}
              </div>
              <div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-naskh text-primary">{book.category}</span>
                <h1 className="mt-3 font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink">{book.title}</h1>
                <p className="mt-1 font-nastaliq-tight text-xl text-gold">{book.author}</p>
                <div className="mt-4 space-y-1.5 text-sm font-naskh text-muted-foreground">
                  {book.translator && <p>مترجم: {book.translator}</p>}
                  {book.year && (
                    <p className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" /> اشاعت: <span className="font-latin">{book.year}</span></p>
                  )}
                  {book.pages && (
                    <p className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-gold" /> صفحات: <span className="font-latin">{book.pages}</span></p>
                  )}
                  {showViews && (
                    <p className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-gold" /> مطالعہ: <span className="font-latin">{book.views}</span></p>
                  )}
                </div>
                {book.description && (
                  <div className="mt-5 border-t border-gold/25 pt-4">
                    {book.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                      <p key={i} className="literary-content text-justify text-[16px]">{para.trim()}</p>
                    ))}
                  </div>
                )}
                <div className="mt-5">
                  <LikeButton resourceType="book" resourceId={book.id} enabled={settings.likesEnabled !== "0"} showCount={settings.showLikeCounts !== "0"} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Comments
              resourceType="book"
              resourceId={book.id}
              enabled={settings.commentsEnabled !== "0"}
              guestsAllowed={settings.commentsGuests !== "0"}
            />
          </div>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">متعلقہ کتب</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((b) => (
                  <BookCard key={b.id} book={b} showViews={showViews} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
