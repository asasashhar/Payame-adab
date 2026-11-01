import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Newspaper, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "ڈیجیٹل اخبار — ہفتہ وار شمارے" };

function currentWeekLabel(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `ہفتہ ${week}، ${date.getFullYear()}`;
}

export default async function NewspaperPage() {
  const editions = await db.newspaperEdition.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const current = editions[0];
  const currentWeek = currentWeekLabel();
  const hasThisWeek = current && current.weekLabel === currentWeek;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="ڈیجیٹل اخبار" subtitle="ہفتہ وار شمارے — براہِ راست آن لائن مطالعہ" />

          {/* current week status */}
          {!hasThisWeek && (
            <div className="manuscript-frame mb-8 rounded-xl bg-card p-10 text-center">
              <Newspaper className="mx-auto mb-3 h-12 w-12 text-gold" />
              <p className="font-nastaliq-tight text-2xl leading-[2] text-emerald-ink">
                معذرت! اس ہفتے کا شمارہ ابھی دستیاب نہیں ہے۔ جلد آ رہا ہے۔
              </p>
              {current && (
                <Link
                  href={`/newspaper/${current.id}`}
                  className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 font-naskh text-sm font-semibold text-primary-foreground hover:bg-emerald-deep"
                >
                  تازہ ترین دستیاب شمارہ پڑھیں
                </Link>
              )}
            </div>
          )}

          {current && hasThisWeek && (
            <Link
              href={`/newspaper/${current.id}`}
              className="group manuscript-frame mb-8 flex flex-col items-center gap-6 overflow-hidden rounded-xl bg-card p-6 transition-shadow hover:shadow-lg sm:flex-row"
            >
              <div className="flex h-56 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/30 bg-secondary sm:h-64">
                {current.coverUrl ? (
                   
                  <img src={current.coverUrl} alt={current.title} className="h-full w-full object-cover" />
                ) : (
                  <Newspaper className="h-16 w-16 text-gold" />
                )}
              </div>
              <div className="text-center sm:text-start">
                <span className="rounded-full bg-emerald-deep/10 px-3 py-1 text-xs font-naskh font-semibold text-emerald-deep">
                  تازہ شمارہ
                </span>
                <h2 className="mt-2 font-nastaliq-tight text-2xl leading-[1.9] group-hover:text-primary">
                  {current.title}
                </h2>
                <p className="text-sm font-naskh text-muted-foreground">
                  {current.weekLabel} {current.editionNumber && `· شمارہ ${current.editionNumber}`}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2 font-naskh text-sm font-semibold text-emerald-ink">
                  <Newspaper className="h-4 w-4" /> شمارہ پڑھیں
                </span>
              </div>
            </Link>
          )}

          {/* archive */}
          <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">اخبار کا محفوظ شدہ ریکارڈ</h2>
          {editions.length <= 1 || editions.length === 0 ? (
            editions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                آرکائیو میں فی الحال کوئی شمارہ موجود نہیں۔
              </div>
            ) : null
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {editions.map((e) => (
                <Link
                  key={e.id}
                  href={`/newspaper/${e.id}`}
                  className="group manuscript-frame overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="flex h-48 items-center justify-center overflow-hidden bg-secondary">
                    {e.coverUrl ? (
                       
                      <img src={e.coverUrl} alt={e.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Newspaper className="h-12 w-12 text-gold" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{e.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-naskh text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-gold" /> {e.weekLabel ?? ""}
                      {e.editionNumber && ` · شمارہ ${e.editionNumber}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
