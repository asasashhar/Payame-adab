import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSettings, THEME_PRESETS, type ThemePreset } from "@/lib/site";
import { URDU_FONTS, getFontById, FONT_FALLBACK_CHAIN } from "@/lib/fonts";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: {
      default: s.seoTitle || "پیامِ ادب — اردو ادب، روایت سے نئی نسل تک",
      template: `%s | پیامِ ادب`,
    },
    description: s.seoDescription || s.heroSubtitle,
    keywords: (s.seoKeywords || "").split(",").map((k) => k.trim()).filter(Boolean),
    openGraph: {
      title: s.seoTitle || "پیامِ ادب",
      description: s.seoDescription || "",
      images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: s.seoTitle || "پیامِ ادب",
      description: s.seoDescription || "",
      images: ["/brand/og-image.jpg"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Which approved font files actually exist on disk right now. */
function installedFontFiles(): Set<string> {
  const installed = new Set<string>();
  for (const f of URDU_FONTS) {
    try {
      const p = path.join(process.cwd(), "public", f.file);
      if (fs.existsSync(p) && fs.statSync(p).size > 10000) installed.add(f.id);
    } catch { /* ignore */ }
  }
  return installed;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings();
  const installed = installedFontFiles();

  // ---- font faces: only approved fonts with real files (plus Google-hosted Noto) ----
  const fontFaces = URDU_FONTS.filter((f) => installed.has(f.id))
    .map((f) => {
      const fmt = f.format === "woff2" ? "woff2" : "truetype";
      const familyAlias = `PFA-${f.id}`;
      return `@font-face{font-family:"${familyAlias}";src:url("${f.file}") format("${fmt}");font-weight:400 700;font-display:swap;}`;
    })
    .join("\n");

  // selected fonts must be approved AND installed, else fall back cleanly
  const bodyFont = getFontById(s.fontBody ?? "");
  const headingFont = getFontById(s.fontHeading ?? "");
  const bodyStack = bodyFont && installed.has(bodyFont.id)
    ? `"PFA-${bodyFont.id}", ${FONT_FALLBACK_CHAIN}`
    : FONT_FALLBACK_CHAIN;
  const headingStack = headingFont && installed.has(headingFont.id)
    ? `"PFA-${headingFont.id}", ${FONT_FALLBACK_CHAIN}`
    : FONT_FALLBACK_CHAIN;

  const bodySize = Math.min(30, Math.max(14, Number(s.fontBodySize ?? 17) || 17));
  const headingSize = Math.min(64, Math.max(18, Number(s.fontHeadingSize ?? 30) || 30));
  const lineHeight = Math.min(340, Math.max(160, Number(s.fontLineHeight ?? 230) || 230)) / 100;
  // admin-controlled global typography scale (percent, default 112 → noticeably larger)
  const fontScale = Math.min(150, Math.max(85, Number(s.fontScale ?? 112) || 112)) / 100;

  // ---- theme preset ----
  const preset = (s.themePreset ?? "emerald") as ThemePreset;
  const themeVars: Record<string, string> = {
    ...(THEME_PRESETS[preset] ?? THEME_PRESETS.emerald).vars,
  };
  // admin custom color overrides (non-empty values win over the preset)
  const hex = (v: string | undefined) =>
    v && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : "";
  const cPrimary = hex(s.colorPrimary);
  const cGold = hex(s.colorGold);
  const cBg = hex(s.colorBackground);
  const cFg = hex(s.colorForeground);
  if (cPrimary) Object.assign(themeVars, { "--primary": cPrimary, "--emerald-deep": cPrimary, "--sidebar": cPrimary, "--sidebar-accent": cPrimary, "--sidebar-border": cPrimary });
  if (cGold) Object.assign(themeVars, { "--gold": cGold, "--gold-soft": cGold });
  if (cBg) themeVars["--background"] = cBg;
  if (cFg) themeVars["--foreground"] = cFg;
  const themeCss = Object.entries(themeVars).map(([k, v]) => `${k}:${v};`).join("");

  const cssVars = `:root:root{--font-urdu-body:${bodyStack};--font-urdu-heading:${headingStack};--font-urdu-body-size:${(bodySize * fontScale).toFixed(1)}px;--font-urdu-heading-size:${(headingSize * fontScale).toFixed(1)}px;--font-urdu-line-height:${lineHeight};--font-scale:${fontScale};${themeCss}}`;

  return (
    <html lang="ur" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style
          id="pea-fonts-theme"
           
          dangerouslySetInnerHTML={{ __html: fontFaces + "\n" + cssVars }}
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
