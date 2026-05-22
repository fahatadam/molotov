// Ephemeral: samples the canonical flame blue from the official logo so the
// design system can adopt it as the accent color.
// Run with: node scripts/extract-brand-color.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "public", "brand", "logo_sinfondo.png");

const hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const img = sharp(src);
const meta = await img.metadata();
console.log(`canvas: ${meta.width}x${meta.height}, channels: ${meta.channels}`);

const { data, info } = await img
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const px = (x, y) => {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};

// Content bounding box (non-transparent pixels), useful for nav/icon crops.
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (px(x, y)[3] > 16) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log(
  `content bbox: x=${minX} y=${minY} w=${maxX - minX} h=${maxY - minY}`,
);

// Single-pixel sample at the suggested flame center.
console.log("center sample (700,300):", hex(...px(700, 300)));

// Robust: average the most saturated blue pixels inside the flame region,
// ignoring transparent/dark edges, so anti-aliasing can't skew the result.
let R = 0, G = 0, B = 0, n = 0;
for (let y = 180; y < 460; y++) {
  for (let x = 600; x < 840; x++) {
    const [r, g, b, a] = px(x, y);
    if (a < 200) continue;
    if (b > 150 && b > r + 40 && g > r) {
      R += r;
      G += g;
      B += b;
      n++;
    }
  }
}
if (n > 0) {
  console.log(`flame avg over ${n} px:`, hex(R / n, G / n, B / n), `rgb(${Math.round(R / n)}, ${Math.round(G / n)}, ${Math.round(B / n)})`);
} else {
  console.log("no blue pixels found in region — adjust coordinates");
}
