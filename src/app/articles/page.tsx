import Link from "next/link";
import { db } from "@/lib/db";
import { ARTICLE_CATEGORIES } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { ArticleCard } from "@/components/site/cards";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "مضامین و تحقیق" };

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "تمام") where.category = category;
  if (q) {
    where.OR = [{ title: { contains: q } }, { content: { contains: q } }, { authorName: { contains: q } }];
  }
  const articles = await db.article.findMany({ where, orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="مضامین" subtitle="ادبی، تحقیقی اور تنقیدی تحریریں" />

          <div className="mb-6 flex flex-wrap gap-2">
            {["تمام", ...ARTICLE_CATEGORIES].map((c) => (
              <Link
                key={c}
                href={c === "تمام" ? "/articles" : `/articles?category=${encodeURIComponent(c)}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-naskh transition-colors",
                  (category ?? "تمام") === c
                    ? "border-emerald-deep bg-emerald-deep text-[#f3ead2]"
                    : "border-gold/40 bg-card text-foreground/80 hover:border-gold hover:text-primary"
                )}
              >
                {c}
              </Link>
            ))}
          </div>

          {articles.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">اس خانے میں ابھی کوئی مضمون شائع نہیں ہوا</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">نئی تحریریں جلد آ رہی ہیں۔</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
