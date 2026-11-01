import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { PosterCard } from "@/components/site/cards";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "ادبی مقابلے" };

export default async function CompetitionsPage() {
  const competitions = await db.competition.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="ادبی مقابلے" subtitle="شاعری، مضامین اور افسانہ نگاری کے مقابلے" />
          {competitions.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">اس وقت کوئی مقابلہ جاری نہیں</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">نئے مقابلے جلد اعلان ہوں گے۔</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {competitions.map((c) => (
                <PosterCard
                  key={c.id}
                  title={c.title}
                  description={c.description}
                  posterUrl={c.posterUrl}
                  meta={
                    <div className="space-y-1">
                      {c.startDate && (
                        <p className="font-naskh">
                          آغاز: <span className="font-latin">{new Date(c.startDate).toLocaleDateString("en-GB")}</span>
                        </p>
                      )}
                      {c.endDate && (
                        <p className="font-naskh font-semibold text-primary">
                          آخری تاریخ: <span className="font-latin">{new Date(c.endDate).toLocaleDateString("en-GB")}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">پوسٹر سائز: {c.posterSize}</p>
                    </div>
                  }
                  resultNote={c.resultNote}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
