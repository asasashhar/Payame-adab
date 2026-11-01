"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Copy } from "lucide-react";
import { rhymeTail, tailScore } from "@/lib/qafiya";

type QafiyaEntry = {
  id: string; word: string; meaning?: string | null; pattern?: string | null; rhymes: string;
};

export default function QafiyaPage() {
  const [word, setWord] = useState("");
  const [entries, setEntries] = useState<QafiyaEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState("");

  const results = useMemo(() => {
    if (!entries || !searched) return null;
    const tail = rhymeTail(searched);
    const scored: { word: string; meaning?: string | null; score: number; group: string }[] = [];
    for (const e of entries) {
      let rhymes: string[] = [];
      try { rhymes = JSON.parse(e.rhymes); } catch {}
      const groupWords = [e.word, ...rhymes];
      for (const w of groupWords) {
        if (!w) continue;
        const s = tailScore(rhymeTail(w), tail);
        if (w !== searched && s >= 2) {
          scored.push({ word: w, meaning: e.meaning, score: s, group: e.word });
        }
      }
    }
    scored.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word, "ur"));
    const seen = new Set<string>();
    return { tail, list: scored.filter((x) => !seen.has(x.word) && seen.add(x.word)).slice(0, 36) };
  }, [entries, searched]);

  const find = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/qafiya");
      const data = await res.json();
      setEntries(data);
      setSearched(word.trim());
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
            title="قافیہ تلاش"
            subtitle="لفظ لکھیں اور مطابق قافیے حاصل کریں — تلفظ اور قافیے کے سانچے کی بنیاد پر"
          />

          <div className="manuscript-frame rounded-xl bg-card p-6">
            <form onSubmit={find} className="flex gap-3">
              <Input
                dir="rtl"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="مثلاً: دل، چمن، ہستی، امید…"
                className="h-12 font-nastaliq-tight text-xl text-right"
                aria-label="قافیے کے لیے لفظ"
              />
              <Button type="submit" disabled={loading} className="h-12 shrink-0 gap-2 bg-primary px-6 font-naskh text-[15px] hover:bg-emerald-deep">
                <Search className="h-4.5 w-4.5" /> {loading ? "تلاش…" : "قافیہ تلاش کریں"}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {["دل", "چمن", "ہستی", "شام", "پیار", "دعا", "کہانی", "بہار"].map((w) => (
                <button
                  key={w}
                  onClick={() => { setWord(w); setEntries(null); setTimeout(() => { setWord(w); }, 0); }}
                  className="rounded-full border border-gold/40 bg-secondary px-3.5 py-1 text-sm font-nastaliq-tight text-primary hover:bg-accent"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          )}

          {results && !loading && (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2 text-sm font-naskh text-muted-foreground">
                <Sparkles className="h-4 w-4 text-gold" />
                «{searched}» کا قافیہ: <Badge variant="outline" className="border-gold/50 font-nastaliq-tight text-base text-primary">{results.tail}</Badge>
                <span>({results.list.length} تجاویز)</span>
              </div>

              {results.list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
                  اس قافیے کے لیے ابھی کوئی تجویز دستیاب نہیں۔ قافیہ ذخیرہ مسلسل بڑھ رہا ہے۔
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {results.list.map((r) => (
                    <button
                      key={r.word}
                      onClick={() => navigator.clipboard.writeText(r.word).catch(() => {})}
                      className="group manuscript-frame flex items-center justify-between gap-2 rounded-xl bg-card px-4 py-3 text-start transition-shadow hover:shadow-md"
                      title="کاپی کرنے کے لیے کلک کریں"
                    >
                      <span>
                        <span className="block font-nastaliq-tight text-xl leading-8 text-emerald-ink">{r.word}</span>
                        {r.meaning && <span className="block truncate text-[11px] font-naskh text-muted-foreground">{r.meaning}</span>}
                      </span>
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!results && !loading && (
            <div className="mt-8 manuscript-frame rounded-xl bg-card p-8 text-center">
              <p className="font-nastaliq-tight text-lg leading-9 text-foreground/70">
                قافیہ اردو شاعری کی روح ہے۔ اوپر لکھیے اور اپنے کلام کے لیے مناسب قافیے دریافت کیجیے۔
              </p>
              <p className="mt-2 text-xs font-naskh text-muted-foreground">
                تجاویز حروف کی مماثلت نہیں بلکہ آخری ہجے کے تلفظ کی بنیاد پر دی جاتی ہیں۔
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
