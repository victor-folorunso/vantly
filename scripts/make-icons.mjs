/**
 * The icon set, built from the generated cube render.
 *
 * The source is a photographic render with soft shading, which is not what a
 * favicon wants: shrunk to 32 the tool faces fade and at 16 it is a brown
 * smudge. It is being tried anyway to see how it actually behaves in a browser,
 * which is the only way to settle it.
 *
 * Two things soften the landing. The crop is found by scanning for pixels
 * darker than the ground rather than guessed, so the cube is centred and the
 * same every run. And the small sizes get sharpened after downscaling, which
 * recovers some of the edge definition that averaging throws away.
 *
 * design/icon-split-cube.svg is the fallback if this reads badly. Point SOURCE
 * at it and rerun.
 *
 * Run: npm run icons
 */

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const SOURCE = join(root, 'Gemini_Generated_Image_tm3v7atm3v7atm3v.jpg');

/** Square crop centred on the subject, found rather than hard coded. */
async function cropToSubject(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => data[y * info.width + x];
  const threshold = at(5, 5) - 25;

  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (at(x, y) < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX;
  const h = maxY - minY;
  const side = Math.round(Math.max(w, h) * 1.18);
  const left = Math.max(0, Math.round(minX + w / 2 - side / 2));
  const top = Math.max(0, Math.round(minY + h / 2 - side / 2));
  const size = Math.min(side, info.height - top, info.width - left);
  return sharp(file).extract({ left, top, width: size, height: size });
}

const square = await cropToSubject(SOURCE);
const master = await square.resize(1024, 1024).png().toBuffer();

const SIZES = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['apple-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of SIZES) {
  let pipe = sharp(master).resize(size, size, { kernel: 'lanczos3' });
  // Downscaling averages edges away. A little sharpening at the sizes where
  // that hurts most buys back some definition.
  if (size <= 48) pipe = pipe.sharpen({ sigma: 0.6 });
  await pipe.png().toFile(join(pub, name));
  console.log('wrote', name, `${size}px`);
}

/* The SVG favicon has to go: browsers prefer it over every PNG, and there is no
   vector of a shaded render. Leaving it would mean shipping the old mark. */
writeFileSync(
  join(pub, 'icon.svg'),
  `<!-- Removed. The icon is a raster render; see scripts/make-icons.mjs.\n` +
    `     A vector fallback is kept at design/icon-split-cube.svg. -->\n`,
  'utf8',
);

/* Social card, where the detail is the point and nothing is shrunk. */
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: '#faf9f7' },
})
  .composite([{ input: await sharp(master).resize(520, 520).png().toBuffer(), left: 340, top: 55 }])
  .png()
  .toFile(join(pub, 'og.png'));
console.log('wrote og.png 1200x630');
