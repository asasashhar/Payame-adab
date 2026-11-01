import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { BookA } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "لغتِ اردو — آج کا لفظ اور محفوظ الفاظ" };

export default async function DictionaryPage() {
  const words = await db.wordOfDay.findMany({
    where: { active: true },
    orderBy: { date: "desc" },
    take: 60,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="لغتِ اردو" subtitle="روز کا نیا لفظ، معنی، مترادف اور استعمال" />
          {words.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <BookA className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">لغت میں الفاظ جلد شامل ہوں گے</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {words.map((w, idx) => (
                <article
                  key={w.id}
                  className={`manuscript-frame rounded-xl p-5 ${idx === 0 ? "bg-accent/70 ring-1 ring-gold/40" : "bg-card"}`}
                >
                  {idx === 0 && (
                    <span className="mb-2 inline-block rounded-full bg-gold px-3 py-0.5 text-[11px] font-naskh font-semibold text-emerald-ink">
                      آج کا لفظ
                    </span>
                  )}
                  <h2 className="font-nastaliq-tight text-3xl leading-[1.8] text-emerald-deep">{w.word}</h2>
                  <p className="mt-1 font-naskh text-[15px] leading-8 text-foreground/85">{w.meaning}</p>
                  {w.englishMeaning && (
                    <p className="mt-0.5 font-latin text-sm text-muted-foreground" dir="ltr">{w.englishMeaning}</p>
                  )}
                  <div className="mt-3 space-y-1.5 text-sm font-naskh">
                    {w.synonyms && (
                      <p><span className="text-gold">مترادف:</span> <span className="text-foreground/75">{w.synonyms}</span></p>
                    )}
                    {w.antonyms && (
                      <p><span className="text-gold">متضاد:</span> <span className="text-foreground/75">{w.antonyms}</span></p>
                    )}
                    {w.example && (
                      <p className="rounded-lg bg-secondary/70 px-3 py-2 font-nastaliq text-sm leading-7">
                        {w.example}
                      </p>
                    )}
                    {w.usage && <p className="text-xs leading-6 text-muted-foreground">{w.usage}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
