"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/site/cards";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check, X, PenLine, BookOpen, Quote, Eye, Inbox, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Work = {
  id: string; title: string; content: string; status: string; feedback: string | null;
  category: string; createdAt: string;
  poetName?: string | null; authorName?: string | null;
  user?: { id: string; name: string; penName: string | null } | null;
};

const TABS = [
  { key: "PENDING", label: "زیرِ جائزہ" },
  { key: "REVISION", label: "اصلاح مطلوب" },
  { key: "APPROVED", label: "منظور شدہ" },
  { key: "PUBLISHED", label: "شائع شدہ" },
  { key: "REJECTED", label: "مسترد" },
  { key: "DRAFT", label: "مسودے" },
  { key: "SCHEDULED", label: "شیڈول شدہ" },
  { key: "ARCHIVED", label: "آرکائیو" },
];

export default function SubmissionsPage() {
  const [tab, setTab] = useState("PENDING");
  const [kind, setKind] = useState<"poem" | "article" | "news">("poem");
  const [items, setItems] = useState<Work[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState<Work | null>(null);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<"PUBLISHED" | "APPROVED" | "REJECTED" | "REVISION" | "PENDING" | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    const api = kind === "poem" ? "poems" : kind === "article" ? "articles" : "news";
    const res = await fetch(`/api/${api}?all=1&limit=200`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : data.items ?? []);
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, fb?: string) => {
    setBusy(true);
    try {
      const api = kind === "poem" ? "poems" : kind === "article" ? "articles" : "news";
      const res = await fetch(`/api/${api}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, feedback: fb || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "کارروائی ناکام", description: d.error, variant: "destructive" });
        return;
      }
      toast({
        title:
          status === "PUBLISHED" ? "تحریر شائع ہو گئی"
          : status === "APPROVED" ? "تحریر منظور ہو گئی"
          : status === "REVISION" ? "اصلاح کے لیے واپس کر دی گئی"
          : "تحریر مسترد کر دی گئی",
      });
      setReviewing(null);
      setFeedback("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const filtered = (items ?? []).filter((w) => w.status === tab);

  return (
    <div>
      <AdminPageHeader
        title="منزوری مرکز"
        subtitle="تمام بھیجی گئی تحریریں — ملاحظہ، منظوری، اصلاح، مستردی یا شائع کریں"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gold/30 bg-card p-1">
          <button
            onClick={() => setKind("poem")}
            className={cn("flex items-center gap-1.5 rounded-md px-4 py-1.5 font-naskh text-sm", kind === "poem" ? "bg-primary text-primary-foreground" : "text-foreground/75")}
          >
            <BookOpen className="h-4 w-4" /> شاعری
          </button>
          <button
            onClick={() => setKind("article")}
            className={cn("flex items-center gap-1.5 rounded-md px-4 py-1.5 font-naskh text-sm", kind === "article" ? "bg-primary text-primary-foreground" : "text-foreground/75")}
          >
            <Quote className="h-4 w-4" /> مضامین
          </button>
          <button
            onClick={() => setKind("news")}
            className={cn("flex items-center gap-1.5 rounded-md px-4 py-1.5 font-naskh text-sm", kind === "news" ? "bg-primary text-primary-foreground" : "text-foreground/75")}
          >
            <Megaphone className="h-4 w-4" /> خبریں
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full border px-3.5 py-1 text-xs font-naskh transition-colors",
                tab === t.key ? "border-emerald-deep bg-emerald-deep text-[#f3ead2]" : "border-gold/40 bg-card text-foreground/75 hover:border-gold"
              )}
            >
              {t.label}
              {items && ` (${items.filter((w) => w.status === t.key).length})`}
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-12 text-center">
          <Inbox className="mx-auto mb-2 h-9 w-9 text-gold" />
          <p className="font-naskh text-sm text-muted-foreground">اس زمرے میں کوئی تحریر نہیں۔</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className="rounded-xl border border-gold/25 bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-nastaliq-tight text-lg leading-8">{w.title}</h3>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="mt-0.5 text-xs font-naskh text-muted-foreground">
                    {w.poetName || w.authorName || w.user?.penName || w.user?.name || "گمنام"} · {w.category} ·{" "}
                    <span className="font-latin">{new Date(w.createdAt).toLocaleDateString("en-GB")}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => { setReviewing(w); setAction(null); setFeedback(w.feedback ?? ""); }} className="gap-1.5 border-gold/40 font-naskh">
                    <Eye className="h-4 w-4" /> ملاحظہ
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => { setReviewing(w); setAction("PUBLISHED"); setFeedback(""); }} className="gap-1.5 bg-primary font-naskh hover:bg-emerald-deep">
                    <Check className="h-4 w-4" /> شائع کریں
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => { setReviewing(w); setAction("APPROVED"); setFeedback(""); }} className="gap-1.5 bg-emerald-600/90 font-naskh hover:bg-emerald-600">
                    منظوری
                  </Button>
                  <Button
                    variant="outline" size="sm" disabled={busy}
                    onClick={() => { setReviewing(w); setAction("REVISION"); setFeedback(w.feedback ?? ""); }}
                    className="gap-1.5 border-[#d9a24a] font-naskh text-[#8a5b12] hover:bg-[#fbf5e2]"
                  >
                    <PenLine className="h-4 w-4" /> اصلاح
                  </Button>
                  <Button
                    variant="outline" size="sm" disabled={busy}
                    onClick={() => { setReviewing(w); setAction("REJECTED"); setFeedback(""); }}
                    className="gap-1.5 border-destructive/50 font-naskh text-destructive hover:bg-[#fbe4e4]"
                  >
                    <X className="h-4 w-4" /> مسترد
                  </Button>
                  <Button
                    variant="outline" size="sm" disabled={busy}
                    onClick={() => { setReviewing(w); setAction("PENDING"); setFeedback(""); }}
                    className="gap-1.5 border-gold/40 font-naskh text-foreground/70 hover:bg-accent"
                  >
                    <Inbox className="h-4 w-4" /> زیرِ جائزہ
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* review dialog */}
      <Dialog open={reviewing !== null} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto nice-scroll sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">
              {action === null ? "تحریر کا جائزہ"
                : action === "PUBLISHED" ? "شائع کریں — ادارتی پیغام"
                : action === "APPROVED" ? "منظوری دیں — ادارتی پیغام"
                : action === "REVISION" ? "اصلاح کی درخواست"
                : action === "PENDING" ? "زیرِ جائزہ — اطلاع"
                : "مستردی کی وجہ"}
            </DialogTitle>
          </DialogHeader>

          {reviewing && (
            <>
              <h3 className="font-nastaliq-tight text-2xl leading-10 text-emerald-ink">{reviewing.title}</h3>
              <p className="text-sm font-naskh text-muted-foreground">
                {reviewing.poetName || reviewing.authorName || reviewing.user?.penName || reviewing.user?.name || "گمنام"} · {reviewing.category}
                {reviewing.user ? " · فیصلہ مصنف کے ای میل پر جائے گا" : " · (بغیر اکاؤنٹ تحریر — کوئی ای میل نہیں)"}
              </p>
              <div className="max-h-72 overflow-y-auto nice-scroll rounded-lg bg-secondary/50 p-4">
                <p className="whitespace-pre-line font-nastaliq text-base leading-[2.4] text-foreground/90">
                  {reviewing.content}
                </p>
              </div>

              {action !== null && (
                <div className="space-y-2">
                  <p className="font-naskh text-sm">
                    {action === "REJECTED" && "مستردی کی ذاتی وجہ لکھیں (لازمی) — یہ پیغام مصنف کے ای میل پر جائے گا:"}
                    {action === "REVISION" && "کس چیز میں اصلاح درکار ہے؟ (لازمی):"}
                    {action === "PUBLISHED" && "اشاعت کے ساتھ مبارکبادی / ادارتی نوٹ (اختیاری):"}
                    {action === "APPROVED" && "منظوری کا ذاتی پیغام (اختیاری):"}
                    {action === "PENDING" && "مصنف کو اطلاع دیں کہ تحریر زیرِ جائزہ ہے (اختیاری نوٹ):"}
                  </p>
                  <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="font-naskh" />
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setReviewing(null)} className="font-naskh">بند کریں</Button>
                {action === "PUBLISHED" && (
                  <Button
                    disabled={busy}
                    onClick={() => reviewing && setStatus(reviewing.id, "PUBLISHED", feedback)}
                    className="gap-2 bg-primary font-naskh hover:bg-emerald-deep"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} شائع کریں
                  </Button>
                )}
                {action === "APPROVED" && (
                  <Button
                    disabled={busy}
                    onClick={() => reviewing && setStatus(reviewing.id, "APPROVED", feedback)}
                    className="gap-2 bg-emerald-600 font-naskh hover:bg-emerald-600/90"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} منظوری دیں
                  </Button>
                )}
                {action === "PENDING" && (
                  <Button
                    disabled={busy}
                    onClick={() => reviewing && setStatus(reviewing.id, "PENDING", feedback)}
                    className="gap-2 bg-[#8a6d1a] font-naskh text-white hover:bg-[#6d5311]"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} اطلاع بھیجیں
                  </Button>
                )}
                {action === "REVISION" && (
                  <Button
                    disabled={busy || !feedback.trim()}
                    onClick={() => reviewing && setStatus(reviewing.id, "REVISION", feedback)}
                    className="gap-2 bg-[#b8860b] font-naskh text-white hover:bg-[#a0760a]"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} اصلاح کے لیے بھیجیں
                  </Button>
                )}
                {action === "REJECTED" && (
                  <Button
                    disabled={busy || !feedback.trim()}
                    onClick={() => reviewing && setStatus(reviewing.id, "REJECTED", feedback)}
                    className="gap-2 bg-destructive font-naskh hover:bg-destructive/90"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} مسترد کریں
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
