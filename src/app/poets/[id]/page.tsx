import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Watermark } from "@/components/site/watermark";
import { PoemCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/section-heading";
import { Feather } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "شاعر و ادیب" };

export default async function PoetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poet = await db.poet.findUnique({ where: { id } });
  if (!poet) notFound();

  const poems = await db.poem.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ poetId: poet.id }, { poetName: poet.name }],
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] p-6 sm:p-10">
            <Watermark config={{ enabled: true, opacity: 6, size: 440, position: "center", types: [] }} />
            <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {poet.photoUrl ? (
                 
                <img src={poet.photoUrl} alt={poet.name} className="h-32 w-32 rounded-full border-4 border-gold/40 object-cover shadow-md" />
              ) : (
                <span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gold/40 bg-secondary font-nastaliq-tight text-4xl text-primary">
                  {poet.takhallus?.[0] || poet.name[0]}
                </span>
              )}
              <div className="flex-1 text-center sm:text-start">
                <h1 className="font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink">{poet.name}</h1>
                <div className="mt-1 flex flex-wrap justify-center gap-3 text-sm font-naskh sm:justify-start">
                  {poet.takhallus && <span className="rounded-full bg-accent px-3 py-1 text-primary">تخلص: {poet.takhallus}</span>}
                  {poet.era && <span className="rounded-full bg-accent px-3 py-1 text-primary" dir="auto">{poet.era}</span>}
                </div>
                {poet.bio && (
                  <div className="mt-4 border-t border-gold/25 pt-3">
                    {poet.bio.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                      <p key={i} className="literary-content text-justify text-[16px]">{para.trim()}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
              {poet.style && (
                <div className="rounded-lg bg-accent/50 p-4">
                  <h3 className="mb-1 font-nastaliq-tight text-lg text-primary">ادبی اسلوب</h3>
                  <p className="text-sm leading-7 text-foreground/80 font-naskh">{poet.style}</p>
                </div>
              )}
              {poet.works && (
                <div className="rounded-lg bg-accent/50 p-4">
                  <h3 className="mb-1 font-nastaliq-tight text-lg text-primary">اہم تصانیف</h3>
                  <p className="whitespace-pre-line text-sm leading-7 text-foreground/80 font-naskh">{poet.works}</p>
                </div>
              )}
              {poet.awards && (
                <div className="rounded-lg bg-accent/50 p-4 sm:col-span-2">
                  <h3 className="mb-1 font-nastaliq-tight text-lg text-primary">اعزازات و اعزازات</h3>
                  <p className="whitespace-pre-line text-sm leading-7 text-foreground/80 font-naskh">{poet.awards}</p>
                </div>
              )}
            </div>
          </div>

          <section className="mt-10">
            <SectionHeading title="منتخب کلام" href="/poetry" />
            {poems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center">
                <Feather className="mx-auto mb-2 h-8 w-8 text-gold" />
                <p className="font-naskh text-sm text-muted-foreground">اس شخصیت کا کلام جلد شائع ہوگا۔</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {poems.map((p) => (
                  <PoemCard key={p.id} poem={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
