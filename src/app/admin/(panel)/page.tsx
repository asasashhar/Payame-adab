"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Users2, BookA, Newspaper, Inbox, Trophy, CalendarDays,
  Sparkles, Quote, Activity, ExternalLink, Eye, Heart, MessagesSquare,
  Megaphone, Clock, Archive, FileEdit, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  users: number; adminsActive: number; poets: number;
  poems: number; poemsPending: number; poemsScheduled: number; poemsArchived: number;
  articles: number; articlesPending: number; articlesScheduled: number;
  news: number; newsPending: number; newsScheduled: number;
  books: number; editions: number; publishedEditions: number;
  competitions: number; events: number; qafiya: number;
  publishedPoems: number; publishedArticles: number;
  views: { today: number; week: number; month: number; all: number };
  visitors: { today: number; week: number; month: number };
  likesTotal: number; commentsPending: number; commentsApproved: number; drafts: number;
  recentActivity: { id: string; action: string; detail: string; actorEmail: string | null; createdAt: string }[];
  publishedNow: number;
};

const ACTION_URDU: Record<string, string> = {
  register: "رجسٹریشن", login: "لاگ اِن", "admin-login": "ایڈمن لاگ اِن",
  submission: "نئی تحریر", update: "تبدیلی", delete: "حذف",
  upload: "اپلوڈ", settings: "ترتیبات", comment: "تبصرہ",
  "comment-moderate": "تبصرہ منظوری", "comment-delete": "تبصرہ حذف",
  like: "پسندیدگی", "like-delete": "پسندیدگی حذف",
  "admin-create": "نیا ایڈمن", "admin-toggle": "ایڈمن حالت",
  "admin-reset-password": "ایڈمن پاس ورڈ ری سیٹ", "admin-revoke": "ایڈمن ہٹایا",
  restore: "بحالی", "poem-update": "شاعری تبدیل", "poem-delete": "شاعری حذف",
  "article-update": "مضمون تبدیل", "article-delete": "مضمون حذف",
  "news-update": "خبر تبدیل", "news-delete": "خبر حذف",
  "password-change": "پاس ورڈ تبدیل", "reset-request": "بازیابی درخواست",
  "reset-consumed": "بازیابی مکمل", view: "مشاہدہ",
};

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString("en-US") : String(n);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div>
        <AdminPageHeader title="ڈیش بورڈ" subtitle="مکمل جائزہ لوڈ ہو رہا ہے…" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const mainCards = [
    { label: "آج کے مشاہدات", value: fmt(stats.views.today), sub: `آج کے منفرد: ${fmt(stats.visitors.today)}`, icon: Eye, href: "/admin/analytics", accent: "text-emerald-deep" },
    { label: "کل مشاہدات", value: fmt(stats.views.all), sub: `اس ماہ: ${fmt(stats.views.month)}`, icon: Activity, href: "/admin/analytics", accent: "text-emerald-deep" },
    { label: "پسندیدگیاں", value: fmt(stats.likesTotal), icon: Heart, href: "/admin/likes", accent: "text-rose-500" },
    { label: "زیرِ انتظار تبصرے", value: fmt(stats.commentsPending), sub: `منظور شدہ: ${fmt(stats.commentsApproved)}`, icon: MessagesSquare, href: "/admin/comments", accent: "text-[#8a6d1a]", pulse: stats.commentsPending > 0 },
  ];

  const contentCards = [
    { label: "زیرِ جائزہ (تمام)", value: fmt(stats.poemsPending + stats.articlesPending + stats.newsPending), sub: "منظوری مرکز", icon: Inbox, href: "/admin/submissions", accent: "text-[#8a6d1a]", pulse: stats.poemsPending + stats.articlesPending + stats.newsPending > 0 },
    { label: "شائع شدہ شاعری", value: fmt(stats.publishedPoems), icon: BookOpen, href: "/admin/poems", accent: "text-primary" },
    { label: "شائع شدہ مضامین", value: fmt(stats.publishedArticles), icon: Quote, href: "/admin/articles", accent: "text-primary" },
    { label: "ادبی خبریں", value: fmt(stats.news), sub: `زیرِ جائزہ: ${fmt(stats.newsPending)}`, icon: Megaphone, href: "/admin/news", accent: "text-primary" },
    { label: "مسودات", value: fmt(stats.drafts), icon: FileEdit, href: "/admin/submissions?status=DRAFT", accent: "text-muted-foreground" },
    { label: "شیڈول شدہ", value: fmt(stats.poemsScheduled + stats.articlesScheduled + stats.newsScheduled), icon: Clock, href: "/admin/scheduled", accent: "text-[#2a4d8f]" },
    { label: "کتب", value: fmt(stats.books), icon: BookA, href: "/admin/books", accent: "text-primary" },
    { label: "شمارے", value: `${fmt(stats.publishedEditions)}/${fmt(stats.editions)}`, icon: Newspaper, href: "/admin/newspaper", accent: "text-primary" },
    { label: "شعرا و ادبا", value: fmt(stats.poets), icon: Users2, href: "/admin/poets", accent: "text-primary" },
    { label: "جاری مقابلے", value: fmt(stats.competitions), icon: Trophy, href: "/admin/competitions", accent: "text-primary" },
    { label: "تقریبات", value: fmt(stats.events), icon: CalendarDays, href: "/admin/events", accent: "text-primary" },
    { label: "قافیہ ذخیرہ", value: fmt(stats.qafiya), icon: Sparkles, href: "/admin/qafiya", accent: "text-primary" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="ڈیش بورڈ — مکمل جائزہ"
        subtitle="پیامِ ادب کا ہر شعبہ اسی پینل سے منظم ہوتا ہے — تمام اعداد اصل ریکارڈ سے"
        action={
          <div className="flex items-center gap-2">
            {stats.publishedNow > 0 && (
              <span className="rounded-full bg-[#e3f0e6] px-3 py-1 text-xs font-naskh text-[#2f6d46]">
                {stats.publishedNow} شیڈول شدہ تحریریں ابھی شائع ہوئیں
              </span>
            )}
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 px-3 py-1.5 text-sm font-naskh text-primary hover:bg-accent">
              <ExternalLink className="h-4 w-4" /> سائٹ دیکھیں
            </Link>
          </div>
        }
      />

      {/* traffic summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((c) => (
          <Link key={c.label} href={c.href} className="manuscript-frame group rounded-xl bg-card p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-naskh text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-latin text-3xl font-bold tabular-nums text-foreground">{c.value}</p>
                {c.sub && <p className="mt-0.5 text-xs font-naskh text-muted-foreground">{c.sub}</p>}
              </div>
              <c.icon className={cn("h-6 w-6", c.accent, c.pulse && "animate-pulse")} />
            </div>
          </Link>
        ))}
      </div>

      {/* content summary */}
      <h2 className="mb-3 mt-8 font-nastaliq-tight text-xl text-primary">مواد کا جائزہ</h2>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {contentCards.map((c) => (
          <Link key={c.label} href={c.href} className="manuscript-frame group rounded-xl bg-card p-3.5 transition-shadow hover:shadow-md">
            <c.icon className={cn("h-5 w-5", c.accent, c.pulse && "animate-pulse")} />
            <p className="mt-2 font-latin text-2xl font-bold tabular-nums">{c.value}</p>
            <p className="font-naskh text-xs text-muted-foreground">{c.label}</p>
            {c.sub && <p className="text-[10px] font-naskh text-muted-foreground/80">{c.sub}</p>}
          </Link>
        ))}
      </div>

      {/* system + activity */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="manuscript-frame rounded-xl bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-lg text-primary">
            <ShieldCheck className="h-5 w-5 text-gold" /> نظام
          </h3>
          <ul className="space-y-2.5 text-sm font-naskh">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">فعال ایڈمنسٹریٹرز</span>
              <Link href="/admin/admins" className="font-latin font-semibold text-primary hover:text-gold">{stats.adminsActive} / 5</Link>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">رجسٹرڈ صارفین</span>
              <Link href="/admin/users" className="font-latin font-semibold text-primary hover:text-gold">{fmt(stats.users)}</Link>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">آرکائیو شاعری</span>
              <span className="font-latin font-semibold">{fmt(stats.poemsArchived)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">ہفتہ وار مشاہدات</span>
              <span className="font-latin font-semibold">{fmt(stats.views.week)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">ماہانہ منفرد زائرین</span>
              <span className="font-latin font-semibold">{fmt(stats.visitors.month)}</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/admins" className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-xs font-naskh text-primary hover:bg-gold/20">
              ایڈمنسٹریٹرز
            </Link>
            <Link href="/admin/logs" className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-xs font-naskh text-primary hover:bg-gold/20">
              آڈٹ لاگ
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="manuscript-frame h-full rounded-xl bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-lg text-primary">
              <Activity className="h-5 w-5 text-gold" /> حالیہ کارروائیاں (آڈٹ لاگ)
            </h3>
            {stats.recentActivity.length === 0 ? (
              <p className="py-6 text-center font-naskh text-sm text-muted-foreground">ابھی کوئی کارروائی درج نہیں۔</p>
            ) : (
              <ul className="space-y-2">
                {stats.recentActivity.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm">
                    <span className="font-naskh">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">{ACTION_URDU[a.action] ?? a.action}</span>
                      <span className="ms-2 text-foreground/80" dir="auto">{a.detail}</span>
                    </span>
                    <span className="font-latin text-[11px] text-muted-foreground" dir="ltr">
                      {a.actorEmail ?? "—"} · {new Date(a.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
