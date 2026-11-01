"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLock } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search, Menu, UserCircle2, LayoutDashboard, LogOut, PenLine,
  ShieldCheck, ChevronDown, BookOpenText, CalendarCheck2,
} from "lucide-react";

type Me = { id: string; name: string; penName: string | null; role: string; photoUrl: string | null } | null;

const NAV = [
  { label: "ہوم", href: "/" },
  { label: "شاعری", href: "/poetry" },
  { label: "مضامین", href: "/articles" },
  { label: "کتب خانہ", href: "/books" },
  { label: "شعرا و ادبا", href: "/poets" },
  { label: "اخبار", href: "/newspaper" },
];

const MORE = [
  { label: "ادبی خبریں", href: "/news" },
  { label: "ادبی مقابلے", href: "/competitions" },
  { label: "تقریبات", href: "/events" },
  { label: "لغت اور آج کا لفظ", href: "/dictionary" },
  { label: "ہمارا تعارف", href: "/about" },
];

const TOOLS = [
  { label: "قافیہ تلاش کریں", href: "/qafiya", desc: "اردو شاعری کے لیے قافیوں کا ذخیرہ" },
  { label: "تقطیع و بحر جانچیں", href: "/taqti", desc: "اردو عروض کا پیمانہ" },
];

function NavLinks({ inSheet = false }: { inSheet?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] font-naskh transition-colors",
            pathname === item.href
              ? "bg-accent text-primary font-semibold"
              : "text-foreground/80 hover:bg-accent hover:text-primary",
            inSheet && "block px-4 py-2.5 text-base"
          )}
        >
          {item.label}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger className="whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] font-naskh text-foreground/80 hover:bg-accent hover:text-primary outline-none data-[state=open]:bg-accent data-[state=open]:text-primary">
          <span className="inline-flex items-center gap-1">مزید <ChevronDown className="h-3.5 w-3.5" /></span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {MORE.map((m) => (
            <DropdownMenuItem key={m.href} asChild>
              <Link href={m.href} className="font-naskh text-[15px]">{m.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {TOOLS.map((t) => (
            <DropdownMenuItem key={t.href} asChild>
              <Link href={t.href} className="font-naskh text-[15px]">{t.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function SiteHeader() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d?.id ? d : null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gold/25 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* top utility strip */}
      <div className="pattern-emerald text-[#eee9d8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <p className="font-nastaliq-tight text-[13px] leading-none text-[#d9bc6a]">
            اردو ادب، روایت سے نئی نسل تک
          </p>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/submit" className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-naskh hover:bg-emerald-ink/60 transition-colors">
              <PenLine className="h-3.5 w-3.5" /> اپنی تحریر بھیجیں
            </Link>
            <span className="h-3.5 w-px bg-[#d9bc6a]/40" />
            <Link href="/qafiya" className="rounded-sm px-2 py-1 font-naskh hover:bg-emerald-ink/60 transition-colors">قافیہ</Link>
            <Link href="/taqti" className="rounded-sm px-2 py-1 font-naskh hover:bg-emerald-ink/60 transition-colors">تقطیع</Link>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <BrandLock />

        <nav className="mx-2 hidden flex-1 items-center gap-0.5 lg:flex">
          <NavLinks />
        </nav>

        <form onSubmit={submitSearch} className="relative ms-auto hidden w-52 md:block lg:w-64">
          <Search className="absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="سائٹ پر تلاش کریں…"
            className="h-9 bg-card pe-8 text-sm"
            aria-label="تلاش"
          />
        </form>

        {/* auth */}
        {!loading && me ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-gold/40 font-naskh">
                <UserCircle2 className="h-4.5 w-4.5 text-primary" />
                <span className="hidden max-w-24 truncate sm:inline">{me.penName || me.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-naskh">{me.penName || me.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="font-naskh">
                  <LayoutDashboard className="ms-0 h-4 w-4" /> میرا ڈیش بورڈ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/profile/${me.id}`} className="font-naskh">
                  <UserCircle2 className="ms-0 h-4 w-4" /> میری پروفائل
                </Link>
              </DropdownMenuItem>
              {me.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="font-naskh text-primary">
                    <ShieldCheck className="ms-0 h-4 w-4" /> ایڈمن پینل
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="font-naskh text-destructive">
                <LogOut className="ms-0 h-4 w-4" /> لاگ آؤٹ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !loading && (
            <Button asChild size="sm" className="hidden bg-primary font-naskh sm:inline-flex">
              <Link href="/login">لاگ اِن</Link>
            </Button>
          )
        )}

        {/* mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ms-1 lg:hidden border-gold/40" aria-label="مینو">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto p-0">
            <SheetHeader className="border-b border-gold/25 p-4 text-start">
              <SheetTitle asChild>
                <div className="flex items-center justify-between">
                  <BrandLock compact />
                </div>
              </SheetTitle>
            </SheetHeader>
            <div
              className="p-3"
              onClick={(e) => {
                // close the sheet when any navigation link inside is clicked
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <form onSubmit={submitSearch} className="relative mb-3">
                <Search className="absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="تلاش کریں…" className="bg-card pe-8" />
              </form>
              <nav className="flex flex-col gap-0.5">
                <NavLinks inSheet />
              </nav>
              <div className="my-3 border-t border-gold/25" />
              <div className="flex flex-col gap-0.5">
                {MORE.map((m) => (
                  <Link key={m.href} href={m.href} className="rounded-md px-4 py-2.5 text-base font-naskh hover:bg-accent">
                    {m.label}
                  </Link>
                ))}
              </div>
              <div className="my-3 border-t border-gold/25" />
              <div className="flex flex-col gap-2">
                {TOOLS.map((t) => (
                  <Link key={t.href} href={t.href} className="rounded-lg border border-gold/30 bg-card p-3">
                    <span className="font-naskh text-[15px] font-semibold text-primary">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  </Link>
                ))}
              </div>
              {!me && (
                <Button asChild className="mt-4 w-full bg-primary font-naskh">
                  <Link href="/login">لاگ اِن / رجسٹر</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="border-t border-gold/15 bg-secondary/60">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-1 nice-scroll">
          <BookOpenText className="h-3.5 w-3.5 shrink-0 text-gold" />
          <span className="shrink-0 text-xs text-muted-foreground font-naskh">اجلاسِ ادب:</span>
          {["غزل", "نظم", "رباعی", "مرثیہ", "حمد", "نعت", "صوفی شاعری", "افسانہ", "تنقید", "تحقیق"].map((c) => (
            <Link
              key={c}
              href={c === "افسانہ" || c === "تنقید" || c === "تحقیق" ? `/articles?category=${encodeURIComponent(c)}` : `/poetry?category=${encodeURIComponent(c)}`}
              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-naskh text-foreground/75 hover:bg-accent hover:text-primary transition-colors"
            >
              {c}
            </Link>
          ))}
          <CalendarCheck2 className="ms-2 h-3.5 w-3.5 shrink-0 text-gold" />
          <Link href="/newspaper" className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-naskh text-primary font-semibold hover:bg-accent">
            ہفتہ وار شمارہ
          </Link>
        </div>
      </div>
    </header>
  );
}
