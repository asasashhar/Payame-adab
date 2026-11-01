"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/site/cards";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { PenLine, Loader2, Eye, MessageSquareWarning, MailWarning, Send } from "lucide-react";

type Work = {
  id: string; title: string; status: string; feedback: string | null;
  category: string; views: number; createdAt: string;
};
type Me = { id: string; name: string; penName: string | null; emailVerified?: boolean } | null;

export default function DashboardPage() {
  const [me, setMe] = useState<Me>(null);
  const [poems, setPoems] = useState<Work[] | null>(null);
  const [articles, setArticles] = useState<Work[] | null>(null);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.id) { router.push("/login"); return; }
        setMe(d);
      });
    Promise.all([
      fetch("/api/poems?mine=1").then((r) => r.json()),
      fetch("/api/articles?mine=1").then((r) => r.json()),
    ]).then(([p, a]) => { setPoems(p); setArticles(a); });
  }, [router]);

  const resendVerification = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const d = await res.json();
      if (res.ok) toast({ title: d.message ?? "تصدیقی ای میل بھیج دی گئی" });
      else toast({ title: d.error ?? "ای میل نہیں بھیجی جا سکی", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  if (!me || !poems || !articles) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const pending = [...poems, ...articles].filter((w) => w.status === "PENDING").length;
  const published = [...poems, ...articles].filter((w) => w.status === "PUBLISHED").length;

  const WorkRow = ({ w, type }: { w: Work; type: "poem" | "article" }) => (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/${type === "poem" ? "poetry" : "articles"}/${w.id}`} className="font-nastaliq-tight text-lg leading-8 hover:text-primary">
            {w.title}
          </Link>
          <StatusBadge status={w.status} />
        </div>
        <p className="mt-0.5 text-xs font-naskh text-muted-foreground">
          {w.category} · <span className="font-latin">{new Date(w.createdAt).toLocaleDateString("en-GB")}</span>
          {w.status === "PUBLISHED" && ` · ${w.views} مطالعے`}
        </p>
        {w.feedback && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#fbf5e2] px-3 py-2 text-xs leading-6 font-naskh text-[#7a5c14]">
            <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" /> ادارتی پیغام: {w.feedback}
          </p>
        )}
      </div>
      {(w.status === "DRAFT" || w.status === "REVISION") && (
        <Button asChild size="sm" className="gap-1.5 bg-[#b8860b] font-naskh hover:bg-[#a0760a]">
          <Link href={`/submit?edit=${w.id}&type=${type}`}><PenLine className="h-4 w-4" /> {w.status === "REVISION" ? "اصلاح کریں" : "ترمیم کریں"}</Link>
        </Button>
      )}
      {w.status === "PUBLISHED" && (
        <Button asChild variant="outline" size="sm" className="border-gold/40 font-naskh">
          <Link href={`/${type === "poem" ? "poetry" : "articles"}/${w.id}`}><Eye className="h-4 w-4" /> دیکھیں</Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <SectionHeading
            title="میرا ڈیش بورڈ"
            subtitle={`${me.penName || me.name} کی تحریریں اور ان کی حالت`}
            href={`/profile/${me.id}`}
            linkLabel="میری عوامی پروفائل"
          />

          {me.emailVerified === false && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#8a6d1a]/40 bg-[#fdf3d7] p-4">
              <p className="flex items-start gap-2 text-sm font-naskh leading-7 text-[#6d5311]">
                <MailWarning className="mt-1 h-5 w-5 shrink-0" />
                آپ کی ای میل ابھی تصدیق شدہ نہیں۔ تصدیق کے بعد آپ نئی تحریریں بھیج سکیں گے۔ تصدیقی ای میل اپنے ان باکس (یا اسپام فولڈر) میں دیکھیں۔
              </p>
              <Button onClick={resendVerification} disabled={resending} size="sm" className="gap-2 bg-[#8a6d1a] font-naskh hover:bg-[#6d5311]">
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} تصدیقی ای میل دوبارہ بھیجیں
              </Button>
            </div>
          )}

          <div className="mb-8 grid grid-cols-3 gap-4 text-center">
            <div className="manuscript-frame rounded-xl bg-card p-5">
              <p className="font-latin text-3xl font-bold text-emerald-deep">{published}</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">شائع شدہ</p>
            </div>
            <div className="manuscript-frame rounded-xl bg-card p-5">
              <p className="font-latin text-3xl font-bold text-[#8a6d1a]">{pending}</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">زیرِ جائزہ</p>
            </div>
            <div className="manuscript-frame rounded-xl bg-card p-5">
              <p className="font-latin text-3xl font-bold text-primary">{poems.length + articles.length}</p>
              <p className="mt-1 font-naskh text-sm text-muted-foreground">کل تحریریں</p>
            </div>
          </div>

          <div className="mb-6 text-center">
            <Button asChild className="gap-2 bg-primary font-naskh text-[15px] hover:bg-emerald-deep">
              <Link href="/submit"><PenLine className="h-4.5 w-4.5" /> نئی تحریر بھیجیں</Link>
            </Button>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">شاعری</h2>
            {poems.length === 0 ? (
              <SkeletonRow label="ابھی کوئی شاعری بھیجی نہیں گئی" />
            ) : (
              <div className="space-y-3">{poems.map((p) => <WorkRow key={p.id} w={p} type="poem" />)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-nastaliq-tight text-2xl text-primary">مضامین</h2>
            {articles.length === 0 ? (
              <SkeletonRow label="ابھی کوئی مضمون بھیجا نہیں گیا" />
            ) : (
              <div className="space-y-3">{articles.map((a) => <WorkRow key={a.id} w={a} type="article" />)}</div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SkeletonRow({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gold/40 bg-card p-8 text-center font-naskh text-sm text-muted-foreground">
      {label}
    </div>
  );
}
