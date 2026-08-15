/**
 * The icon set, built from the cube render.
 *
 * The source has a transparent background, so the mark sits on whatever is
 * behind it: the page in the header, the tab strip in a browser, the launcher
 * on a phone. That is worth more than it sounds. A white tile behind an icon
 * looks like a sticker on a dark tab bar, and every browser that shows favicons
 * on dark chrome would have shown one.
 *
 * The crop is found rather than guessed, by scanning the alpha channel for the
 * first and last row and column carrying any subject. Hard coding a box means
 * re-measuring by hand every time the source changes.
 *
 * design/icon-split-cube.svg is the reserve if this ever reads badly at small
 * sizes. Point SOURCE at it and rerun; nothing else needs touching.
 *
 * There is deliberately no icon.svg. Browsers prefer an SVG favicon over every
 * PNG, so shipping one would silently override this entire set.
 *
 * Run: npm run icons
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const SOURCE = join(root, 'Gemini_Generated_Image_tm3v7atm3v7atm3v-Photoroom.png');

/** The page background, for the one output that cannot be transparent. */
const GROUND = '#faf9f7';

/**
 * Square crop centred on whatever is actually opaque.
 *
 * Anything under a tenth alpha is treated as background, which ignores the
 * feathered edge left behind by cutting the original out.
 */
async function squareCrop(file) {
  const img = sharp(file).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + info.channels - 1];

  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (alphaAt(x, y) > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  console.log(`subject ${w}x${h} at ${minX},${minY}`);

  // A little air, so the cube is not jammed against the edge of a rounded mask
  // on iOS, which crops icons itself.
  const side = Math.round(Math.max(w, h) * 1.1);
  const cx = minX + w / 2;
  const cy = minY + h / 2;

  /*
    Two passes on purpose. sharp applies extract and extend in its own fixed
    order rather than the order they are called, so chaining them asks for a
    crop that lands outside the original and fails with "bad extract area".
    Padding to a buffer first makes the crop unambiguous.
  */
  const pad = side;
  const padded = await sharp(file)
    .ensureAlpha()
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp(padded).extract({
    left: Math.round(cx - side / 2) + pad,
    top: Math.round(cy - side / 2) + pad,
    width: side,
    height: side,
  });
}

const master = await (await squareCrop(SOURCE)).resize(1024, 1024).png().toBuffer();

const SIZES = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['apple-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of SIZES) {
  let pipe = sharp(master).resize(size, size, { kernel: 'lanczos3' });
  // Downscaling averages edges away, which costs most at the sizes where there
  // is least to lose.
  if (size <= 48) pipe = pipe.sharpen({ sigma: 0.6 });
  await pipe.png().toFile(join(pub, name));
  console.log('wrote', name, `${size}px`);
}

/*
  Apple ignores transparency and composites onto black, which would put the
  cube on a black square on a home screen. So that one gets the page colour
  behind it deliberately rather than by accident.
*/
await sharp(master)
  .resize(180, 180)
  .flatten({ background: GROUND })
  .png()
  .toFile(join(pub, 'apple-icon.png'));
console.log('wrote apple-icon.png 180px, flattened onto the page colour');

/* Social cards cannot be transparent either; most clients put them on white. */
await sharp({ create: { width: 1200, height: 630, channels: 4, background: GROUND } })
  .composite([{ input: await sharp(master).resize(500, 500).png().toBuffer(), left: 350, top: 65 }])
  .png()
  .toFile(join(pub, 'og.png'));
console.log('wrote og.png 1200x630');
