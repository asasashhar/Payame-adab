/**
 * The 10 approved Urdu fonts for Payam-e-Adab — the ONLY Urdu font families
 * allowed anywhere on the website. No other Urdu font may be added.
 *
 * `available` reflects whether a verified font file exists at the expected
 * path (public/fonts/...). Missing assets are surfaced honestly in the admin
 * Typography panel with instructions instead of being silently substituted.
 */
export type ApprovedFont = {
  id: string;
  name: string;
  urdu: string;
  file: string;
  format: "ttf" | "woff2";
  available: boolean;
  note?: string;
};

export const URDU_FONTS: ApprovedFont[] = [
  {
    id: "jameel-noori-nastaleeq", name: "Jameel Noori Nastaleeq", urdu: "جیمیل نوری نستعلیق",
    file: "/fonts/JameelNooriNastaleeq.ttf", format: "ttf", available: true,
    note: "مرکزی روایتی نستعلیق — تجویز کردہ ڈیفالٹ",
  },
  {
    id: "faiz-lahori-nastaleeq", name: "Faiz Lahori Nastaleeq", urdu: "فیض لاہوری نستعلیق",
    file: "/fonts/FaizLahoriNastaleeq.ttf", format: "ttf", available: true,
  },
  {
    id: "alvi-nastaleeq", name: "Alvi Nastaleeq Regular", urdu: "علوی نستعلیق",
    file: "/fonts/AlviNastaleeq.ttf", format: "ttf", available: true,
  },
  {
    id: "jameel-noori-kasheeda", name: "Jameel Noori Nastaleeq Kasheeda", urdu: "جیمیل نوری نستعلیق کشیدہ",
    file: "/fonts/JameelNooriNastaleeqKasheeda.ttf", format: "ttf", available: true,
    note: "فنکارانہ سرخیوں کے لیے",
  },
  {
    id: "noto-nastaliq-urdu", name: "Noto Nastaliq Urdu", urdu: "نوٹو نستعلیق اردو",
    file: "/fonts/NotoNastaliqUrdu.ttf", format: "ttf", available: true,
    note: "یونی کوڈ مطابق — جدید براؤزرز اور موبائل کے لیے موزوں",
  },
  {
    id: "alqalam-taj-nastaleeq", name: "AlQalam Taj Nastaleeq Regular", urdu: "القلم تاج نستعلیق",
    file: "/fonts/AlQalamTajNastaleeq.woff2", format: "woff2", available: true,
  },
  {
    id: "aa-sameer-sagar-nastaleeq", name: "AA Sameer Sagar Nastaleeq", urdu: "ای اے سمیر ساگر نستعلیق",
    file: "/fonts/AASameerSagarNastaleeq.ttf", format: "ttf", available: false,
    note: "فائل دستیاب نہیں — لائسنس شدہ TTF فائل public/fonts/AASameerSagarNastaleeq.ttf پر فراہم کریں",
  },
  {
    id: "alqalam-alvi-nastaleeq", name: "AlQalam Alvi Nastaleeq", urdu: "القلم علوی نستعلیق",
    file: "/fonts/AlQalamAlviNastaleeq.ttf", format: "ttf", available: false,
    note: "فائل دستیاب نہیں — لائسنس شدہ TTF فائل public/fonts/AlQalamAlviNastaleeq.ttf پر فراہم کریں",
  },
  {
    id: "mehr-nastaliq-web", name: "Mehr Nastaliq Web", urdu: "مہر نستعلیق ویب",
    file: "/fonts/MehrNastaliqWeb.ttf", format: "ttf", available: true,
    note: "ویب کے لیے بہترین — ہلکی فائل (130 KB)",
  },
  {
    id: "nafees-web-naskh", name: "PDMS Nafees Web Naskh", urdu: "نفیس ویب نسخ",
    file: "/fonts/NafeesWebNaskh.ttf", format: "ttf", available: true,
    note: "CRULP نفیس نسخ — یونی کوڈ مطابق",
  },
];

export const FONT_FALLBACK_CHAIN =
  '"Noto Nastaliq Urdu", "Nafees Web Naskh", "Mehr Nastaliq Web", serif';

export function getFontById(id: string): ApprovedFont | undefined {
  return URDU_FONTS.find((f) => f.id === id);
}

export function isApprovedFontId(id: string): boolean {
  return URDU_FONTS.some((f) => f.id === id);
}
