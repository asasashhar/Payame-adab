"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/site/logo";
import { Watermark } from "@/components/site/watermark";
import type { WatermarkConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export type DocBlock =
  | { type: "couplet"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string };

const PAGE_W = 672; // 178mm inner width @96dpi
const FULL_H = 900; // available content height on a page
const FIRST_H = 730; // first page: title header consumes space

/** Split a long paragraph into sentence groups so pages never cut mid-sentence. */
function splitParagraph(text: string): string[] {
  const sentences = text.split(/(?<=۔|\؟|!)\s*/).filter(Boolean);
  if (sentences.length <= 1) return [text];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && (buf.length + s.length > 260)) {
      out.push(buf.trim());
      buf = s + " ";
    } else {
      buf += s + " ";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function PaginatedDocument({
  title,
  authorName,
  categoryLabel,
  blocks,
  watermarkConfig,
}: {
  title: string;
  authorName?: string | null;
  categoryLabel?: string | null;
  blocks: DocBlock[];
  watermarkConfig?: Partial<WatermarkConfig> | null;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<DocBlock[][]>([[]]);
  const [ready, setReady] = useState(false);

  const flat: DocBlock[] = useMemo(() => {
    const out: DocBlock[] = [];
    for (const b of blocks) {
      if (b.type === "paragraph") {
        splitParagraph(b.text).forEach((t) => out.push({ type: "paragraph", text: t }));
      } else {
        out.push(b);
      }
    }
    return out;
  }, [blocks]);

  useEffect(() => {
    if (!measureRef.current) return;
    const measurer = measureRef.current;
    const heights = flat.map((b) => {
      const el = document.createElement("div");
      el.style.width = `${PAGE_W}px`;
      el.style.position = "absolute";
      el.style.visibility = "hidden";
      if (b.type === "couplet") {
        el.className = "whitespace-pre-line font-nastaliq";
        el.style.fontSize = "19px";
        el.style.lineHeight = "2.7";
        el.style.textAlign = "center";
        el.textContent = b.text;
      } else if (b.type === "heading") {
        el.className = "font-nastaliq-tight";
        el.style.fontSize = "22px";
        el.style.lineHeight = "2.4";
        el.textContent = b.text;
      } else {
        el.className = "font-nastaliq";
        el.style.fontSize = "17px";
        el.style.lineHeight = "2.75";
        el.style.textAlign = "justify";
        el.textContent = b.text;
      }
      el.style.marginBottom = "18px";
      measurer.appendChild(el);
      const h = el.getBoundingClientRect().height + 18;
      measurer.removeChild(el);
      return { block: b, h };
    });

    const pagesOut: DocBlock[][] = [];
    let cur: DocBlock[] = [];
    let used = 0;
    const HEADER_H = 190; // masthead height reserved on page 1
    for (const { block, h } of heights) {
      const budget = pagesOut.length === 0 ? FULL_H - HEADER_H : FULL_H;
      if (used + h > budget && cur.length > 0) {
        pagesOut.push(cur);
        cur = [block];
        used = h;
      } else {
        cur.push(block);
        used += h;
      }
    }
    if (cur.length || pagesOut.length === 0) pagesOut.push(cur);
    setPages(pagesOut);
    setReady(true);
  }, [flat]);

  return (
    <div className="screen-pdf">
      {/* toolbar */}
      <div className="no-print sticky top-0 z-10 -mx-4 mb-6 border-b border-gold/25 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="font-nastaliq-tight text-lg text-primary leading-7">PDF پیش منظر — {title}</p>
            <p className="text-xs text-muted-foreground font-naskh">
              داؤن لوڈ کے لیے «PDF محفوظ کریں» پر کلک کریں اور پرنٹ ڈائیلاگ میں «Save as PDF» منتخب کریں۔
            </p>
          </div>
          <Button onClick={() => window.print()} className="gap-2 bg-primary font-naskh">
            <Printer className="h-4 w-4" /> PDF محفوظ کریں
          </Button>
        </div>
      </div>

      {/* hidden measurer */}
      <div ref={measureRef} aria-hidden className="pointer-events-none fixed -top-[9999px] -start-[9999px]" />

      {!ready && (
        <div className="mx-auto max-w-3xl px-8 py-16 text-center font-naskh text-muted-foreground">
          صفحات ترتیب دیے جا رہے ہیں…
        </div>
      )}

      <div className="print-area">
        {pages.map((blocks, pi) => (
          <div key={pi} className="pdf-page mx-auto" data-page={pi + 1}>
            {/* official logo watermark embedded on every printed page */}
            <Watermark config={watermarkConfig} print />

            {/* first page masthead: title + logo side by side, divider below */}
            {pi === 0 && (
              <header className="relative z-10 mb-5">
                <div className="flex items-center justify-between gap-4 border-b-0 pb-3">
                  <div className="min-w-0">
                    <h1 className="font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink break-words">
                      {title}
                    </h1>
                    {(authorName || categoryLabel) && (
                      <p className="mt-1 text-sm font-naskh text-foreground/70">
                        {authorName ? `تحریر: ${authorName}` : ""}
                        {authorName && categoryLabel ? " · " : ""}
                        {categoryLabel ?? ""}
                      </p>
                    )}
                  </div>
                  <LogoMark size={84} className="shrink-0" />
                </div>
                <div className="mt-1 mb-4 h-[2px] w-full bg-gradient-to-l from-gold via-gold/70 to-gold rounded-full" />
              </header>
            )}

            {/* content */}
            <div className="relative z-10 flex-1">
              {blocks.map((b, bi) =>
                b.type === "couplet" ? (
                  <p
                    key={bi}
                    className="whitespace-pre-line text-center font-nastaliq text-[19px] leading-[2.7] text-[#1f2a24] mb-4"
                  >
                    {b.text}
                  </p>
                ) : b.type === "heading" ? (
                  <h2 key={bi} className="font-nastaliq-tight text-[22px] leading-[2.4] text-emerald-ink mb-3">
                    {b.text}
                  </h2>
                ) : (
                  <p key={bi} className="font-nastaliq text-[17px] leading-[2.75] text-[#26221b] mb-4 text-justify">
                    {b.text}
                  </p>
                )
              )}
            </div>

            {/* page footer */}
            <footer className="relative z-10 mt-auto flex items-center justify-between border-t border-gold/30 pt-2 text-[11px] text-foreground/60">
              <span className="font-naskh">پیامِ ادب | Payam-e-Adab</span>
              <span className="font-latin">صفحہ {pi + 1} / {pages.length}</span>
            </footer>
          </div>
        ))}
      </div>
    </div>
  );
}
