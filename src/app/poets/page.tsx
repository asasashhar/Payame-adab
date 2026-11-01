import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "شعرا و ادبا" };

export default async function PoetsPage() {
  const poets = await db.poet.findMany({ orderBy: [{ featured: "desc" }, { name: "asc" }] });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeading title="شعرا و ادبا" subtitle="اردو ادب کی نامور شخصیات کا تعارفی ذخیرہ" />
          {poets.length === 0 ? (
            <div className="manuscript-frame rounded-xl bg-card p-14 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-gold" />
              <p className="font-nastaliq-tight text-xl text-primary">پروفائلز جلد شائع ہوں گے</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {poets.map((p) => (
                <Link
                  key={p.id}
                  href={`/poets/${p.id}`}
                  className="group manuscript-frame flex flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 p-5">
                    {p.photoUrl ? (
                       
                      <img src={p.photoUrl} alt={p.name} className="h-16 w-16 shrink-0 rounded-full border-2 border-gold/50 object-cover" />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold/50 bg-secondary font-nastaliq-tight text-xl text-primary">
                        {p.takhallus?.[0] || p.name[0]}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-nastaliq-tight text-lg leading-8 group-hover:text-primary">{p.name}</h3>
                      {p.takhallus && <p className="text-xs font-naskh text-gold">تخلص: {p.takhallus}</p>}
                      {p.era && <p className="text-[11px] font-latin text-muted-foreground" dir="auto">{p.era}</p>}
                    </div>
                  </div>
                  <p className="line-clamp-3 px-5 pb-5 text-sm leading-7 text-foreground/70 font-naskh">{p.bio ?? ""}</p>
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
