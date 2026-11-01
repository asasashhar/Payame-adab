"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { URDU_FONTS } from "@/lib/fonts";
import { Loader2, Save, Palette, Droplets, Type, Upload, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "emerald", label: "زمرد و سنہری", swatch: "#0e5b43" },
  { key: "navy", label: "نیلا سنہری (لاگو کے رنگ)", swatch: "#122a5c" },
  { key: "maroon", label: "عنابی سنہری", swatch: "#6d1f2c" },
];

const WATERMARK_POSITIONS = [
  { key: "center", label: "درمیان" },
  { key: "top-start", label: "اوپر دائیں" },
  { key: "top-end", label: "اوپر بائیں" },
  { key: "bottom-start", label: "نیچے دائیں" },
  { key: "bottom-end", label: "نیچے بائیں" },
];

const WM_TYPES = [
  { key: "poem", label: "شاعری" },
  { key: "article", label: "مضامین" },
  { key: "book", label: "کتب" },
  { key: "news", label: "خبریں" },
];

export default function AppearancePage() {
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/settings").then((r) => r.json());
    setS(d);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (keys: string[], label: string) => {
    if (!s) return;
    setSaving(label);
    try {
      const body: Record<string, string> = {};
      for (const k of keys) body[k] = s[k] ?? "";
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) toast({ title: "محفوظ ہو گیا", description: "تبدیلیاں ساری سائٹ پر لاگو ہو گئیں۔" });
      else toast({ title: "محفوظ نہیں ہوا", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const upload = async (file: File, key: "logoUrl" | "logoHorizontalUrl") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok && s) {
        setS({ ...s, [key]: d.url });
        toast({ title: "اپلوڈ مکمل — «محفوظ کریں» دبائیں" });
      } else toast({ title: d.error ?? "اپلوڈ ناکام", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const set = (key: string, value: string) => setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  if (s === null) {
    return <div><AdminPageHeader title="ظاہری شکل" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  let wmTypes: string[] = ["poem", "article", "book", "news"];
  try { wmTypes = JSON.parse(s.watermarkTypes ?? "[]"); } catch { /* default */ }

  return (
    <div>
      <AdminPageHeader
        title="لوگو، ونٹر مارک، تھیم اور اردو فونٹس"
        subtitle="سرکاری برانڈنگ، پانی کا نشان، رنگ اور ممنوعہ دس اردو فونٹس کی ترتیب"
      />

      {/* ---------- LOGO ---------- */}
      <section className="manuscript-frame rounded-xl bg-card p-5">
        <h2 className="mb-4 font-nastaliq-tight text-xl text-primary">سرکاری لوگو</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-naskh">گول بیج لوگو (ہیڈر، ایڈمن، واٹر مارک، فاو آئیکون)</Label>
            <div className="flex items-center gap-3">
              { }
              <img src={s.logoUrl} alt="لوگو" className="h-16 w-16 rounded-lg border border-gold/30 object-contain" />
              <Input value={s.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} dir="ltr" className="font-latin text-xs" />
              <label className="shrink-0 cursor-pointer rounded-md border border-gold/40 px-3 py-2 font-naskh text-sm text-primary hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logoUrl")} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-naskh">افقی لوگو (فوٹر، لاگ اِن صفحہ)</Label>
            <div className="flex items-center gap-3">
              { }
              <img src={s.logoHorizontalUrl} alt="لوگو" className="h-14 rounded-lg border border-gold/30 bg-white object-contain px-2" />
              <Input value={s.logoHorizontalUrl} onChange={(e) => set("logoHorizontalUrl", e.target.value)} dir="ltr" className="font-latin text-xs" />
              <label className="shrink-0 cursor-pointer rounded-md border border-gold/40 px-3 py-2 font-naskh text-sm text-primary hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logoHorizontalUrl")} />
              </label>
            </div>
          </div>
        </div>
        <Button onClick={() => save(["logoUrl", "logoHorizontalUrl"], "logo")} disabled={saving === "logo"} className="mt-4 gap-2 bg-primary font-naskh hover:bg-emerald-deep">
          {saving === "logo" && <Loader2 className="h-4 w-4 animate-spin" />} لوگو محفوظ کریں
        </Button>
        <p className="mt-2 text-xs font-naskh text-muted-foreground">
          نوٹ: فاو آئیکون src/app/icon.png پر ایک الگ فائل ہے (لوگو بدلنے پر ایڈمن اسے بھی اپ ڈیٹ کرے)۔
        </p>
      </section>

      {/* ---------- WATERMARK ---------- */}
      <section className="manuscript-frame mt-6 rounded-xl bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <Droplets className="h-5 w-5 text-gold" /> آفیشل لوگو ونٹر مارک (ہر شائع شدہ تحریر پر خودکار)
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={s.watermarkEnabled !== "0"}
                onChange={(e) => set("watermarkEnabled", e.target.checked ? "1" : "0")}
                className="h-4 w-4"
              />
              <span className="font-naskh text-sm">ونٹر مارک فعال ہو (سکرین + پرنٹ/پی ڈی ایف دونوں میں)</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-naskh">شفافی (%) — {s.watermarkOpacity}</Label>
                <input
                  type="range" min={1} max={30} value={Number(s.watermarkOpacity ?? 6)}
                  onChange={(e) => set("watermarkOpacity", e.target.value)}
                  className="w-full"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">سائز (px) — {s.watermarkSize}</Label>
                <input
                  type="range" min={120} max={720} step={10} value={Number(s.watermarkSize ?? 340)}
                  onChange={(e) => set("watermarkSize", e.target.value)}
                  className="w-full"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-naskh">مقام</Label>
              <div className="flex flex-wrap gap-1.5">
                {WATERMARK_POSITIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => set("watermarkPosition", p.key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-naskh transition-colors",
                      (s.watermarkPosition ?? "center") === p.key ? "border-emerald-deep bg-emerald-deep text-[#f3ead2]" : "border-gold/40 bg-card hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-naskh">کس اقسام پر لگے؟</Label>
              <div className="flex flex-wrap gap-1.5">
                {WM_TYPES.map((t) => {
                  const on = wmTypes.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        const next = on ? wmTypes.filter((x) => x !== t.key) : [...wmTypes, t.key];
                        set("watermarkTypes", JSON.stringify(next));
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-naskh transition-colors",
                        on ? "border-emerald-deep bg-emerald-deep text-[#f3ead2]" : "border-gold/40 bg-card hover:bg-accent"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => save(["watermarkEnabled", "watermarkOpacity", "watermarkSize", "watermarkPosition", "watermarkTypes"], "wm")} disabled={saving === "wm"} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {saving === "wm" && <Loader2 className="h-4 w-4 animate-spin" />} ونٹر مارک محفوظ کریں
            </Button>
          </div>

          {/* live preview */}
          <div>
            <Label className="font-naskh">پیش منظر</Label>
            <div className="relative mt-2 flex h-56 items-center justify-center overflow-hidden rounded-lg border border-gold/30 bg-[#fffdf7]">
              { }
              <img
                src="/brand/watermark.png"
                alt=""
                className="pointer-events-none absolute select-none"
                style={{
                  width: Number(s.watermarkSize ?? 340),
                  opacity: Math.max(1, Math.min(30, Number(s.watermarkOpacity ?? 6))) / 100,
                  objectFit: "contain",
                }}
              />
              <p className="relative z-10 max-w-xs text-center font-nastaliq text-lg leading-9 text-foreground/90">
                یہاں آپ کی تحریر آئی گی — ونٹر مارک پیچھے باریک سا نظر آئے گا اور پڑھنے میں رکاوٹ نہیں بنے گا۔
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- THEME ---------- */}
      <section className="manuscript-frame mt-6 rounded-xl bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <Palette className="h-5 w-5 text-gold" /> سائٹ کے رنگ (تھیم)
        </h2>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => set("themePreset", t.key)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                (s.themePreset ?? "emerald") === t.key ? "border-emerald-deep bg-accent" : "border-gold/40 bg-card hover:bg-accent"
              )}
            >
              <span className="h-8 w-8 rounded-full border border-gold/50" style={{ backgroundColor: t.swatch }} />
              <span className="font-naskh text-sm">{t.label}</span>
              {(s.themePreset ?? "emerald") === t.key && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
        <Button onClick={() => save(["themePreset"], "theme")} disabled={saving === "theme"} className="mt-4 gap-2 bg-primary font-naskh hover:bg-emerald-deep">
          {saving === "theme" && <Loader2 className="h-4 w-4 animate-spin" />} تھیم محفوظ کریں
        </Button>

        {/* custom color overrides */}
        <div className="mt-6 border-t border-gold/20 pt-5">
          <h3 className="mb-1 font-nastaliq-tight text-lg text-primary">اپنے رنگ خود مقرر کریں</h3>
          <p className="mb-4 font-naskh text-xs leading-6 text-muted-foreground">
            خالی چھوڑیں تو منتخب تھیم کے رنگ استعمال ہوں گے۔ کوئی بھی رنگ بدلیں تو وہ ساری سائٹ پر فوراً لاگو ہو جائے گا۔
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { key: "colorPrimary", label: "مرکزی رنگ (ہیڈر، بٹن)", placeholder: "#0e5b43" },
              { key: "colorGold", label: "سنہری رنگ (نمایاں حصے)", placeholder: "#b8922e" },
              { key: "colorBackground", label: "پس منظر", placeholder: "#f7f1e1" },
              { key: "colorForeground", label: "تحریر کا رنگ", placeholder: "#242424" },
            ] as const).map((c) => (
              <div key={c.key} className="space-y-1.5">
                <Label className="font-naskh">{c.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={c.label}
                    value={/^#[0-9a-fA-F]{6}$/.test(s[c.key] ?? "") ? (s[c.key] as string) : c.placeholder}
                    onChange={(e) => set(c.key, e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border border-gold/40 bg-card p-1"
                  />
                  <Input
                    value={s[c.key] ?? ""}
                    placeholder={c.placeholder}
                    dir="ltr"
                    onChange={(e) => set(c.key, e.target.value)}
                    className="font-latin text-xs"
                  />
                  {s[c.key] ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => set(c.key, "")} aria-label="صاف کریں">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => save(["colorPrimary", "colorGold", "colorBackground", "colorForeground"], "colors")} disabled={saving === "colors"} className="mt-4 gap-2 bg-primary font-naskh hover:bg-emerald-deep">
            {saving === "colors" && <Loader2 className="h-4 w-4 animate-spin" />} رنگ محفوظ کریں
          </Button>
        </div>
      </section>

      {/* ---------- URDU FONTS ---------- */}
      <section className="manuscript-frame mt-6 rounded-xl bg-card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <Type className="h-5 w-5 text-gold" /> اردو فونٹس — صرف منظور شدہ 10 خاندان
        </h2>
        <p className="mb-4 font-naskh text-xs leading-6 text-muted-foreground">
          فہرست میں صرف یہی دس اردو فونٹ رکھے جا سکتے ہیں — کوئی اضافی اردو فونٹ سسٹم میں داخل نہیں ہو سکتا۔
          جس فونٹ کی فائل موجود نہ ہو وہ نشان زد ہے؛ متعلقہ لائسنس شدہ فائل <span className="font-latin" dir="ltr">public/fonts/</span> میں فراہم کرنے پر وہ خودکار طور پر فعال ہو جائے گا۔
        </p>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* selector list */}
          <div className="space-y-2">
            {URDU_FONTS.map((f) => (
              <div key={f.id} className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5",
                f.available ? "border-gold/25 bg-card" : "border-dashed border-destructive/30 bg-[#fff7f7]"
              )}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-naskh text-sm font-semibold">
                    {f.available ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2f6d46]" /> : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                    {f.name}
                  </p>
                  <p className="mt-0.5 font-nastaliq-tight text-base text-foreground/80">{f.urdu}</p>
                  {f.note && <p className="mt-0.5 text-[11px] leading-5 font-naskh text-muted-foreground">{f.note}</p>}
                </div>
                {f.available ? (
                  <span className="shrink-0 font-latin text-[10px] text-muted-foreground" dir="ltr">{f.format.toUpperCase()}</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-[#fbe4e4] px-2 py-0.5 text-[10px] font-naskh text-destructive">فائل موجود نہیں</span>
                )}
              </div>
            ))}
          </div>

          {/* selection + sizes */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-naskh">متن کا فونٹ (Body)</Label>
              <select
                value={s.fontBody}
                onChange={(e) => set("fontBody", e.target.value)}
                className="h-11 w-full rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm"
              >
                {URDU_FONTS.filter((f) => f.available).map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.urdu}</option>
                ))}
              </select>
              <div className="rounded-lg bg-accent/40 p-3 text-center font-nastaliq text-lg leading-9">
                اردو زبان کی خوبصورتی نستعلیق کے بغیر ادھوری ہے۔
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-naskh">سرخیوں کا فونٹ (Headings)</Label>
              <select
                value={s.fontHeading}
                onChange={(e) => set("fontHeading", e.target.value)}
                className="h-11 w-full rounded-md border border-gold/40 bg-card px-3 font-naskh text-sm"
              >
                {URDU_FONTS.filter((f) => f.available).map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.urdu}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="font-naskh">متن سائز (px)</Label>
                <Input type="number" min={14} max={30} value={s.fontBodySize} onChange={(e) => set("fontBodySize", e.target.value)} dir="ltr" className="font-latin" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">سرخی سائز (px)</Label>
                <Input type="number" min={18} max={64} value={s.fontHeadingSize} onChange={(e) => set("fontHeadingSize", e.target.value)} dir="ltr" className="font-latin" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">سطر فاصلہ (%)</Label>
                <Input type="number" min={160} max={340} step={10} value={s.fontLineHeight} onChange={(e) => set("fontLineHeight", e.target.value)} dir="ltr" className="font-latin" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">عمومی اسکیل (%)</Label>
                <Input type="number" min={85} max={150} step={2} value={s.fontScale} onChange={(e) => set("fontScale", e.target.value)} dir="ltr" className="font-latin" />
              </div>
            </div>

            <Button onClick={() => save(["fontBody", "fontHeading", "fontBodySize", "fontHeadingSize", "fontLineHeight", "fontScale"], "fonts")} disabled={saving === "fonts"} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {saving === "fonts" && <Loader2 className="h-4 w-4 animate-spin" />} فونٹ ترتیبات محفوظ کریں
            </Button>
            <p className="text-xs font-naskh leading-6 text-muted-foreground">
              لاطینی حروف اور تکنیکی لیبلز کے لیے سسٹم فونٹ (Inter) استعمال ہوتا ہے — یہ کوئی اردو فونٹ نہیں۔
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
