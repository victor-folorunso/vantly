/**
 * The Vantly mark, and every size derived from it.
 *
 * Two blocks offset on a diagonal, with a constant channel between them. No
 * letter. It reads as one thing passing through and coming out somewhere else,
 * which is what most of the site does, and it survives being 16 pixels wide
 * because it is two solid masses rather than a stroke.
 *
 * The channel is carved by stroking the lower block in the mask's own white,
 * so the gap is exactly one width everywhere. The earlier version drew two
 * hand plotted polygons and the gap came out 2 units at the ends and 16 in the
 * middle, which looked like a mistake rather than a decision.
 *
 * Rasterised with sharp rather than a headless browser. Every PNG comes from
 * this one path, so the favicon and the app icon cannot drift apart.
 *
 * Run: node --experimental-strip-types scripts/make-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const ACCENT = '#b4530a';

/** Block geometry, in the 100 unit box. */
/*
  Tuned for 16px, not for the 512 that looks good in a folder.
  
  The first cut used 33 unit blocks with a 7 unit channel inside a 100 unit box.
  At a 16 pixel favicon that is roughly five pixels of block, one of gap, five
  of block, and the whole thing closes into a single blob. Bigger blocks and a
  proportionally wider channel keep three distinct features at the only size
  most people ever see.
*/
const A = { x: 15, y: 15, w: 40, h: 40 }; // upper left
const B = { x: 45, y: 45, w: 40, h: 40 }; // lower right
const GAP = 11; // channel width, carved as a stroke
const R = 6; // corner radius on the blocks

/** `fg` is what the blocks are cut out of, so pass a mask colour or a paint. */
function mark({ tile = true, color = ACCENT } = {}) {
  const blocks = `
    <rect x="${A.x}" y="${A.y}" width="${A.w}" height="${A.h}" rx="${R}"/>
    <rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="${R}"/>`;

  if (tile) {
    // Knocked out of a solid tile: blocks are holes, and the channel is
    // re-filled so the two never touch.
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <mask id="v">
      <rect width="100" height="100" fill="#fff"/>
      <g fill="#000">${blocks}</g>
      <rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="${R}"
            fill="none" stroke="#fff" stroke-width="${GAP}"/>
    </mask>
  </defs>
  <rect width="100" height="100" rx="24" fill="${color}" mask="url(#v)"/>
</svg>`;
  }

  // Bare mark, for anywhere the tile would fight the surface behind it.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <mask id="c">
      <rect width="100" height="100" fill="#fff"/>
      <rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="${R}"
            fill="none" stroke="#000" stroke-width="${GAP}"/>
    </mask>
  </defs>
  <g fill="currentColor" mask="url(#c)">${blocks}</g>
</svg>`;
}

const tileSvg = mark();
const monoSvg = mark({ tile: false });

writeFileSync(join(pub, 'icon.svg'), tileSvg + '\n');
writeFileSync(join(pub, 'icon-mono.svg'), monoSvg + '\n');

const SIZES = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['apple-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

const buf = Buffer.from(tileSvg);
for (const [name, size] of SIZES) {
  await sharp(buf, { density: 512 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(pub, name));
  console.log('wrote', name, `${size}px`);
}

console.log('wrote icon.svg and icon-mono.svg');
