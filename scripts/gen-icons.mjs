// Generates PWA icon PNGs from public/icons/app-icon.svg (run: npm run icons).
// Commit the generated PNGs so Vercel builds do not need sharp.

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = join("public", "icons");
await mkdir(OUT, { recursive: true });

const baseSvg = await readFile(join(OUT, "app-icon.svg"), "utf8");
// Maskable variant: full-bleed square background so Android safe-zone cropping
// never cuts the artwork.
const maskableSvg = baseSvg.replace('rx="96"', 'rx="0"');

const targets = [
  { file: "icon-192.png", size: 192, svg: baseSvg },
  { file: "icon-512.png", size: 512, svg: baseSvg },
  { file: "maskable-512.png", size: 512, svg: maskableSvg },
  { file: "apple-touch-icon.png", size: 180, svg: maskableSvg },
];

for (const target of targets) {
  await sharp(Buffer.from(target.svg), { density: 300 })
    .resize(target.size, target.size)
    .png()
    .toFile(join(OUT, target.file));
  console.log("generated", target.file);
}
