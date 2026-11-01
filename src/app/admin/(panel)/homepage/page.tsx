"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowUp, ArrowDown, Eye, EyeOff, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = { key: string; label: string; visible: boolean };

export default function HomepageManager() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [heroFields, setHeroFields] = useState({ heroTitle: "", heroSubtitle: "", heroBadge: "", heroImage: "" });
  const [featured, setFeatured] = useState({ featuredPoemId: "", featuredArticleId: "", featuredBookId: "" });
  const [poems, setPoems] = useState<{ id: string; title: string }[]>([]);
  const [articles, setArticles] = useState<{ id: string; title: string }[]>([]);
  const [books, setBooks] = useState<{ id: string; title: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const s = await fetch("/api/settings").then((r) => r.json());
    setSettings(s);
    setHeroFields({
      heroTitle: s.heroTitle ?? "",
      heroSubtitle: s.heroSubtitle ?? "",
      heroBadge: s.heroBadge ?? "",
      heroImage: s.heroImage ?? "",
    });
    try { setSections(JSON.parse(s.homeSections ?? "[]")); } catch { setSections([]); }
    // featured options: read current featured ids from content lists
    const [p, a, b] = await Promise.all([
      fetch("/api/poems?all=1&limit=100&sort=views").then((r) => r.json()),
      fetch("/api/articles?all=1&limit=100&sort=views").then((r) => r.json()),
      fetch("/api/books?limit=100").then((r) => r.json()),
    ]);
    setPoems((Array.isArray(p) ? p : []).map((x: { id: string; title: string }) => ({ id: x.id, title: x.title })));
    setArticles((Array.isArray(a) ? a : []).map((x: { id: string; title: string }) => ({ id: x.id, title: x.title })));
    setBooks((Array.isArray(b) ? b : []).map((x: { id: string; title: string }) => ({ id: x.id, title: x.title })));
    setFeatured({
      featuredPoemId: s.featuredPoemId ?? "",
      featuredArticleId: s.featuredArticleId ?? "",
      featuredBookId: s.featuredBookId ?? "",
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...heroFields,
          ...featured,
          homeSections: JSON.stringify(sections),
        }),
      });
      if (res.ok) toast({ title: "ہوم پیج ترتیبات محفوظ ہو گئیں", description: "تبدیلیاں فوراً عوامی سائٹ پر نظر آئیں گی۔" });
      else toast({ title: "محفوظ نہیں ہوا", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const uploadHero = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) {
        setHeroFields((f) => ({ ...f, heroImage: d.url }));
        toast({ title: "تصویر اپلوڈ ہو گئی — محفوظ کرنا نہ بھولیں" });
      } else {
        toast({ title: d.error ?? "اپلوڈ ناکام", variant: "destructive" });
      }
    } finally {
      setUploading(false);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
  };

  const toggle = (idx: number) => {
    const next = [...sections];
    next[idx] = { ...next[idx], visible: !next[idx].visible };
    setSections(next);
  };

  if (settings === null) {
    return <div><AdminPageHeader title="ہوم پیج مینجمنٹ" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="ہوم پیج مینجمنٹ"
        subtitle="ہیرو تصویر، سیکشنز کی ترتیب و نمائش، اور نمایاں تحریریں — بغیر کوڈ کے"
        action={
          <Button onClick={save} disabled={busy} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} سب محفوظ کریں
          </Button>
        }
      />

      {/* hero management */}
      <div className="manuscript-frame rounded-xl bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <ImageIcon className="h-5 w-5 text-gold" /> ہیرو سیکشن
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-naskh">ہیرو سرخی</Label>
              <Input value={heroFields.heroTitle} onChange={(e) => setHeroFields({ ...heroFields, heroTitle: e.target.value })} className="font-naskh" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">ہیرو تعارف</Label>
              <Input value={heroFields.heroSubtitle} onChange={(e) => setHeroFields({ ...heroFields, heroSubtitle: e.target.value })} className="font-naskh" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">بیج لیبل</Label>
              <Input value={heroFields.heroBadge} onChange={(e) => setHeroFields({ ...heroFields, heroBadge: e.target.value })} className="font-naskh" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">ہیرو تصویر (اصل معیار برقرار رہتا ہے)</Label>
              <div className="flex items-center gap-2">
                <Input value={heroFields.heroImage} onChange={(e) => setHeroFields({ ...heroFields, heroImage: e.target.value })} dir="ltr" className="font-latin text-xs" />
                <label className="shrink-0 cursor-pointer rounded-md border border-gold/40 px-3 py-2 font-naskh text-sm text-primary hover:bg-accent">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "اپلوڈ"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} />
                </label>
              </div>
              {heroFields.heroImage && (
                 
                <img src={heroFields.heroImage} alt="ہیرو پیش منظر" className="mt-2 max-h-40 rounded-lg border border-gold/30 object-contain" />
              )}
            </div>
          </div>
          <div className="rounded-lg bg-accent/40 p-4">
            <h3 className="mb-2 font-naskh font-semibold text-primary">ہدایات</h3>
            <ul className="list-inside list-disc space-y-1.5 font-naskh text-sm leading-7 text-foreground/80">
              <li>ہیرو تصویر کے لیے موزوں سائز: 1600×900 پکسل یا اس سے بڑا (تناسب محفوظ رہتا ہے، کھنچاؤ نہیں ہوتا)۔</li>
              <li>«نمایاں» انتخاب سے متعلق تحریر ہوم پیج کے پہلے خانے میں پیش منظر کے ساتھ ظاہر ہوتی ہے۔</li>
              <li>سیکشن کی ترتیب اور نمائش نیچے والی فہرست سے کنٹرول ہوتی ہے۔</li>
              <li>ہر تبدیلی کے بعد «سب محفوظ کریں» دبائیں — تبدیلیاں فوراً لاگو ہوتی ہیں۔</li>
            </ul>
          </div>
        </div>
      </div>

      {/* featured picks */}
      <div className="manuscript-frame mt-6 rounded-xl bg-card p-5">
        <h2 className="mb-4 font-nastaliq-tight text-xl text-primary">نمایاں تحریریں (Featured)</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="font-naskh">نمایاں نظم (ID خالی = خودکار)</Label>
            <select
              value={featured.featuredPoemId}
              onChange={(e) => setFeatured({ ...featured, featuredPoemId: e.target.value })}
              className="h-10 w-full rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm"
            >
              <option value="">خودکار (تازہ نمایاں)</option>
              {poems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-naskh">نمایاں مضمون (ID خالی = خودکار)</Label>
            <select
              value={featured.featuredArticleId}
              onChange={(e) => setFeatured({ ...featured, featuredArticleId: e.target.value })}
              className="h-10 w-full rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm"
            >
              <option value="">خودکار (تازہ نمایاں)</option>
              {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-naskh">نمایاں کتاب (ID خالی = خودکار)</Label>
            <select
              value={featured.featuredBookId}
              onChange={(e) => setFeatured({ ...featured, featuredBookId: e.target.value })}
              className="h-10 w-full rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm"
            >
              <option value="">خودکار (نمایاں نشان والی)</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* sections order */}
      <div className="manuscript-frame mt-6 rounded-xl bg-card p-5">
        <h2 className="mb-4 font-nastaliq-tight text-xl text-primary">ہوم پیج سیکشنز — ترتیب اور نمائش</h2>
        <ul className="space-y-2">
          {sections.map((s, idx) => (
            <li key={s.key} className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
              s.visible ? "border-gold/30 bg-accent/40" : "border-dashed border-gold/30 bg-muted/40 opacity-60"
            )}>
              <span className="flex items-center gap-3">
                <span className="font-latin text-xs text-muted-foreground" dir="ltr">{idx + 1}.</span>
                <span className="font-naskh text-[15px]">{s.label}</span>
              </span>
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(idx, -1)} aria-label="اوپر">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(idx, 1)} aria-label="نیچے">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggle(idx)} aria-label="نمائش">
                  {s.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-naskh text-muted-foreground">
          چھوٹا نمبر اوپر دکھایا جاتا ہے۔ آنکھ کے نشان سے سیکشن چھپائیں یا دکھائیں — ہوم پیج فوراً اپ ڈیٹ ہو جاتا ہے۔
        </p>
      </div>
    </div>
  );
}
