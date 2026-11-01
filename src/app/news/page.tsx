import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { PageViewTracker } from "@/components/site/view-tracker";
import { Megaphone, Eye } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "ادبی خبریں" };

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const categories = (settings.newsCategories ?? "ادبی خبریں").split(",").map((x) => x.trim()).filter(Boolean);
  const category = sp.category;
  const perPage = 12;
  const page = Math.max(1, Number(sp.page ?? 1));

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "تمام") where.category = category;

  const [items, total] = await Promise.all([
    db.news.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    db.news.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const showViews = settings.showViewCounts !== "0";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageViewTracker />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <header className="mb-8 text-center">
            <h1 className="font-nastaliq-tight text-4xl leading-[1.9] text-emerald-ink">ادبی خبریں</h1>
            <p className="mt-1 font-naskh text-sm text-muted-foreground">
              ادبی دنیا کی تازہ خبریں، اعلانات اور اعزازات
            </p>
          </header>

          <nav className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/news"
              className={`rounded-full px-4 py-1.5 text-sm font-naskh transition-colors ${!category ? "bg-primary text-primary-foreground" : "border border-gold/40 bg-card hover:bg-accent"}`}
            >
              تمام
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/news?category=${encodeURIComponent(c)}`}
                className={`rounded-full px-4 py-1.5 text-sm font-naskh transition-colors ${category === c ? "bg-primary text-primary-foreground" : "border border-gold/40 bg-card hover:bg-accent"}`}
              >
                {c}
              </Link>
            ))}
          </nav>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gold/40 bg-card p-12 text-center font-naskh text-sm text-muted-foreground">
              اس قسم میں ابھی کوئی خبر شائع نہیں ہوئی۔
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((n) => (
                <Link key={n.id} href={`/news/${n.id}`} className="group manuscript-frame flex flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg">
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-secondary">
                    {n.coverUrl ? (
                       
                      <img src={n.coverUrl} alt={n.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Megaphone className="h-10 w-10 text-gold" />
                    )}
                    {n.featured && (
                      <span className="absolute start-2 top-2 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-naskh font-semibold text-[#3d2f05]">
                        نمایاں
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-2 w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-naskh text-primary">{n.category}</span>
                    <h2 className="line-clamp-2 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{n.title}</h2>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-6 text-foreground/65 font-naskh">
                      {n.excerpt}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-2.5 text-[11px] text-muted-foreground">
                      <span className="font-naskh">{n.sourceName ?? "پیامِ ادب"}</span>
                      <span className="font-latin" dir="ltr">
                        {new Date(n.createdAt).toLocaleDateString("en-GB")}
                        {showViews && n.views > 0 ? ` · ${n.views}` : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" dir="ltr">
              {Array.from({ length: pages }).map((_, i) => (
                <Link
                  key={i}
                  href={`/news?page=${i + 1}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                  className={`rounded-md px-3.5 py-1.5 font-latin text-sm ${page === i + 1 ? "bg-primary text-primary-foreground" : "border border-gold/40 bg-card hover:bg-accent"}`}
                >
                  {i + 1}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
