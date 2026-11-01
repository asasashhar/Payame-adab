"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Eye, Users, Heart, MessagesSquare, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Analytics = {
  totals: {
    totalViews: number; todayViews: number; views7: number; views30: number;
    uniqueAll: number; uniqueToday: number; unique7: number; unique30: number;
  };
  series: { day: string; views: number; visitors: number }[];
  top: { id: string; type: string; title: string; author: string; views: number }[];
  topAuthors: { name: string; views: number }[];
  likes: { total: number; today: number; top: { id: string; type: string; title: string; likes: number }[]; recent: { id: string; resourceType: string; resourceId: string; visitorId: string; createdAt: string; user?: { name: string } | null }[] };
  comments: { pending: number; approved: number; rejected: number; total: number };
};

const TYPE_URDU: Record<string, string> = {
  poem: "شاعری", article: "مضمون", book: "کتاب", news: "خبر",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${d}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const fmt = (n: number) => n.toLocaleString("en-US");

  if (!data && !loading) {
    return <div><AdminPageHeader title="تجزیات" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="ویب سائٹ تجزیات"
        subtitle="مشاہدات، منفرد زائرین، پسندیدگیاں اور تبصرے — سب اصل ڈیٹا بیس ریکارڈ سے"
        action={
          <div className="flex items-center gap-2" dir="ltr">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-latin text-sm transition-colors",
                  days === d ? "bg-primary text-primary-foreground" : "border border-gold/40 bg-card hover:bg-accent"
                )}
              >
                {d === 365 ? "All" : `${d}d`}
              </button>
            ))}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        }
      />

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "کل مشاہدات (پیج ویوز)", value: fmt(data?.totals.totalViews ?? 0), sub: `آج: ${fmt(data?.totals.todayViews ?? 0)}`, icon: Eye, accent: "text-emerald-deep" },
          { label: "منفرد زائرین (کل)", value: fmt(data?.totals.uniqueAll ?? 0), sub: `آج: ${fmt(data?.totals.uniqueToday ?? 0)}`, icon: Users, accent: "text-[#2a4d8f]" },
          { label: "7 روزہ مشاہدات", value: fmt(data?.totals.views7 ?? 0), sub: `منفرد: ${fmt(data?.totals.unique7 ?? 0)}`, icon: Eye, accent: "text-emerald-deep" },
          { label: "30 روزہ مشاہدات", value: fmt(data?.totals.views30 ?? 0), sub: `منفرد: ${fmt(data?.totals.unique30 ?? 0)}`, icon: Eye, accent: "text-emerald-deep" },
        ].map((c) => (
          <div key={c.label} className="manuscript-frame rounded-xl bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-naskh text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-latin text-3xl font-bold tabular-nums">{c.value}</p>
                <p className="mt-0.5 font-latin text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <c.icon className={cn("h-6 w-6", c.accent)} />
            </div>
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="manuscript-frame mt-6 rounded-xl bg-card p-5" dir="ltr">
        <h2 className="mb-4 font-nastaliq-tight text-lg text-primary" dir="rtl">
          روزانہ مشاہدات بمقابلہ منفرد زائرین — آخری {days === 365 ? "پورا سال" : `${days} دن`}
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.series ?? []} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e5b43" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#0e5b43" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b8922e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#b8922e" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4dcc6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "Inter" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={28} />
              <YAxis tick={{ fontSize: 11, fontFamily: "Inter" }} allowDecimals={false} width={44} />
              <Tooltip
                labelStyle={{ fontFamily: "Inter", fontSize: 12 }}
                formatter={(value: number, name: string) => [value, name === "views" ? "مشاہدات" : "منفرد زائرین"]}
              />
              <Legend formatter={(v: string) => (v === "views" ? "مشاہدات" : "منفرد زائرین")} wrapperStyle={{ fontFamily: "inherit", fontSize: 13 }} />
              <Area type="monotone" dataKey="views" stroke="#0e5b43" strokeWidth={2} fill="url(#gv)" />
              <Area type="monotone" dataKey="visitors" stroke="#b8922e" strokeWidth={2} fill="url(#gu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] font-naskh text-muted-foreground" dir="rtl">
          مشاہدات = کل صفحہ لوڈز · منفرد زائرین = مختلف براؤزرز (کوکی بنیاد) — ایک زائر دن میں ایک صفحہ بار شمار ہوتا ہے۔
        </p>
      </div>

      {/* top content + authors */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="manuscript-frame rounded-xl bg-card p-5 lg:col-span-2">
          <h2 className="mb-3 font-nastaliq-tight text-lg text-primary">سب سے زیادہ دیکھی گئی تحریریں</h2>
          {(data?.top.length ?? 0) === 0 ? (
            <p className="py-8 text-center font-naskh text-sm text-muted-foreground">ابھی ریکارڈ کفایت نہیں۔</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 font-naskh text-primary">
                  <th className="px-3 py-2 text-start">عنوان</th>
                  <th className="px-3 py-2 text-start">قسم</th>
                  <th className="px-3 py-2 text-start">مصنف</th>
                  <th className="px-3 py-2 text-start">مشاہدات</th>
                </tr>
              </thead>
              <tbody className="font-naskh">
                {data?.top.map((t) => (
                  <tr key={`${t.type}-${t.id}`} className="border-t border-gold/15">
                    <td className="max-w-72 truncate px-3 py-2">{t.title}</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-accent px-2 py-0.5 text-xs">{TYPE_URDU[t.type] ?? t.type}</span></td>
                    <td className="px-3 py-2 text-muted-foreground">{t.author}</td>
                    <td className="px-3 py-2 font-latin tabular-nums font-semibold" dir="ltr">{fmt(t.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          <div className="manuscript-frame rounded-xl bg-card p-5">
            <h2 className="mb-3 font-nastaliq-tight text-lg text-primary">نمایاں مصنفین</h2>
            {(data?.topAuthors.length ?? 0) === 0 ? (
              <p className="py-4 text-center font-naskh text-xs text-muted-foreground">ابھی ڈیٹا نہیں۔</p>
            ) : (
              <ul className="space-y-2">
                {data?.topAuthors.map((a) => (
                  <li key={a.name} className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2 font-naskh text-sm">
                    <span className="truncate">{a.name}</span>
                    <span className="font-latin font-semibold" dir="ltr">{fmt(a.views)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="manuscript-frame rounded-xl bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-lg text-primary">
              <MessagesSquare className="h-5 w-5 text-gold" /> تبصرے
            </h2>
            <ul className="space-y-1.5 font-naskh text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">زیرِ انتظار</span><span className="font-latin font-semibold text-[#8a6d1a]" dir="ltr">{data?.comments.pending ?? 0}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">منظور شدہ</span><span className="font-latin font-semibold text-[#2f6d46]" dir="ltr">{data?.comments.approved ?? 0}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">مسترد</span><span className="font-latin font-semibold text-destructive" dir="ltr">{data?.comments.rejected ?? 0}</span></li>
              <li className="flex justify-between border-t border-gold/20 pt-1.5"><span>کل</span><span className="font-latin font-bold" dir="ltr">{data?.comments.total ?? 0}</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* likes */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="manuscript-frame rounded-xl bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-lg text-primary">
            <Heart className="h-5 w-5 text-rose-500" /> سب سے زیادہ پسندیدہ تحریریں — کل {fmt(data?.likes.total ?? 0)} پسندیدگیاں
          </h2>
          {(data?.likes.top.length ?? 0) === 0 ? (
            <p className="py-6 text-center font-naskh text-sm text-muted-foreground">ابھی کوئی پسندیدگی درج نہیں۔</p>
          ) : (
            <ul className="space-y-2">
              {data?.likes.top.map((l) => (
                <li key={`${l.type}-${l.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-accent/50 px-3 py-2 font-naskh text-sm">
                  <span className="truncate">{l.title} <span className="text-xs text-muted-foreground">({TYPE_URDU[l.type] ?? l.type})</span></span>
                  <span className="font-latin font-semibold text-rose-500" dir="ltr">{fmt(l.likes)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="manuscript-frame rounded-xl bg-card p-5">
          <h2 className="mb-3 font-nastaliq-tight text-lg text-primary">حالیہ پسندیدگیاں (مشکوک سرگرمی کی جانچ)</h2>
          {(data?.likes.recent.length ?? 0) === 0 ? (
            <p className="py-6 text-center font-naskh text-sm text-muted-foreground">ابھی کوئی ریکارڈ نہیں۔</p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto nice-scroll">
              {data?.likes.recent.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-accent/40 px-3 py-1.5 text-xs">
                  <span className="font-naskh">{l.user?.name ?? "مہمان"} <span className="text-muted-foreground">· {TYPE_URDU[l.resourceType] ?? l.resourceType}</span></span>
                  <span className="flex items-center gap-2">
                    <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">{new Date(l.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <button
                      className="text-destructive hover:opacity-70"
                      title="پسندیدگی حذف کریں"
                      onClick={async () => {
                        const res = await fetch(`/api/likes?id=${l.id}`, { method: "DELETE" });
                        if (res.ok) { await load(days); }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
