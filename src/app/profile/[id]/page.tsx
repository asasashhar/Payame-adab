import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { PoemCard, ArticleCard } from "@/components/site/cards";

export const dynamic = "force-dynamic";
export const metadata = { title: "مصنف کی پروفائل" };

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const [poems, articles] = await Promise.all([
    db.poem.findMany({ where: { userId: user.id, status: "PUBLISHED" }, orderBy: { createdAt: "desc" } }),
    db.article.findMany({ where: { userId: user.id, status: "PUBLISHED" }, orderBy: { createdAt: "desc" } }),
  ]);

  const totalViews =
    (await db.poem.aggregate({ _sum: { views: true }, where: { userId: user.id } }))._sum.views ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* header card */}
          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-card p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {user.photoUrl ? (
                 
                <img src={user.photoUrl} alt={user.name} className="h-28 w-28 rounded-full border-4 border-gold/40 object-cover shadow-md" />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold/40 bg-secondary font-nastaliq-tight text-3xl text-primary">
                  {(user.penName || user.name)[0]}
                </span>
              )}
              <div className="flex-1 text-center sm:text-start">
                <h1 className="font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink">
                  {user.penName || user.name}
                </h1>
                {user.penName && user.name && (
                  <p className="font-naskh text-sm text-muted-foreground">اصل نام: {user.name}</p>
                )}
                {user.bio && (
                  <p className="mx-auto mt-2 max-w-2xl font-naskh text-sm leading-8 text-foreground/80 sm:mx-0">
                    {user.bio}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
                  <span className="rounded-full bg-accent px-4 py-1 font-naskh text-primary">
                    {poems.length + articles.length} شائع شدہ تحریریں
                  </span>
                  <span className="rounded-full bg-accent px-4 py-1 font-naskh text-primary">
                    {totalViews} مطالعے
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <SectionHeading title="شاعری" href="/poetry" />
            {poems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gold/40 bg-card p-8 text-center font-naskh text-sm text-muted-foreground">
                ابھی کوئی شاعری شائع نہیں ہوئی۔
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {poems.map((p) => <PoemCard key={p.id} poem={p} />)}
              </div>
            )}
          </section>

          <section className="mt-10">
            <SectionHeading title="مضامین" href="/articles" />
            {articles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gold/40 bg-card p-8 text-center font-naskh text-sm text-muted-foreground">
                ابھی کوئی مضمون شائع نہیں ہوا۔
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
