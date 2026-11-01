"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Search, MailCheck, MailWarning, Power, UserRound, FileText } from "lucide-react";

type UserRow = {
  id: string; email: string; name: string; penName: string | null;
  role: string; status: string; emailVerified: boolean; lastLoginAt: string | null; createdAt: string;
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const res = await fetch("/api/users?all=1&limit=200");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, op: string, okTitle: string) => {
    setBusy(id + op);
    try {
      const res = await fetch("/api/users-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, op }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "کارروائی ناکام", variant: "destructive" });
        return;
      }
      toast({ title: okTitle });
      load();
    } finally {
      setBusy(null);
    }
  };

  const filtered = (rows ?? []).filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || (r.penName ?? "").includes(s);
  });

  return (
    <div>
      <AdminPageHeader
        title="مصنفین و صارفین"
        subtitle="رجسٹریشن، ای میل تصدیق، اکاؤنٹ کی حالت اور پروفائلز — سب کچھ ایک جگہ"
        action={
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام یا ای میل تلاش کریں…" className="w-64 font-naskh ps-9" />
          </div>
        }
      />

      {rows === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gold/25 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead className="font-naskh">صارف</TableHead>
                <TableHead className="font-naskh">ای میل تصدیق</TableHead>
                <TableHead className="font-naskh">کردار</TableHead>
                <TableHead className="font-naskh">حالت</TableHead>
                <TableHead className="font-naskh">پچھلا لاگ اِن</TableHead>
                <TableHead className="font-naskh">کارروائیاں</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="flex items-center gap-2 font-nastaliq-tight text-base leading-7">
                      <UserRound className="h-4 w-4 text-gold" /> {u.name}
                      {u.penName && <span className="text-xs font-naskh text-muted-foreground">({u.penName})</span>}
                    </p>
                    <p className="font-latin text-[11px] text-muted-foreground" dir="ltr">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-deep/10 px-2 py-0.5 text-[11px] font-naskh text-emerald-deep">
                        <MailCheck className="h-3.5 w-3.5" /> تصدیق شدہ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf3d7] px-2 py-0.5 text-[11px] font-naskh text-[#8a6d1a]">
                        <MailWarning className="h-3.5 w-3.5" /> غیر تصدیق شدہ
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-naskh text-[11px]">{u.role === "ADMIN" ? "ایڈمنسٹریٹر" : "صارف"}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.status === "ACTIVE" ? (
                      <Badge className="bg-[#e3f0e6] font-naskh text-[#2f6d46]">فعال</Badge>
                    ) : (
                      <Badge className="bg-[#fbe4e4] font-naskh text-[#a03333]">معطل</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-latin text-xs" dir="ltr">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!u.emailVerified && u.role !== "ADMIN" && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5 font-naskh text-xs text-emerald-deep hover:bg-accent" disabled={busy === u.id + "verify"} onClick={() => act(u.id, "verify", "ای میل تصدیق شدہ قرار دی گئی")}>
                          {busy === u.id + "verify" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />} تصدیق کریں
                        </Button>
                      )}
                      {u.emailVerified && u.role !== "ADMIN" && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5 font-naskh text-xs text-[#8a6d1a] hover:bg-accent" disabled={busy === u.id + "unverify"} onClick={() => act(u.id, "unverify", "تصدیق منسوخ کر دی گئی")}>
                          <MailWarning className="h-3.5 w-3.5" /> تصدیق ہٹائیں
                        </Button>
                      )}
                      {u.role !== "ADMIN" && (
                        u.status === "ACTIVE" ? (
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 font-naskh text-xs text-[#a03333] hover:bg-[#fbe4e4]" disabled={busy === u.id + "suspend"} onClick={() => act(u.id, "suspend", "اکاؤنٹ معطل ہو گیا")}>
                            <Power className="h-3.5 w-3.5" /> معطل
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 font-naskh text-xs text-emerald-deep hover:bg-accent" disabled={busy === u.id + "activate"} onClick={() => act(u.id, "activate", "اکاؤنٹ فعال ہو گیا")}>
                            <Power className="h-3.5 w-3.5" /> فعال
                          </Button>
                        )
                      )}
                      <a
                        href={`/profile/${u.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-naskh text-xs text-primary hover:bg-accent"
                      >
                        <FileText className="h-3.5 w-3.5" /> پروفائل
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="py-10 text-center font-naskh text-sm text-muted-foreground">کوئی صارف نہیں ملا۔</p>
          )}
        </div>
      )}
    </div>
  );
}
