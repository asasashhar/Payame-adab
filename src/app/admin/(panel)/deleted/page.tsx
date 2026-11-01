"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Trash2, RotateCcw, Loader2 } from "lucide-react";

type DeletedItem = {
  id: string; resourceType: string; resourceId: string; title: string;
  deletedBy: string | null; createdAt: string;
};

const TYPE_URDU: Record<string, string> = {
  news: "خبر", books: "کتاب", poets: "شاعر", words: "لفظ", shers: "شعر",
  competitions: "مقابلہ", events: "تقریب", banners: "بینر",
  qafiya: "قافیہ", behrs: "بحر", poems: "شاعری", articles: "مضمون",
};

export default function DeletedPage() {
  const [items, setItems] = useState<DeletedItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/restore");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (res.ok) { toast({ title: "مواد بحال ہو گیا — متعلقہ سیکشن میں نظر آئے گا" }); load(); }
      else toast({ title: d.error ?? "بحالی ناکام", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const purge = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/restore?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "ہمیشہ کے لیے حذف کر دیا گیا" }); load(); }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="حذف شدہ مواد (حالیہ)"
        subtitle="حذف کیا گیا مواد 30 دن تک یہاں محفوظ رہتا ہے — بحالی یا مستقل حذف کریں"
      />

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-12 text-center">
          <Trash2 className="mx-auto mb-2 h-9 w-9 text-gold" />
          <p className="font-naskh text-sm text-muted-foreground">حذف شدہ کوئی مواد موجود نہیں۔</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-nastaliq-tight text-lg leading-8">{it.title}</h3>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-naskh text-primary">
                    {TYPE_URDU[it.resourceType] ?? it.resourceType}
                  </span>
                </div>
                <p className="mt-1 text-xs font-naskh text-muted-foreground">
                  حذف کردہ: <span className="font-latin" dir="ltr">{it.deletedBy ?? "—"}</span> ·{" "}
                  <span className="font-latin" dir="ltr">{new Date(it.createdAt).toLocaleString("en-GB")}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {busyId === it.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                <Button size="sm" onClick={() => restore(it.id)} disabled={busyId === it.id} className="gap-1.5 bg-primary font-naskh hover:bg-emerald-deep">
                  <RotateCcw className="h-3.5 w-3.5" /> بحال کریں
                </Button>
                <Button size="sm" variant="outline" onClick={() => purge(it.id)} disabled={busyId === it.id} className="gap-1.5 border-destructive/40 font-naskh text-destructive hover:bg-[#fbe4e4]">
                  <Trash2 className="h-3.5 w-3.5" /> مستقل حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
