"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CommentRow = {
  id: string;
  resourceType: string;
  resourceId: string;
  body: string;
  status: string;
  createdAt: string;
  guestName: string | null;
  user?: { name: string; penName: string | null; email: string; photoUrl: string | null } | null;
};

const TYPE_URDU: Record<string, string> = { poem: "شاعری", article: "مضمون", book: "کتاب", news: "خبر" };
const HREF: Record<string, string> = { poem: "/poetry", article: "/articles", book: "/books", news: "/news" };
const STATUS_URDU: Record<string, string> = { PENDING: "زیرِ انتظار", APPROVED: "منظور شدہ", REJECTED: "مسترد" };

export default function CommentsPage() {
  const [data, setData] = useState<{ items: CommentRow[]; counts: { PENDING: number; APPROVED: number; REJECTED: number; total: number } } | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/comments?admin=1&status=${status}`);
    if (res.ok) setData(await res.json());
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: string, next: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (res.ok) {
        toast({ title: next === "APPROVED" ? "تبصرہ منظور ہو گیا" : "تبصرہ مسترد کر دیا گیا" });
        load();
      } else {
        toast({ title: "کارروائی ناکام", variant: "destructive" });
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "تبصرہ حذف ہو گیا" }); load(); }
    } finally {
      setBusyId(null);
    }
  };

  const filtered = data?.items.filter((c) => !q || c.body.includes(q) || (c.user?.name ?? "").includes(q) || (c.guestName ?? "").includes(q)) ?? [];

  const tabs = [
    { key: "PENDING", label: "زیرِ انتظار", count: data?.counts.PENDING ?? 0 },
    { key: "APPROVED", label: "منظور شدہ", count: data?.counts.APPROVED ?? 0 },
    { key: "REJECTED", label: "مسترد", count: data?.counts.REJECTED ?? 0 },
    { key: "all", label: "تمام", count: data?.counts.total ?? 0 },
  ];

  return (
    <div>
      <AdminPageHeader
        title="تبصرہ مینجمنٹ"
        subtitle="ہر تبصرہ منظوری کے بعد عوامی سائٹ پر ظاہر ہوتا ہے — یہاں سے منظور، مسترد یا حذف کریں"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-naskh transition-colors",
              status === t.key ? "bg-primary text-primary-foreground" : "border border-gold/40 bg-card hover:bg-accent"
            )}
          >
            {t.label} <span className="font-latin text-xs">({t.count})</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="تبصرہ یا نام تلاش کریں…"
          className="ms-auto h-9 w-56 rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {data === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
          اس فہرست میں کوئی تبصرہ نہیں۔
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.id} className="manuscript-frame rounded-xl bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-naskh text-sm">
                    <span className="font-semibold text-primary">{c.user?.penName || c.user?.name || c.guestName || "مہمان قاری"}</span>
                    {c.user?.email && <span className="font-latin text-[11px] text-muted-foreground" dir="ltr">{c.user.email}</span>}
                    <Badge className="bg-accent font-naskh text-primary">{TYPE_URDU[c.resourceType] ?? c.resourceType}</Badge>
                    <Badge className={cn(
                      "font-naskh",
                      c.status === "APPROVED" ? "bg-[#e3f0e6] text-[#2f6d46]" :
                      c.status === "PENDING" ? "bg-[#fdf3d7] text-[#8a6d1a]" : "bg-[#fbe4e4] text-destructive"
                    )}>
                      {STATUS_URDU[c.status] ?? c.status}
                    </Badge>
                    <Link
                      href={`${HREF[c.resourceType] ?? "/"}/${c.resourceId}`}
                      className="text-[11px] text-gold underline hover:text-primary"
                    >
                      مواد دیکھیں
                    </Link>
                  </p>
                  <p className="mt-2 whitespace-pre-line font-naskh text-sm leading-7 text-foreground/85">{c.body}</p>
                  <p className="mt-1 font-latin text-[10px] text-muted-foreground" dir="ltr">
                    {new Date(c.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {busyId === c.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {c.status !== "APPROVED" && (
                    <Button size="sm" className="h-8 gap-1.5 bg-[#2f6d46] font-naskh hover:bg-[#2f6d46]/90" onClick={() => moderate(c.id, "APPROVED")}>
                      <Check className="h-3.5 w-3.5" /> منظور
                    </Button>
                  )}
                  {c.status !== "REJECTED" && (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 border-gold/40 font-naskh" onClick={() => moderate(c.id, "REJECTED")}>
                      <X className="h-3.5 w-3.5" /> مسترد
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-destructive hover:bg-[#fbe4e4]" onClick={() => remove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
