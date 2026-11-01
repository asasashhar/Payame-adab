/** Detect the circular badge bounds in the logo sheet JPG and re-crop precisely. */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const JPG = "/home/z/my-project/upload/a1658935-4ff8-423d-8302-f0636d828fa8 copy 3.jpg";
const BRAND = "/home/z/my-project/public/brand";

async function main() {
  const meta = await sharp(JPG).metadata();
  const W = meta.width, H = meta.height;

  // Downscale for analysis
  const AW = 240, AH = Math.round(H * AW / W);
  const { data, info } = await sharp(JPG).resize(AW, AH).greyscale().raw().toBuffer({ resolveWithObject: true });

  // Find dark pixels (badge disc is near-black; white bg is bright) within left 45% of image
  const limitX = Math.floor(AW * 0.45);
  let minX = AW, maxX = -1, minY = AH, maxY = -1;
  for (let y = 0; y < AH; y++) {
    for (let x = 0; x < limitX; x++) {
      const v = data[y * info.width + x];
      if (v < 90) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log("dark bbox (analysis px):", { minX, maxX, minY, maxY });

  const cx = (minX + maxX) / 2 / AW * W;
  const cy = (minY + maxY) / 2 / AH * H;
  const r = Math.max(maxX - minX, maxY - minY) / 2 / AW * W;
  console.log("detected circle:", { cx: Math.round(cx), cy: Math.round(cy), r: Math.round(r) });

  const side = Math.round(2 * r) + 6; // small margin for the gold ring glow
  const left = Math.max(0, Math.round(cx - side / 2));
  const top = Math.max(0, Math.round(cy - side / 2));
  const size = Math.min(side, W - left, H - top);
  console.log("crop:", { left, top, size });

  const badge = await sharp(JPG).extract({ left, top, width: size, height: size }).toBuffer();
  const mask = 512;
  const circleSvg = Buffer.from(
    `<svg width="${mask}" height="${mask}"><circle cx="${mask / 2}" cy="${mask / 2}" r="${mask / 2 - 1}" fill="#fff"/></svg>`
  );
  await sharp(badge).resize(mask, mask)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png().toFile(path.join(BRAND, "logo-badge.png"));

  // favicon
  await sharp(path.join(BRAND, "logo-badge.png")).resize(64, 64).png().toFile("/home/z/my-project/src/app/icon.png");

  // Re-crop watermark from the big emblem PNG precisely too
  const PNG = "/home/z/my-project/upload/Payam-e-Adab Literary Emblem.png";
  const pm = await sharp(PNG).metadata();
  const PW = pm.width, PH = pm.height;
  const a2 = await sharp(PNG).resize(240, Math.round(PH * 240 / PW)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const info2 = a2.info;
  let nminX = 1e9, nmaxX = -1, nminY = 1e9, nmaxY = -1;
  // badge disc = dark pixels surrounded mid area; emblem scene has dark bg though — detect the black disc via darkest circle region:
  // Instead: find dark pixels in central band x in [0.3,0.7], y in [0.15,0.85] — the disc is pure black vs navy bg
  for (let y = 0; y < info2.height; y++) {
    for (let x = 0; x < info2.width; x++) {
      const fx = x / info2.width, fy = y / info2.height;
      if (fx < 0.30 || fx > 0.70 || fy < 0.12 || fy > 0.88) continue;
      const v = a2.data[y * info2.width + x];
      if (v < 40) {
        if (x < nminX) nminX = x;
        if (x > nmaxX) nmaxX = x;
        if (y < nminY) nminY = y;
        if (y > nmaxY) nmaxY = y;
      }
    }
  }
  const pcx = ((nminX + nmaxX) / 2) / info2.width * PW;
  const pcy = ((nminY + nmaxY) / 2) / info2.height * PH;
  const pr = Math.max(nmaxX - nminX, nmaxY - nminY) / 2 / info2.width * PW;
  console.log("png disc:", { pcx: Math.round(pcx), pcy: Math.round(pcy), pr: Math.round(pr) });
  const pside = Math.round(2 * pr) + 10;
  const pleft = Math.max(0, Math.round(pcx - pside / 2));
  const ptop = Math.max(0, Math.round(pcy - pside / 2));
  const psize = Math.min(pside, PW - pleft, PH - ptop);
  const badgeHi = await sharp(PNG).extract({ left: pleft, top: ptop, width: psize, height: psize }).toBuffer();
  await sharp(badgeHi).resize(800, 800)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png().toFile(path.join(BRAND, "watermark.png"));
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); });
