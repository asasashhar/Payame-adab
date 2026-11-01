import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Download, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "شمارہ مطالعہ" };

export default async function NewspaperViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edition = await db.newspaperEdition.findUnique({ where: { id } });
  if (!edition || !edition.published) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <nav className="mb-4 text-xs font-naskh text-muted-foreground">
            <Link href="/" className="hover:text-primary">ہوم</Link> / <Link href="/newspaper" className="hover:text-primary">ڈیجیٹل اخبار</Link> / <span className="text-primary">{edition.title}</span>
          </nav>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl manuscript-frame bg-card p-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-gold" />
              <div>
                <h1 className="font-nastaliq-tight text-xl leading-8 text-primary">{edition.title}</h1>
                <p className="text-xs font-naskh text-muted-foreground">
                  {edition.weekLabel} {edition.editionNumber && `· شمارہ ${edition.editionNumber}`}
                </p>
              </div>
            </div>
            <Button asChild className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              <a href={edition.pdfUrl} target="_blank" rel="noopener" download>
                <Download className="h-4 w-4" /> PDF ڈاؤن لوڈ کریں
              </a>
            </Button>
          </div>

          <div className="manuscript-frame overflow-hidden rounded-xl bg-[#525659] p-2">
            <iframe
              src={edition.pdfUrl}
              title={edition.title}
              className="h-[80vh] w-full rounded-lg"
            />
          </div>
          <p className="mt-3 text-center text-xs font-naskh text-muted-foreground">
            اگر شمارہ نظر نہ آئے تو «PDF ڈاؤن لوڈ کریں» استعمال کریں۔
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
