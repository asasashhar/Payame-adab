import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { PosterCard } from "@/components/site/cards";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "ادبی تقریبات" };

export default async function EventsPage() {
  const events = await db.event.findMany({ orderBy: [{ date: "asc" }] });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="آنے والی تقریبات" subtitle="مشاعرے، سیمینار، ورکشاپ اور کتاب رونمائی" />
          {events.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">فی الحال کوئی تقریباں طے شدہ نہیں</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">نئی تقریبات کا اعلان جلد کیا جائے گا۔</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <PosterCard
                  key={e.id}
                  title={e.title}
                  description={e.description}
                  posterUrl={e.posterUrl}
                  meta={
                    <div className="space-y-1">
                      {e.date && (
                        <p className="font-naskh font-semibold text-primary">
                          <CalendarDays className="mb-0.5 me-1 inline h-4 w-4 text-gold" />
                          <span className="font-latin">{new Date(e.date).toLocaleDateString("en-GB")}</span>
                          {e.time && ` · ${e.time}`}
                        </p>
                      )}
                      {e.venue && <p className="font-naskh">مقام: {e.venue}</p>}
                      <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-naskh text-primary">{e.eventType}</span>
                    </div>
                  }
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
