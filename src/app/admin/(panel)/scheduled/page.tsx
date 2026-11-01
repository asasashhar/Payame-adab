"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/site/cards";
import { toast } from "@/hooks/use-toast";
import { Clock, Loader2, Globe } from "lucide-react";

type Item = {
  id: string; title: string; status: string; publishAt: string | null;
  category: string; createdAt: string; poetName?: string | null; authorName?: string | null;
};

const TYPE_API: Record<string, string> = { poem: "poems", article: "articles", news: "news" };
const TYPE_URDU: Record<string, string> = { poem: "شاعری", article: "مضمون", news: "خبر" };

export default function ScheduledPage() {
  const [items, setItems] = useState<(Item & { _type: string })[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const results: (Item & { _type: string })[] = [];
    for (const t of ["poem", "article", "news"]) {
      try {
        const res = await fetch(`/api/${TYPE_API[t]}?all=1&limit=200`);
        const data = await res.json();
        const list: Item[] = Array.isArray(data) ? data : data.items ?? [];
        for (const it of list) {
          if (it.status === "SCHEDULED") results.push({ ...it, _type: t });
        }
      } catch { /* skip */ }
    }
    results.sort((a, b) => new Date(a.publishAt ?? a.createdAt).getTime() - new Date(b.publishAt ?? b.createdAt).getTime());
    setItems(results);
  }, []);

  useEffect(() => { load(); }, [load]);

  const publishNow = async (it: Item & { _type: string }) => {
    setBusyId(it.id);
    try {
      const res = await fetch(`/api/${TYPE_API[it._type]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id, status: "PUBLISHED" }),
      });
      if (res.ok) {
        toast({ title: "ابھی شائع کر دیا گیا" });
        load();
      } else {
        toast({ title: "کارروائی ناکام", variant: "destructive" });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="شیڈول شدہ اشاعتیں"
        subtitle="مقررہ وقت پر خودکار شائع ہونے والی تحریریں — ہوم پیج یا ڈیش بورڈ کے کھلنے پر نظام وقت جانچتا ہے"
      />

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-12 text-center">
          <Clock className="mx-auto mb-2 h-9 w-9 text-gold" />
          <p className="font-naskh text-sm text-muted-foreground">ابھی کوئی شیڈول شدہ تحریر نہیں — شاعری/مضامین/خبروں میں حالت «SCHEDULED» منتخب کر کے شیڈول کریں۔</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const due = it.publishAt && new Date(it.publishAt) <= new Date();
            return (
              <div key={it.id} className="rounded-xl border border-gold/25 bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-nastaliq-tight text-lg leading-8">{it.title}</h3>
                      <StatusBadge status={it.status} />
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-naskh text-primary">{TYPE_URDU[it._type]}</span>
                    </div>
                    <p className="mt-1 text-xs font-naskh text-muted-foreground">
                      {it.poetName || it.authorName || "—"} · {it.category} ·{" "}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        شیڈول: <span className="font-latin">{it.publishAt ? new Date(it.publishAt).toLocaleString("en-GB") : "—"}</span>
                      </span>
                      {due && <span className="ms-1 rounded-full bg-[#e3f0e6] px-2 py-0.5 text-[10px] text-[#2f6d46]">وقت گزر چکا — اگلے لوڈ پر شائع ہوگی</span>}
                    </p>
                  </div>
                  <Button
                    size="sm" disabled={busyId === it.id}
                    onClick={() => publishNow(it)}
                    className="gap-1.5 bg-primary font-naskh hover:bg-emerald-deep"
                  >
                    {busyId === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    ابھی شائع کریں
                  </Button>
                  <Link
                    href={`/admin/${TYPE_API[it._type]}`}
                    className="text-xs font-naskh text-gold underline hover:text-primary"
                  >
                    ترمیم کریں
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
