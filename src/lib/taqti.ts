/**
 * Urdu Taqti (تقطیع) & Behr (بحر) Analysis Engine
 * Rule-based scansion engine implementing Urdu prosody (عروض) conventions:
 *  - Huroof-e-maddah & long/short vowels
 *  - Aspirated digraphs (بھ پھ تھ ٹھ جھ چھ دھ ڈھ کھ گھ ڑھ) as single consonants
 *  - Izafat (ِ) splitting the final syllable into two short syllables
 *  - Nasal closure (ں), hamza glides, silent final ہ
 *  - Classical convention: ہے ہیں کے کی کو نے سے میں بھی scan short
 *  - Arkan pattern matching against the recognized behr database
 * The engine is heuristic and reports confidence honestly.
 */

export type Syl = { text: string; long: boolean };
export type LineScan = { word: string; syllables: Syl[] }[];

// ---------- normalization ----------
const IZAFAT = "\u0650";
const DIACRITICS = /[\u064B-\u064F\u0651\u0652-\u0655\u0670\u06D6-\u06ED\u0640]/g;

export function normalizeUrdu(text: string): string {
  return text
    .replace(DIACRITICS, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ﮮﯭ]/g, "ی")
    .replace(/ة/g, "ہ")
    .replace(/[”"«»]/g, "")
    .trim();
}

// ---------- special word dictionary (common poetic function words) ----------
const SPECIAL: Record<string, string> = {
  "ہے": "S", "ہیں": "S", "ہوں": "S", "کہ": "S", "یہ": "S", "وہ": "S",
  "بہ": "S", "میں": "S", "بھی": "S", "کی": "S", "نہیں": "SL", "نہ": "S",
  "کیا": "L", "کیوں": "L", "کیسے": "SLL", "ہوا": "SL", "تھی": "S",
  "جیسے": "SSL", "کیونکہ": "LLSS", "گئی": "LL", "دیا": "SL", "لیا": "SL",
  "ہوئی": "SL", "ہوئے": "SL", "گئے": "LL", "رہی": "SL", "کہاں": "SL",
  "یہاں": "SL", "وہاں": "SL", "بہت": "SL", "تھا": "L", "چاہیے": "SSLL",
  "زندگی": "SLSL", "محبت": "SLSS", "دنیا": "SL", "کہانی": "SLSL",
  "مگر": "SL", "لیکن": "SSL", "بلکہ": "SSL", "گویا": "SSL", "ایسا": "SLL",
  "جہاں": "SL", "جب": "L", "تب": "L",
};

const ASPIRATED = new Set(["ب", "پ", "ت", "ٹ", "ج", "چ", "د", "ڈ", "ک", "گ", "ڑ"]);
const VOWELS = new Set(["ا", "آ", "و", "ی", "ے"]);
const CONSONANTS = new Set(
  "بپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمنوںہھهءئ".split("")
);

type Unit =
  | { k: "c"; c: string }            // bare consonant (pending closure)
  | { k: "cv"; c: string; long: boolean; txt: string } // consonant + vowel
  | { k: "v"; long: boolean; txt: string };             // standalone vowel

function tokenizeWord(w: string): Unit[] | null {
  const chars = [...w];
  const units: Unit[] = [];
  let i = 0;
  const at = (n: number) => chars[i + n] ?? "";

  while (i < chars.length) {
    const ch = chars[i];
    // aspirated digraph: consonant + ھ (do-chashmi he)
    if (ASPIRATED.has(ch) && at(1) === "ھ") {
      units.push({ k: "c", c: ch + "ھ" });
      i += 2;
      continue;
    }
    if (CONSONANTS.has(ch)) {
      // consonant + vowel letter
      const n1 = at(1);
      // special glide: C + ی + ا/آ  (کیا، لیا، جیا) = one long syllable
      if (ch !== "ی" && n1 === "ی" && (at(2) === "ا" || at(2) === "آ")) {
        units.push({ k: "cv", c: ch + "ی", long: true, txt: ch + n1 + at(2) });
        i += 3;
        continue;
      }
      if (n1 === "آ" || (n1 === "ا" && ch !== "و")) {
        units.push({ k: "cv", c: ch, long: true, txt: ch + n1 });
        i += 2;
        continue;
      }
      if (n1 === "ا" && ch === "و") {
        // خواب: و = glide w + ā
        units.push({ k: "cv", c: ch + "و", long: true, txt: ch + n1 });
        i += 2;
        continue;
      }
      if (n1 === "و") {
        const n2 = at(2);
        if (n2 === "ا" || n2 === "آ") {
          // ہوا pattern: C short open + wā long
          units.push({ k: "c", c: ch });
          units.push({ k: "cv", c: "و", long: true, txt: "و" + n2 });
          i += 3;
          continue;
        }
        if (n2 === "") {
          // تو، لو، ہو: final و = long ū
          units.push({ k: "cv", c: ch, long: true, txt: ch + "و" });
          i += 2;
          continue;
        }
        // خدا: و = short u attached to consonant
        units.push({ k: "cv", c: ch, long: false, txt: ch + "و" });
        i += 2;
        continue;
      }
      if (n1 === "ی") {
        const n2 = at(2);
        if (n2 === "ا" || n2 === "آ") {
          units.push({ k: "c", c: ch });
          units.push({ k: "cv", c: "ی", long: true, txt: "ی" + n2 });
          i += 3;
          continue;
        }
        if (n2 === "") {
          // کی؟ handled by dict; default final ی = long ī
          units.push({ k: "cv", c: ch, long: true, txt: ch + "ی" });
          i += 2;
          continue;
        }
        // میری: ی = short i
        units.push({ k: "cv", c: ch, long: false, txt: ch + "ی" });
        i += 2;
        continue;
      }
      if (n1 === "ے") {
        // کے، گے: final ے = short e
        units.push({ k: "cv", c: ch, long: false, txt: ch + "ے" });
        i += 2;
        continue;
      }
      if (n1 === "ں" || n1 === "ء" || n1 === "ئ") {
        if (n1 === "ں") {
          // میں-type: closed long
          units.push({ k: "cv", c: ch, long: true, txt: ch + "یں" });
          i += 2;
          continue;
        }
        units.push({ k: "c", c: ch });
        units.push({ k: "c", c: n1 });
        i += 2;
        continue;
      }
      if (n1 === "ہ" || n1 === "ه" || n1 === "ھ") {
        const n2 = at(2);
        if (n2 === "ا" || n2 === "آ" || n2 === "و" || n2 === "ی") {
          // کہا، شہید، بہو: ہ opens new syllable
          units.push({ k: "c", c: ch });
          units.push({ k: "c", c: "ہ" });
          i += 2;
          continue;
        }
        if (n2 === "") {
          // بہت، جگہ: ہ closes the syllable
          units.push({ k: "c", c: ch });
          units.push({ k: "c", c: "ہ" });
          i += 2;
          continue;
        }
        units.push({ k: "c", c: ch });
        units.push({ k: "c", c: "ہ" });
        i += 2;
        continue;
      }
      units.push({ k: "c", c: ch });
      i += 1;
      continue;
    }
    if (ch === "آ") {
      units.push({ k: "v", long: true, txt: "آ" });
      i += 1;
      continue;
    }
    if (ch === "ا") {
      // word-initial ا = short a (اگر، اثر)
      units.push({ k: "v", long: false, txt: "ا" });
      i += 1;
      continue;
    }
    if (ch === "و") {
      const n1 = at(1);
      // جاؤں: و after vowel + ں → long closed
      units.push({ k: "cv", c: "و", long: n1 === "" || n1 === "ں", txt: "و" });
      i += 1;
      continue;
    }
    if (ch === "ی") {
      const n1 = at(1);
      units.push({ k: "cv", c: "ی", long: n1 === "" || n1 === "ں", txt: "ی" });
      i += 1;
      continue;
    }
    if (ch === "ے") {
      units.push({ k: "v", long: false, txt: "ے" });
      i += 1;
      continue;
    }
    if (ch === "ء" || ch === "ئ") {
      units.push({ k: "c", c: ch });
      i += 1;
      continue;
    }
    if (ch === "ں") {
      // closes previous syllable – marker only
      i += 1;
      continue;
    }
    if (ch === "ہ" || ch === "ه") {
      // gol he: closes previous syllable (جگہ، گاہ)
      units.push({ k: "c", c: "ہ" });
      i += 1;
      continue;
    }
    i += 1; // skip unknown
  }
  return units;
}

/** Scan a single word into syllables. */
export function scanWord(raw: string): Syl[] {
  let w = raw.replace(/[،؟!۔,."':;]/g, "").trim();
  if (!w) return [];

  // strip silent final ہ in words like خدا؟ (خدا ends with ا) – keep ہ generally
  const izafat = w.includes(IZAFAT);
  w = w.replace(new RegExp(IZAFAT, "g"), "");
  if (!w) return [{ text: raw, long: false }];

  const s = SPECIAL[w];
  if (s && !izafat) {
    return s.split("").map((p, idx) => ({
      text: raw,
      long: p === "L",
    })).map((x, idx, arr) => ({ ...x, text: raw }));
  }

  const units = tokenizeWord(w);
  if (!units || units.length === 0) return [];

  const syls: Syl[] = [];
  let pending: { c: string } | null = null;

  const flushShort = () => {
    if (pending) {
      syls.push({ text: pending.c, long: false });
      pending = null;
    }
  };

  for (let idx = 0; idx < units.length; idx++) {
    const u = units[idx];
    if (u.k === "cv") {
      flushShort();
      syls.push({ text: u.txt, long: u.long });
    } else if (u.k === "v") {
      flushShort();
      syls.push({ text: u.txt, long: u.long });
    } else {
      // bare consonant
      const next = units[idx + 1];
      if (!next) {
        // word-final consonant closes the pending syllable → LONG
        if (pending) {
          syls.push({ text: pending.c + u.c, long: true });
          pending = null;
        } else {
          syls.push({ text: u.c, long: true });
        }
      } else {
        // not final: this consonant carries inherent short vowel
        flushShort();
        pending = { c: u.c };
      }
    }
  }
  flushShort();

  // izafat: splits the last closed syllable into two short ones
  // (دلِ = di-le : L → S S ; غزلِ = gha-za-le : SL → SSS)
  if (izafat && syls.length > 0) {
    const last = syls[syls.length - 1];
    if (last.long) {
      syls[syls.length - 1] = { text: last.text, long: false };
      syls.push({ text: "ِ" + last.text, long: false });
    } else {
      syls.push({ text: "ِ", long: false });
    }
  }
  return syls;
}

/** Scan one misra (line) into word-wise syllables and a flat S/L pattern. */
export function scanLine(line: string): { words: LineScan; pattern: string } {
  const clean = normalizeUrdu(line);
  const words = clean.split(/\s+/).filter(Boolean);
  const scan: LineScan = [];
  let pattern = "";
  for (const w of words) {
    const syls = scanWord(w);
    scan.push({ word: w, syllables: syls });
    pattern += syls.map((s) => (s.long ? "L" : "S")).join("");
  }
  return { words: scan, pattern };
}

// ---------- arkan & behr database ----------
export const ARKAN_PATTERNS: Record<string, string> = {
  "مفاعیلن": "SLLL",
  "فاعلاتن": "LSLL",
  "مستفعلن": "LLSL",
  "فعولن": "SLL",
  "مفاعلتن": "SLSL",
  "مفعولات": "LLLS",
  "فاعلن": "LSL",
  "متفاعلن": "SSLL",
  "مفعولن": "LLL",
  "فعْلن": "LL",
  "فعلن": "SSL",
};

export type BehrDef = {
  name: string;
  nameEn: string;
  arkan: string; // display string
  rukns: string[]; // arkan names in order
  variations?: string[][]; // alternative rukn lists
};

export const BEHRS: BehrDef[] = [
  {
    name: "بحرِ ہزج مسدس محذوف", nameEn: "Hazaj Musaddas Mahzuf",
    arkan: "مفاعیلن مفاعیلن مفاعیلن (آخر میں محذوف)",
    rukns: ["مفاعیلن", "مفاعیلن", "مفاعیلن"],
    variations: [["مفاعیلن", "مفاعیلن", "فعْلن"]],
  },
  {
    name: "بحرِ ہزج مثمن سالم", nameEn: "Hazaj Musamman Salim",
    arkan: "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
    rukns: ["مفاعیلن", "مفاعیلن", "مفاعیلن", "مفاعیلن"],
  },
  {
    name: "بحرِ رمل مسدس محذوف", nameEn: "Ramal Musaddas Mahzuf",
    arkan: "فاعلاتن فاعلاتن فاعلن",
    rukns: ["فاعلاتن", "فاعلاتن", "فاعلن"],
  },
  {
    name: "بحرِ رمل مثمن سالم", nameEn: "Ramal Musamman Salim",
    arkan: "فاعلاتن فاعلاتن فاعلاتن فاعلاتن",
    rukns: ["فاعلاتن", "فاعلاتن", "فاعلاتن", "فاعلاتن"],
  },
  {
    name: "بحرِ متقارب مثمن محذوف", nameEn: "Mutaqarib Musamman Mahzuf",
    arkan: "فعولن فعولن فعولن فعْلن",
    rukns: ["فعولن", "فعولن", "فعولن", "فعْلن"],
  },
  {
    name: "بحرِ متقارب مثمن سالم", nameEn: "Mutaqarib Musamman Salim",
    arkan: "فعولن فعولن فعولن فعولن",
    rukns: ["فعولن", "فعولن", "فعولن", "فعولن"],
  },
  {
    name: "بحرِ متدارک مثمن محذوف", nameEn: "Mutaqarib-e-Khafif (Mutadarik)",
    arkan: "فعولن فعولن فعولن فعْلن (فعلن کی اجازت)",
    rukns: ["فعولن", "فعولن", "فعولن", "فعْلن"],
    variations: [
      ["فعولن", "فعولن", "فعلن", "فعْلن"],
      ["فعلن", "فعلن", "فعولن", "فعْلن"],
      ["فعولن", "فعلن", "فعولن", "فعْلن"],
      ["فعولن", "فعولن", "فعولن", "فعلن"],
    ],
  },
  {
    name: "بحرِ مجتث مسدس محذوف", nameEn: "Mujtass Musaddas Mahzuf",
    arkan: "مستفعلن فاعلاتن مستفعلن فعْلن",
    rukns: ["مستفعلن", "فاعلاتن", "مستفعلن", "فعْلن"],
  },
  {
    name: "بحرِ مجتث مسدس اخرب", nameEn: "Mujtass Musaddas Akhrab",
    arkan: "مستفعلن فاعلاتن مستفعلن فاعلن",
    rukns: ["مستفعلن", "فاعلاتن", "مستفعلن", "فاعلن"],
  },
  {
    name: "بحرِ سریع مسدس محذوف", nameEn: "Sarie Musaddas Mahzuf",
    arkan: "مستفعلن مستفعلن مستفعلن فعْلن",
    rukns: ["مستفعلن", "مستفعلن", "مستفعلن", "فعْلن"],
  },
  {
    name: "بحرِ سریع مسدس اخرب", nameEn: "Sarie Musaddas Akhrab",
    arkan: "مستفعلن فاعلن مستفعلن فاعلن",
    rukns: ["مستفعلن", "فاعلن", "مستفعلن", "فاعلن"],
  },
  {
    name: "بحرِ خفیف مسدس محذوف", nameEn: "Khafif Musaddas Mahzuf",
    arkan: "فاعلاتن مستفعلن فاعلن",
    rukns: ["فاعلاتن", "مستفعلن", "فاعلن"],
  },
  {
    name: "بحرِ خفیف مثمن اخرب", nameEn: "Khafif Musamman Akhrab",
    arkan: "فاعلاتن مستفعلن فاعلاتن مستفعلن",
    rukns: ["فاعلاتن", "مستفعلن", "فاعلاتن", "مستفعلن"],
  },
  {
    name: "بحرِ مضارع مثمن مخبون محذوف", nameEn: "Muzari Musamman Makhubun Mahzuf",
    arkan: "مفاعیلن فاعلاتن مفاعیلن فاعلن",
    rukns: ["مفاعیلن", "فاعلاتن", "مفاعیلن", "فاعلن"],
  },
  {
    name: "بحرِ مضارع مثمن سالم", nameEn: "Muzari Musamman Salim",
    arkan: "مفاعیلن فاعلاتن مفاعیلن فاعلاتن",
    rukns: ["مفاعیلن", "فاعلاتن", "مفاعیلن", "فاعلاتن"],
  },
  {
    name: "بحرِ منسرح مسدس محذوف", nameEn: "Munsarih Musaddas Mahzuf",
    arkan: "مستفعلن مفعولات مستفعلن فعْلن",
    rukns: ["مستفعلن", "مفعولات", "مستفعلن", "فعْلن"],
    variations: [["مستفعلن", "مفعولن", "مستفعلن", "فعْلن"]],
  },
  {
    name: "بحرِ کامل مثمن سالم", nameEn: "Kamil Musamman Salim",
    arkan: "متفاعلن متفاعلن متفاعلن متفاعلن",
    rukns: ["متفاعلن", "متفاعلن", "متفاعلن", "متفاعلن"],
    variations: [
      ["متفاعلن", "متفاعلن", "متفاعلن", "مفعولن"],
      ["متفاعلن", "متفاعلن", "متفاعلن", "فعْلن"],
    ],
  },
  {
    name: "بحرِ طویل مثمن محذوف", nameEn: "Tavil Musamman Mahzuf",
    arkan: "فعولن مفاعیلن فعولن مفاعیلن فعولن مفاعیلن فعولن فعْلن",
    rukns: ["فعولن", "مفاعیلن", "فعولن", "مفاعیلن", "فعولن", "مفاعیلن", "فعولن", "فعْلن"],
  },
  {
    name: "بحرِ قریب مثمن محذوف", nameEn: "Qarib Musamman Mahzuf",
    arkan: "فعولن مفاعیلن فعولن فعولن فعولن مفاعیلن فعولن فعولن",
    rukns: ["فعولن", "مفاعیلن", "فعولن", "فعولن", "فعولن", "مفاعیلن", "فعولن", "فعولن"],
  },
  {
    name: "بحرِ مديد مثمن مخبون محذوف", nameEn: "Madid Musamman Makhubun Mahzuf",
    arkan: "فاعلاتن فاعلن فاعلاتن فاعلاتن فاعلن فاعلن",
    rukns: ["فاعلاتن", "فاعلن", "فاعلاتن", "فاعلاتن", "فاعلن", "فاعلاتن"],
    variations: [["فاعلاتن", "فاعلن", "فاعلاتن", "فاعلاتن", "فاعلن", "فاعلن"]],
  },
];

export function behrLinePatterns(rukns: string[]): string {
  return rukns.map((r) => ARKAN_PATTERNS[r] ?? "").join("");
}

export function allBehrForms(extra?: { name: string; pattern: string }[]) {
  const forms: { behr: BehrDef; pattern: string }[] = [];
  for (const b of BEHRS) {
    forms.push({ behr: b, pattern: behrLinePatterns(b.rukns) });
    for (const v of b.variations ?? []) {
      forms.push({ behr: b, pattern: behrLinePatterns(v) });
    }
  }
  for (const e of extra ?? []) {
    if (e.pattern) {
      forms.push({
        behr: {
          name: e.name, nameEn: "", arkan: e.pattern, rukns: [],
          variations: [],
        },
        pattern: e.pattern.replace(/[^SL]/g, ""),
      });
    }
  }
  return forms;
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/** Segment a flat pattern by the rukn sequence of a behr. */
export function segmentRukns(pattern: string, rukns: string[]) {
  const segs: { name: string; pattern: string }[] = [];
  let i = 0;
  for (const r of rukns) {
    const p = ARKAN_PATTERNS[r] ?? "";
    if (!p) break;
    // allow trailing-consonant truncation on last rukn
    if (i + p.length <= pattern.length) {
      segs.push({ name: r, pattern: pattern.slice(i, i + p.length) });
      i += p.length;
    } else {
      const rest = pattern.slice(i);
      if (rest) segs.push({ name: r + " (محذوف)", pattern: rest });
      i = pattern.length;
      break;
    }
  }
  if (i < pattern.length) segs.push({ name: "زاائد", pattern: pattern.slice(i) });
  return segs;
}

export type LineResult = {
  line: string;
  pattern: string;
  words: { word: string; scan: { text: string; long: boolean }[] }[];
  match: {
    behr: string;
    nameEn: string;
    arkan: string;
    confidence: "exact" | "probable" | "none";
    distance: number;
    segments: { name: string; pattern: string }[];
  } | null;
};

export type TaqtiResult = {
  lines: LineResult[];
  verdict: string;
  sameMeter: boolean | null;
  detectedBehr: string | null;
  confidence: "exact" | "probable" | "none";
};

export function analyzeTaqti(
  text: string,
  extraBehrs?: { name: string; pattern: string }[]
): TaqtiResult {
  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const forms = allBehrForms(extraBehrs);
  const lines: LineResult[] = rawLines.map((line) => {
    const { words, pattern } = scanLine(line);
    let best: { behr: BehrDef | null; dist: number; form: string } | null = null;
    for (const f of forms) {
      const d = editDistance(pattern, f.pattern);
      if (!best || d < best.dist) best = { behr: f.behr, dist: d, form: f.pattern };
    }
    let match: LineResult["match"] = null;
    if (best && best.behr) {
      const lenDiff = Math.abs(pattern.length - best.form.length);
      let confidence: "exact" | "probable" | "none" = "none";
      if (best.dist === 0) confidence = "exact";
      else if (best.dist <= 2 && lenDiff <= 2) confidence = "probable";
      match = {
        behr: best.behr.name,
        nameEn: best.behr.nameEn,
        arkan: best.behr.arkan,
        confidence,
        distance: best.dist,
        segments:
          confidence !== "none"
            ? segmentRukns(pattern, best.behr.rukns)
            : [],
      };
    }
    return {
      line,
      pattern,
      words: words.map((w) => ({ word: w.word, scan: w.syllables })),
      match,
    };
  });

  const named = lines.map((l) => l.match?.behr ?? "").filter(Boolean);
  const exact = lines.filter((l) => l.match?.confidence === "exact");
  const probable = lines.filter((l) => l.match?.confidence === "probable");

  let detected: string | null = null;
  let confidence: "exact" | "probable" | "none" = "none";
  if (exact.length === lines.length && lines.length > 0) {
    detected = exact[0].match!.behr;
    confidence = "exact";
  } else if (exact.length + probable.length >= Math.max(1, lines.length - 1)) {
    detected = (exact[0] ?? probable[0]).match!.behr;
    confidence = exact.length > 0 ? "exact" : "probable";
  } else if (probable.length > 0) {
    detected = probable[0].match!.behr;
    confidence = "probable";
  }

  const meters = new Set(named);
  const sameMeter = named.length === lines.length ? meters.size === 1 : null;

  let verdict: string;
  if (confidence === "exact") {
    verdict = `دونوں/تمام مصرعوں کی تقطیع کے مطابق یہ شعر غالباً «${detected}» میں ہے۔`;
  } else if (confidence === "probable") {
    verdict = `تقطیع کے نتائج پر غور کرتے ہوئے یہ «${detected}» کے قریب ترین معلوم ہوتا ہے، مگر یقینی تعین ممکن نہیں۔ ہجے کی ادائیگی میں فرق نتیجے کو بدل سکتا ہے۔`;
  } else {
    verdict = "اس مصرعے کی بحر کی نشاندہی یقینی طور پر ممکن نہیں۔ نیچے ہجائے کوتاہ و بلند کی تفصیل دیکھیے۔";
  }
  if (lines.length > 1 && sameMeter === false) {
    verdict += " نوٹ: دونوں مصرعوں کے سانچے مختلف معلوم ہوتے ہیں۔";
  }

  return { lines, verdict, sameMeter, detectedBehr: detected, confidence };
}
