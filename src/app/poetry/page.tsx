import Link from "next/link";
import { db } from "@/lib/db";
import { POEM_CATEGORIES } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { PoemCard } from "@/components/site/cards";
import { cn } from "@/lib/utils";
import { Feather } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "شاعری — اردو نظم و نثر کا خزانہ" };

export default async function PoetryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "تمام") where.category = category;
  if (q) {
    where.OR = [{ title: { contains: q } }, { content: { contains: q } }, { poetName: { contains: q } }];
  }
  const poems = await db.poem.findMany({ where, orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading
            title="شاعری"
            subtitle="غزل، نظم، رباعی اور اردو شاعری کی اصناف کا مکمل ذخیرہ"
          />

          <div className="mb-6 flex flex-wrap gap-2">
            {["تمام", ...POEM_CATEGORIES].map((c) => (
              <Link
                key={c}
                href={c === "تمام" ? "/poetry" : `/poetry?category=${encodeURIComponent(c)}`}
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

          {poems.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <Feather className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">اس صنف میں ابھی کوئی تحریر شائع نہیں ہوئی</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">نئی تحریریں جلد آ رہی ہیں۔ آپ اپنی شاعری بھی بھیج سکتے ہیں۔</p>
              <Link href="/submit" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 font-naskh text-sm font-semibold text-primary-foreground hover:bg-emerald-deep">
                اپنی تحریر بھیجیں
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {poems.map((p) => (
                <PoemCard key={p.id} poem={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
