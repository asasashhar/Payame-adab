/**
 * Qafiya (قافیہ) engine — rhyme-tail extraction & suggestion.
 * Urdu qafiya is judged by the phonetic tail (aakhri haji) of the word,
 * not merely spelling. We normalize common orthographic variants
 * (ہ/ا/ی endings, silent letters) and compare tails.
 */

const TAIL_VARIANTS: Record<string, string> = {
  "ہ": "ہ", "ه": "ہ", "ۃ": "ہ",
  "ي": "ی", "ى": "ی",
  "ٰ": "",
  "ٔ": "",
};

export function normalizeTail(w: string): string {
  let s = [...w.trim()].filter((c) => !/[\u064B-\u0652\u0670\u0640]/.test(c)).join("");
  s = s.replace(/ي|ى/g, "ی").replace(/ه|ة/g, "ہ").replace(/ٰ|ٔ/g, "");
  return s;
}

/**
 * Extract the rhyme tail: last vowel-carrier + following letters.
 * Heuristic: walk back over the final consonant cluster, include the
 * last vowel (ا آ و ی ے) plus everything after it.
 */
export function rhymeTail(word: string): string {
  const s = normalizeTail(word);
  if (!s) return "";
  const chars = [...s];
  let lastVowel = -1;
  for (let i = chars.length - 1; i >= 0; i--) {
    if ("اویےآ".includes(chars[i])) {
      lastVowel = i;
      break;
    }
  }
  if (lastVowel < 0) return s.slice(-2);
  // include one consonant before the vowel for consonant-rich tails (م integral: -ام، -ار)
  const start = lastVowel > 0 && !"اویےآ".includes(chars[lastVowel - 1]) ? lastVowel - 1 : lastVowel;
  return chars.slice(start).join("");
}

export function tailScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 3;
  if (a.endsWith(b) || b.endsWith(a)) return 2;
  const la = [...a], lb = [...b];
  let shared = 0;
  const n = Math.min(la.length, lb.length);
  for (let i = 1; i <= n; i++) {
    if (la[la.length - i] === lb[lb.length - i]) shared++;
    else break;
  }
  return shared;
}
