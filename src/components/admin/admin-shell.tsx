"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, BookOpen, Users2, Newspaper, BookA, Quote,
  Trophy, CalendarDays, ImageIcon, Sparkles, FlaskConical, UserCog,
  Inbox, Settings, ExternalLink, Loader2, ShieldCheck, Menu,
  Megaphone, BarChart3, MessagesSquare, Heart, LayoutTemplate, Palette,
  ScrollText, Trash2, Clock, KeyRound, LogOut, Mail, DollarSign,
} from "lucide-react";

type Me = { id: string; name: string; email: string; penName: string | null; mustChangePassword?: boolean } | null;

const GROUPS: { title: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    title: "جائزہ",
    items: [
      { href: "/admin", label: "ڈیش بورڈ", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "تجزیات و شماریات", icon: BarChart3 },
    ],
  },
  {
    title: "ادارتی عمل",
    items: [
      { href: "/admin/submissions", label: "منظوری مرکز", icon: Inbox },
      { href: "/admin/scheduled", label: "شیڈول شدہ اشاعتیں", icon: Clock },
    ],
  },
  {
    title: "مواد",
    items: [
      { href: "/admin/poems", label: "شاعری و غزلیں", icon: BookOpen },
      { href: "/admin/articles", label: "مضامین و تحقیق", icon: Quote },
      { href: "/admin/news", label: "ادبی خبریں", icon: Megaphone },
      { href: "/admin/books", label: "کتب و اشاعتیں", icon: BookA },
      { href: "/admin/poets", label: "شعرا و مصنفین", icon: Users2 },
    ],
  },
  {
    title: "سیٹنگز",
    items: [
      { href: "/admin/homepage", label: "ہوم پیج مینجمنٹ", icon: LayoutTemplate },
      { href: "/admin/appearance", label: "لوگو، ونٹر مارک و اردو فونٹس", icon: Palette },
      { href: "/admin/ads", label: "اشتہارات (دو کالم)", icon: DollarSign },
      { href: "/admin/mail", label: "ای میل سینٹر", icon: Mail },
      { href: "/admin/settings", label: "سائٹ ترتیبات و SEO", icon: Settings },
    ],
  },
  {
    title: "اخبار و روزانہ",
    items: [
      { href: "/admin/newspaper", label: "ہفتہ وار شمارے", icon: Newspaper },
      { href: "/admin/words", label: "آج کا لفظ", icon: BookA },
      { href: "/admin/shers", label: "آج کا شعر", icon: Quote },
      { href: "/admin/banners", label: "بینر میڈیا", icon: ImageIcon },
    ],
  },
  {
    title: "تفاعل",
    items: [
      { href: "/admin/comments", label: "تبصرہ مینجمنٹ", icon: MessagesSquare },
      { href: "/admin/likes", label: "پسندیدگی مینجمنٹ", icon: Heart },
      { href: "/admin/competitions", label: "ادبی مقابلے", icon: Trophy },
      { href: "/admin/events", label: "تقریبات", icon: CalendarDays },
    ],
  },
  {
    title: "اوزار",
    items: [
      { href: "/admin/qafiya", label: "قافیہ مینجمنٹ", icon: Sparkles },
      { href: "/admin/behrs", label: "بحریں و ارکان", icon: FlaskConical },
    ],
  },
  {
    title: "نظام و انتظام",
    items: [
      { href: "/admin/admins", label: "ایڈمنسٹریٹرز", icon: ShieldCheck },
      { href: "/admin/users", label: "مصنفین و صارفین", icon: UserCog },
      { href: "/admin/deleted", label: "حذف شدہ مواد", icon: Trash2 },
      { href: "/admin/logs", label: "سیکیورٹی و آڈٹ لاگ", icon: ScrollText },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.id || d.role !== "ADMIN") {
          router.push("/admin/login");
        } else {
          setMe(d);
        }
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => setSidebarOpen(false), [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const changePassword = async () => {
    if (newPw.length < 6) {
      toast({ title: "نیا پاس ورڈ کم از کم 6 حروف کا ہو", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "دونوں نئے پاس ورڈ ایک جیسے ہوں", variant: "destructive" });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "خرابی", variant: "destructive" });
        return;
      }
      toast({ title: "پاس ورڈ تبدیل ہو گیا" });
      setPwOpen(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setMe((m) => (m ? { ...m, mustChangePassword: false } : m));
    } finally {
      setPwBusy(false);
    }
  };

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/50">
      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-emerald-ink/40 bg-sidebar px-4 py-2.5 text-sidebar-foreground lg:hidden">
        <div className="flex items-center gap-2">
          <LogoMark size={36} />
          <span className="font-nastaliq-tight text-lg text-[#f3ead2]">ایڈمن پینل</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)} aria-label="مینو" className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 w-72 overflow-y-auto bg-sidebar text-sidebar-foreground nice-scroll transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 border-b border-emerald-ink/40 p-4">
          <LogoMark size={52} />
          <div>
            <p className="font-nastaliq-tight text-xl leading-8 text-[#f3ead2]">پیامِ ادب</p>
            <p className="flex items-center gap-1 text-xs font-naskh text-[#d9bc6a]">
              <ShieldCheck className="h-3.5 w-3.5" /> ایڈمن پینل
            </p>
          </div>
        </div>

        <nav className="p-3 pb-8">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-3">
              <p className="mb-1.5 px-3 text-[11px] font-naskh tracking-wide text-[#d9bc6a]/70">{g.title}</p>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-naskh transition-colors",
                        active
                          ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                          : "text-[#eee9d8]/85 hover:bg-sidebar-accent hover:text-[#f3ead2]"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-2 space-y-0.5 border-t border-emerald-ink/40 pt-4">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-naskh text-[#eee9d8]/85 hover:bg-sidebar-accent">
              <ExternalLink className="h-4 w-4" /> سائٹ دیکھیں
            </Link>
            <button onClick={() => setPwOpen(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-naskh text-[#eee9d8]/85 hover:bg-sidebar-accent">
              <KeyRound className="h-4 w-4" /> پاس ورڈ تبدیل کریں
            </button>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-naskh text-[#f0cfcf] hover:bg-sidebar-accent">
              <LogOut className="h-4 w-4" /> لاگ آؤٹ
            </button>
          </div>
        </nav>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
        {me.mustChangePassword && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8a6d1a]/40 bg-[#fdf3d7] px-4 py-2.5 lg:px-8">
            <p className="text-sm font-naskh text-[#6d5311]">
              <ShieldCheck className="me-1.5 inline h-4 w-4" />
              آپ ابتدائی پاس ورڈ استعمال کر رہے ہیں — سکیورٹی کے لیے فوراً نیا پاس ورڈ مقرر کریں۔
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setPwOpen(true)} className="h-8 bg-[#8a6d1a] font-naskh hover:bg-[#6d5311]">
                ابھی تبدیل کریں
              </Button>
              <button
                onClick={async () => {
                  await fetch("/api/admins", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ op: "ack-password-changed" }),
                  });
                  setMe((m) => (m ? { ...m, mustChangePassword: false } : m));
                }}
                className="text-xs font-naskh text-[#6d5311]/80 underline"
              >
                بعد میں
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </div>

      {/* change password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">پاس ورڈ تبدیل کریں</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="font-naskh">موجودہ پاس ورڈ</Label>
              <Input type="password" dir="ltr" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="font-latin" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">نیا پاس ورڈ (کم از کم 6 حروف)</Label>
              <Input type="password" dir="ltr" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="font-latin" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">نئے پاس ورڈ کی تصدیق</Label>
              <Input type="password" dir="ltr" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="font-latin" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} className="font-naskh">منسوخ</Button>
            <Button onClick={changePassword} disabled={pwBusy} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {pwBusy && <Loader2 className="h-4 w-4 animate-spin" />} محفوظ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gold/30 pb-4">
      <div>
        <h1 className="font-nastaliq-tight text-2xl leading-[1.9] text-primary">{title}</h1>
        {subtitle && <p className="text-sm font-naskh text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
