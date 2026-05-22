// Generates the Molotov PWA / favicon set from a redrawn vector mark
// (molotov bottle + flame), inspired by the official logo but adapted to a
// black background: off-white bottle (#F5F4ED) with blue accents, blue flame
// (#0178DE, the canonical flame color sampled from the logo).
// Run with: pnpm --filter @molotov/web icons:gen
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const FLAME = "#0178DE"; // canonical flame blue (sampled from the logo)
const BOTTLE = "#F5F4ED"; // off-white, visible on black

// The mark lives in a 100 x 152 box, centered on x=50. Flame sits y≈8–64,
// bottle y≈66–150.
const MARK = `
  <!-- flame: a leaning main tongue with a right-side lick -->
  <path d="M48 6 C 55 24 49 34 55 45 C 60 54 56 62 48 64 C 41 62 40 52 45 43 C 50 33 45 21 48 6 Z" fill="${FLAME}"/>
  <path d="M60 27 C 69 37 70 49 63 58 C 59 61 54 58 56 50 C 59 42 56 34 60 27 Z" fill="${FLAME}"/>
  <path d="M40 40 C 34 48 34 55 39 60 C 41 62 45 60 43 55 C 41 49 43 45 40 40 Z" fill="${FLAME}"/>
  <!-- bottle -->
  <path d="M44 66 L56 66 L56 73 C 56 78 58 80 60 84 C 70 90 78 100 78 116 L78 140
           C 78 146 74 150 68 150 L32 150 C 26 150 22 146 22 140 L22 116
           C 22 100 30 90 40 84 C 42 80 44 78 44 73 Z" fill="${BOTTLE}"/>
  <!-- blue accents on the bottle -->
  <rect x="30" y="100" width="3.5" height="38" rx="1.75" fill="${FLAME}"/>
  <rect x="64" y="112" width="3.5" height="22" rx="1.75" fill="${FLAME}"/>
  <rect x="46.5" y="74" width="3" height="14" rx="1.5" fill="${FLAME}"/>
`;

function svg(size, padFrac) {
  const markH = size * (1 - 2 * padFrac);
  const scale = markH / 152;
  const markW = 100 * scale;
  const tx = (size - markW) / 2;
  const ty = (size - markH) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${MARK}</g>
</svg>`;
}

const targets = [
  { name: "icon-192.png", size: 192, pad: 0.1 },
  { name: "icon-512.png", size: 512, pad: 0.1 },
  { name: "apple-touch-icon.png", size: 180, pad: 0.1 },
  { name: "favicon-32.png", size: 32, pad: 0.05 },
  { name: "favicon-16.png", size: 16, pad: 0.04 },
];

for (const { name, size, pad } of targets) {
  await sharp(Buffer.from(svg(size, pad)))
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, name));
  console.log("✓", name, `(${size}x${size})`);
}
