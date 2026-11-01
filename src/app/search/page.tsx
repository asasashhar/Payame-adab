import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { PoemCard, ArticleCard, BookCard, poemPreview, excerptPreview } from "@/components/site/cards";
import { SearchX } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "تلاش" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = (fields: string[]) => ({
    OR: fields.map((f) => ({ [f]: { contains: query } })),
  });

  const [poems, articles, books, poets] = query
    ? await Promise.all([
        db.poem.findMany({ where: { status: "PUBLISHED", ...where(["title", "content", "poetName"]) }, take: 8, orderBy: { views: "desc" } }),
        db.article.findMany({ where: { status: "PUBLISHED", ...where(["title", "content", "authorName"]) }, take: 8, orderBy: { views: "desc" } }),
        db.book.findMany({ where: where(["title", "author", "description"]), take: 8 }),
        db.poet.findMany({ where: where(["name", "takhallus", "bio"]), take: 8 }),
      ])
    : [[], [], [], []];

  const total = poems.length + articles.length + books.length + poets.length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="تلاش کے نتائج" subtitle={query ? `«${query}» کے لیے ${total} نتائج` : "کوئی لفظ درج نہیں کیا گیا"} />

          {!query || total === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">
                {query ? "کوئی نتیجہ نہیں ملا — دوسرے الفاظ سے کوشش کریں" : "اوپر والے خانے میں لکھ کر تلاش کریں"}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {poems.length > 0 && (
                <section>
                  <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">شاعری ({poems.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {poems.map((p) => <PoemCard key={p.id} poem={p} />)}
                  </div>
                </section>
              )}
              {articles.length > 0 && (
                <section>
                  <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">مضامین ({articles.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </section>
              )}
              {books.length > 0 && (
                <section>
                  <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">کتب ({books.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {books.map((b) => <BookCard key={b.id} book={b} />)}
                  </div>
                </section>
              )}
              {poets.length > 0 && (
                <section>
                  <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">شعرا و ادبا ({poets.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {poets.map((p) => (
                      <Link key={p.id} href={`/poets/${p.id}`} className="manuscript-frame group rounded-xl bg-card p-4 hover:shadow-md">
                        <h3 className="font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{p.name}</h3>
                        <p className="line-clamp-2 text-sm leading-6 text-foreground/70 font-naskh">{excerptPreview(p.bio ?? "", 20)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
