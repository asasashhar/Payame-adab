"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";

type Log = {
  id: string; action: string; detail: string | null;
  actorEmail: string | null; createdAt: string;
};

const ACTION_URDU: Record<string, string> = {
  register: "رجسٹریشن", login: "لاگ اِن", "admin-login": "ایڈمن لاگ اِن",
  submission: "نئی تحریر", update: "تبدیلی", delete: "حذف",
  upload: "اپلوڈ", settings: "ترتیبات", comment: "تبصرہ",
  "comment-moderate": "تبصرہ منظوری", "comment-delete": "تبصرہ حذف",
  like: "پسندیدگی", "like-delete": "پسندیدگی حذف",
  "admin-create": "نیا ایڈمن", "admin-toggle": "ایڈمن حالت",
  "admin-reset-password": "ایڈمن پاس ورڈ ری سیٹ", "admin-revoke": "ایڈمن ہٹایا",
  "admin-update": "ایڈمن اپ ڈیٹ", "admin-reset-link": "بازیابی لنک",
  restore: "بحالی", "deleted-purge": "مستقل حذف",
  "poem-update": "شاعری تبدیل", "poem-delete": "شاعری حذف",
  "article-update": "مضمون تبدیل", "article-delete": "مضمون حذف",
  "news-update": "خبر تبدیل", "news-delete": "خبر حذف",
  "password-change": "پاس ورڈ تبدیل", "reset-request": "بازیابی درخواست",
  "reset-consumed": "بازیابی مکمل", view: "مشاہدہ",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(200);

  useEffect(() => {
    let live = true;
    (async () => {
      const res = await fetch(`/api/logs?limit=${limit}`);
      const d = res.ok ? await res.json() : { items: [] };
      if (live) setLogs(d.items ?? []);
    })();
    return () => {
      live = false;
    };
  }, [limit]);

  const filtered = (logs ?? []).filter(
    (l) => !q ||
      (l.detail ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (l.actorEmail ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (ACTION_URDU[l.action] ?? l.action).includes(q)
  );

  return (
    <div>
      <AdminPageHeader
        title="سیکیورٹی و آڈٹ لاگ"
        subtitle="تمام اہم کارروائیاں کا ریکارڈ — ایڈمن عمل، منظوریاں، اپلوڈز اور ترتیبات"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="کارروائی، تفصیل یا ای میل تلاش کریں…"
          className="max-w-sm bg-card font-naskh"
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="h-9 rounded-md border border-gold/40 bg-card px-2 font-naskh text-sm"
          dir="ltr"
        >
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

      {logs === null ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-12 text-center">
          <ScrollText className="mx-auto mb-2 h-9 w-9 text-gold" />
          <p className="font-naskh text-sm text-muted-foreground">کوئی لاگ نہیں ملا۔</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gold/25 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 font-naskh text-primary">
                <th className="px-4 py-2.5 text-start">کارروائی</th>
                <th className="px-4 py-2.5 text-start">تفصیل</th>
                <th className="px-4 py-2.5 text-start">کارکن</th>
                <th className="px-4 py-2.5 text-start">وقت</th>
              </tr>
            </thead>
            <tbody className="font-naskh">
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-gold/15">
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-primary">
                      {ACTION_URDU[l.action] ?? l.action}
                    </span>
                  </td>
                  <td className="max-w-md truncate px-4 py-2 text-foreground/85" dir="auto">{l.detail ?? "—"}</td>
                  <td className="px-4 py-2 font-latin text-xs text-muted-foreground" dir="ltr">{l.actorEmail ?? "—"}</td>
                  <td className="px-4 py-2 font-latin text-xs text-muted-foreground" dir="ltr">
                    {new Date(l.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
