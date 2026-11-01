/**
 * Payam-e-Adab — brand asset preparation from user-uploaded images.
 *  - logo-badge.png        : circular badge (from the 2-version JPG, left) with transparent corners
 *  - logo-horizontal.png   : horizontal logo w/ tagline (right half of the JPG)
 *  - hero-emblem.jpg       : full cinematic emblem scene (homepage hero)
 *  - watermark.png         : circular badge for watermarking (full alpha; opacity applied at usage time)
 *  - src/app/icon.png      : favicon 64x64 (replaces icon.svg)
 *  - public/brand/og-image.jpg : social share image (1200x630 crop of the emblem scene)
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const UPLOAD = "/home/z/my-project/upload";
const BRAND = "/home/z/my-project/public/brand";
const TMP = "/home/z/my-project/scripts/tmp-brand";

async function main() {
  fs.mkdirSync(BRAND, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  const jpgPath = path.join(UPLOAD, "a1658935-4ff8-423d-8302-f0636d828fa8 copy 3.jpg");
  const pngPath = path.join(UPLOAD, "Payam-e-Adab Literary Emblem.png");

  const jpg = sharp(jpgPath);
  const metaJ = await jpg.metadata();
  console.log("JPG logo sheet:", metaJ.width, "x", metaJ.height);
  const png = sharp(pngPath);
  const metaP = await png.metadata();
  console.log("PNG emblem scene:", metaP.width, "x", metaP.height);

  const W = metaJ.width, H = metaJ.height;

  // ---------- 1. Circular badge (left part of the JPG) ----------
  // Badge circle estimated at center x ~0.171W, y ~0.5H, radius ~0.148W
  const cx = 0.171 * W, cy = 0.5 * H, r = 0.148 * W;
  const side = Math.round(2 * r);
  const left = Math.round(cx - r), top = Math.round(cy - r);
  const badge = await sharp(jpgPath)
    .extract({ left, top, width: side, height: Math.min(side, H - top) })
    .toBuffer();
  // circular alpha mask
  const maskSize = 512;
  const circleSvg = Buffer.from(
    `<svg width="${maskSize}" height="${maskSize}"><circle cx="${maskSize / 2}" cy="${maskSize / 2}" r="${maskSize / 2 - 1}" fill="#fff"/></svg>`
  );
  await sharp(badge)
    .resize(maskSize, maskSize)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png()
    .toFile(path.join(BRAND, "logo-badge.png"));
  console.log("logo-badge.png done");

  // ---------- 2. Horizontal logo (right part of the JPG) ----------
  const hx = Math.round(0.345 * W);
  await sharp(jpgPath)
    .extract({ left: hx, top: 0, width: W - hx, height: H })
    .png()
    .toFile(path.join(BRAND, "logo-horizontal.png"));
  console.log("logo-horizontal.png done");

  // ---------- 3. Hero emblem scene (compressed) ----------
  await sharp(pngPath)
    .resize(1600)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(BRAND, "hero-emblem.jpg"));
  console.log("hero-emblem.jpg done");

  // ---------- 4. Watermark badge (higher-res circle from the PNG scene, crop slightly inside the gold ring) ----------
  const PW = metaP.width, PH = metaP.height;
  const pcx = 0.5 * PW, pcy = 0.462 * PH, pr = 0.217 * PW; // slightly inside the outer ring
  const pside = Math.round(2 * pr);
  const pleft = Math.round(pcx - pr), ptop = Math.round(pcy - pr);
  const badgeHi = await sharp(pngPath)
    .extract({ left: pleft, top: ptop, width: pside, height: Math.min(pside, PH - ptop) })
    .toBuffer();
  await sharp(badgeHi)
    .resize(800, 800)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png()
    .toFile(path.join(BRAND, "watermark.png"));
  console.log("watermark.png done");

  // ---------- 5. Favicon (64x64) ----------
  await sharp(path.join(BRAND, "logo-badge.png")).resize(64, 64).png().toFile("/home/z/my-project/src/app/icon.png");
  console.log("icon.png done");

  // ---------- 6. OG image (1200x630 from emblem scene) ----------
  const ogH = Math.round(PW * 630 / 1200);
  await sharp(pngPath)
    .extract({ left: 0, top: Math.max(0, Math.round((PH - ogH) / 2)), width: PW, height: Math.min(ogH, PH) })
    .resize(1200, 630)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(BRAND, "og-image.jpg"));
  console.log("og-image.jpg done");
}

main().catch((e) => { console.error(e); process.exit(1); });
