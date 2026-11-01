"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info, Eraser } from "lucide-react";

type TaqtiResponse = {
  lines: {
    line: string;
    pattern: string;
    words: { word: string; scan: { text: string; long: boolean }[] }[];
    match: {
      behr: string; nameEn: string; arkan: string;
      confidence: "exact" | "probable" | "none";
      segments: { name: string; pattern: string }[];
    } | null;
  }[];
  verdict: string;
  sameMeter: boolean | null;
  detectedBehr: string | null;
  confidence: "exact" | "probable" | "none";
};

const SAMPLES = [
  { label: "غالب", text: "دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے" },
  { label: "اقبال", text: "کبھی اے حقیقتِ منتظر نظر آ لبِ صبا\nشجر سے پھول کھلے کھلے کتابوں سے نقاب اٹھے" },
  { label: "میر", text: "دکھائی دیے یوں کہ بے خود کیا\nہمیں آپ سے بھی جدا کر چلے" },
];

const LONG_MARK = "ـــ";
const SHORT_MARK = "ᴗ";

export default function TaqtiPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TaqtiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/taqti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <SectionHeading
            title="تقطیع و بحر کی جانچ"
            subtitle="اردو عروض کی بنیاد پر ہجائے کوتاہ و بلند، ارکان اور بحر کی نشاندہی"
          />

          <div className="manuscript-frame rounded-xl bg-card p-6">
            <Textarea
              dir="rtl"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="یہاں اپنا شعر یا مصرع لکھیں — ایک مصرع، ایک شعر یا کئی اشعار…"
              rows={5}
              className="resize-y font-nastaliq text-xl leading-[2.6] text-right"
              aria-label="شعر درج کریں"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={analyze} disabled={loading || !text.trim()} className="gap-2 bg-primary font-naskh text-[15px] hover:bg-emerald-deep">
                <FlaskConical className="h-4.5 w-4.5" /> {loading ? "تقطیع جاری…" : "تقطیع کریں"}
              </Button>
              <Button variant="outline" onClick={() => { setText(""); setResult(null); }} className="gap-2 border-gold/40 font-naskh">
                <Eraser className="h-4 w-4" /> صاف کریں
              </Button>
              <div className="ms-auto flex flex-wrap items-center gap-2 text-xs font-naskh text-muted-foreground">
                نمونے:
                {SAMPLES.map((s) => (
                  <button key={s.label} onClick={() => setText(s.text)} className="rounded-full border border-gold/40 bg-secondary px-3 py-1 text-primary hover:bg-accent">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          )}

          {result && !loading && (
            <div className="mt-8 space-y-5">
              {/* verdict */}
              <div className={`rounded-xl border p-5 ${result.confidence === "exact" ? "border-emerald-deep/40 bg-[#eef6f0]" : result.confidence === "probable" ? "border-gold/50 bg-[#fbf5e2]" : "border-border bg-card"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className={result.confidence === "exact" ? "bg-emerald-deep font-naskh" : result.confidence === "probable" ? "bg-gold font-naskh" : "bg-muted font-naskh text-muted-foreground"}>
                    {result.confidence === "exact" ? "یقینی مطابقت" : result.confidence === "probable" ? "غالباً" : "بحر نامعلوم"}
                  </Badge>
                  {result.detectedBehr && (
                    <span className="font-nastaliq-tight text-xl leading-8 text-emerald-ink">{result.detectedBehr}</span>
                  )}
                </div>
                <p className="font-naskh text-[15px] leading-8 text-foreground/85">{result.verdict}</p>
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-6 text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                  یہ تجزیہ قواعد و ضوابط اور معروف اوزان کے سانچوں پر مبنی ہے۔ بعض الفاظ کی ادائیگی میں اختلاف نتیجہ بدل سکتا ہے۔
                </p>
              </div>

              {/* per-line analysis */}
              {result.lines.map((l, i) => (
                <div key={i} className="manuscript-frame rounded-xl bg-card p-5">
                  <p className="text-center font-nastaliq text-2xl leading-[2.6] text-emerald-ink">{l.line}</p>

                  <div className="mt-4 overflow-x-auto nice-scroll">
                    <table className="w-full min-w-[480px] border-collapse text-center">
                      <tbody>
                        {l.words.map((w, wi) => (
                          <tr key={wi} className="border-b border-gold/15 last:border-0">
                            <td className="px-2 py-2 font-nastaliq text-lg text-foreground whitespace-nowrap">{w.word}</td>
                            <td className="px-2 py-2">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {w.scan.map((s, si) => (
                                  <span
                                    key={si}
                                    title={s.long ? "ہجائے بلند" : "ہجائے کوتاہ"}
                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 font-latin text-sm font-bold ${s.long ? "bg-emerald-deep/10 text-emerald-deep" : "bg-gold/15 text-[#8a6d1a]"}`}
                                  >
                                    {s.long ? LONG_MARK : SHORT_MARK}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold/20 pt-3">
                    <span className="text-xs font-naskh text-muted-foreground">سانچہ:</span>
                    <code className="rounded bg-secondary px-2 py-1 font-latin text-sm tracking-[0.2em]" dir="ltr">
                      {l.pattern.replace(/L/g, "—").replace(/S/g, "ᴗ")}
                    </code>
                    {l.match?.segments && l.match.segments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {l.match.segments.map((s, si) => (
                          <span key={si} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-nastaliq-tight text-primary">
                            {s.name}
                            <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">{s.pattern.replace(/L/g, "—").replace(/S/g, "ᴗ")}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* legend */}
              <div className="rounded-xl bg-secondary/60 p-4 text-xs font-naskh text-muted-foreground">
                <span className="me-3">علامات:</span>
                <span className="me-4 font-latin">{LONG_MARK} = ہجائے بلند (لمبا ہجہ)</span>
                <span className="font-latin">{SHORT_MARK} = ہجائے کوتاہ (چھوٹا ہجہ)</span>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
