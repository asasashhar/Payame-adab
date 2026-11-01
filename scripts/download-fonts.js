/**
 * Payam-e-Adab — approved Urdu fonts downloader.
 * Tries multiple candidate mirrors per font, validates font magic bytes,
 * and writes public/fonts/fonts-manifest.json with per-font availability.
 * Missing assets are reported honestly (never faked).
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = "/home/z/my-project/public/fonts";
fs.mkdirSync(OUT, { recursive: true });

const FONTS = [
  { id: "jameel-noori-nastaleeq", file: "JameelNooriNastaleeq.ttf", label: "Jameel Noori Nastaleeq",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/JameelNooriNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/JameelNooriNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/JameelNooriNastaleeq.ttf",
      "https://raw.githubusercontent.com/shahzaib-A_1/urdu-fonts/main/JameelNooriNastaleeq.ttf",
      "https://raw.githubusercontent.com/urdu-fonts/jameel-noori/main/JameelNooriNastaleeq.ttf",
    ] },
  { id: "faiz-lahori-nastaleeq", file: "FaizLahoriNastaleeq.ttf", label: "Faiz Lahori Nastaleeq",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/FaizLahoriNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/FaizLahoriNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/FaizLahoriNastaleeq.ttf",
      "https://raw.githubusercontent.com/urdu-fonts/faiz-lahori/main/FaizLahoriNastaleeq.ttf",
    ] },
  { id: "alvi-nastaleeq", file: "AlviNastaleeq.ttf", label: "Alvi Nastaleeq Regular",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/AlviNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/AlviNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/AlviNastaleeq.ttf",
      "https://raw.githubusercontent.com/urdu-fonts/alvi/main/AlviNastaleeq.ttf",
    ] },
  { id: "jameel-noori-kasheeda", file: "JameelNooriNastaleeqKasheeda.ttf", label: "Jameel Noori Nastaleeq Kasheeda",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/JameelNooriNastaleeqKasheeda.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/JameelNooriNastaleeqKasheeda.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/JameelNooriNastaleeqKasheeda.ttf",
    ] },
  { id: "noto-nastaliq-urdu", file: "NotoNastaliqUrdu.ttf", label: "Noto Nastaliq Urdu",
    candidates: [
      "https://github.com/google/fonts/raw/main/ofl/notonastaliqurdu/NotoNastaliqUrdu%5Bwght%5D.ttf",
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notonastaliqurdu/NotoNastaliqUrdu%5Bwght%5D.ttf",
      "https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts/NotoNastaliqUrdu/hinted/ttf/NotoNastaliqUrdu-Regular.ttf",
    ] },
  { id: "alqalam-taj-nastaleeq", file: "AlQalamTajNastaleeq.ttf", label: "AlQalam Taj Nastaleeq Regular",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/AlQalamTajNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/AlQalamTajNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/AlQalamTajNastaleeq.ttf",
      "https://raw.githubusercontent.com/alqalamcenter/fonts/main/AlQalamTajNastaleeq.ttf",
    ] },
  { id: "aa-sameer-sagar-nastaleeq", file: "AASameerSagarNastaleeq.ttf", label: "AA Sameer Sagar Nastaleeq",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/AASameerSagarNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/AASameerSagarNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/AASameerSagarNastaleeq.ttf",
    ] },
  { id: "alqalam-alvi-nastaleeq", file: "AlQalamAlviNastaleeq.ttf", label: "AlQalam Alvi Nastaleeq",
    candidates: [
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/AlQalamAlviNastaleeq.ttf",
      "https://raw.githubusercontent.com/itxxruattari/urdu-fonts/main/AlQalamAlviNastaleeq.ttf",
      "https://cdn.jsdelivr.net/gh/faseehurrehman/urdu-fonts@main/AlQalamAlviNastaleeq.ttf",
    ] },
  { id: "mehr-nastaliq-web", file: "MehrNastaliqWeb.ttf", label: "Mehr Nastaliq Web",
    candidates: [
      "https://raw.githubusercontent.com/Maqib/Mehr-Nastaliq-Web/master/fonts/MehrNastaliqWeb-Regular.ttf",
      "https://cdn.jsdelivr.net/gh/Maqib/Mehr-Nastaliq-Web@master/fonts/MehrNastaliqWeb-Regular.ttf",
      "https://raw.githubusercontent.com/quranwbw/Mehr-Nastaliq-Web/master/fonts/MehrNastaliqWeb-Regular.ttf",
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/MehrNastaliqWeb.ttf",
    ] },
  { id: "nafees-web-naskh", file: "NafeesWebNaskh.ttf", label: "PDMS Nafees Web Naskh",
    candidates: [
      "https://raw.githubusercontent.com/urduhack/urdu-fonts/master/fonts/NafeesWebNaskh.ttf",
      "https://raw.githubusercontent.com/urduhack/urdu-fonts/master/NafeesWebNaskh.ttf",
      "https://cdn.jsdelivr.net/gh/urduhack/urdu-fonts@master/fonts/NafeesWebNaskh.ttf",
      "https://raw.githubusercontent.com/faseehurrehman/urdu-fonts/main/NafeesWebNaskh.ttf",
    ] },
];

function isValidFont(buf) {
  if (!buf || buf.length < 1000) return false;
  const sig = buf.slice(0, 4).toString("binary");
  return sig === "\x00\x01\x00\x00" || sig === "OTTO" || sig === "true" || sig === "ttcf" || sig === "wOFF" || sig === "wOF2";
}

function fetchBuf(url, redirects = 4) {
  return new Promise((resolve) => {
    if (redirects < 0) return resolve(null);
    const req = https.get(url, { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (compatible; PayamAdabFonts/1.0)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchBuf(new URL(res.headers.location, url).href, redirects - 1));
      }
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => resolve(null));
    });
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.on("error", () => resolve(null));
  });
}

// ---- Secondary strategy: discover via GitHub contents API of likely repos ----
async function discoverInRepos() {
  const repos = [
    "faseehurrehman/urdu-fonts", "itxxruattari/urdu-fonts", "urduhack/urdu-fonts",
  ];
  const found = {};
  for (const repo of repos) {
    const buf = await fetchBuf(`https://api.github.com/repos/${repo}/contents/`);
    if (!buf) { console.log(`repo not reachable: ${repo}`); continue; }
    try {
      const items = JSON.parse(buf.toString());
      if (!Array.isArray(items)) continue;
      found[repo] = items.filter(i => i.type === "file" && /\.(ttf|otf|woff2?)$/i.test(i.name)).map(i => i.name);
      console.log(`repo ${repo}:`, found[repo].join(", ") || "(no fonts)");
    } catch { /* ignore */ }
  }
  return found;
}

async function main() {
  const manifest = [];
  for (const font of FONTS) {
    const dest = path.join(OUT, font.file);
    if (fs.existsSync(dest)) {
      const cur = fs.readFileSync(dest);
      if (isValidFont(cur)) {
        manifest.push({ ...font, available: true, sizeKB: Math.round(cur.length / 1024), path: `/fonts/${font.file}` });
        console.log(`✓ ${font.label}: already present`);
        continue;
      }
      fs.unlinkSync(dest);
    }
    let ok = false;
    for (const url of font.candidates) {
      const buf = await fetchBuf(url);
      if (isValidFont(buf)) {
        fs.writeFileSync(dest, buf);
        console.log(`✓ ${font.label}: downloaded from ${new URL(url).host} (${Math.round(buf.length / 1024)} KB)`);
        manifest.push({ ...font, available: true, sizeKB: Math.round(buf.length / 1024), path: `/fonts/${font.file}` });
        ok = true;
        break;
      }
    }
    if (!ok) {
      console.log(`✗ ${font.label}: NO valid source found`);
      manifest.push({ ...font, available: false, path: `/fonts/${font.file}` });
    }
  }
  fs.writeFileSync(path.join(OUT, "fonts-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nSummary:", manifest.filter(m => m.available).length, "of", manifest.length, "fonts available");
}

main().catch((e) => { console.error(e); process.exit(1); });
