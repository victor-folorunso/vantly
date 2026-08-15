/**
 * The cube from the generated render, redrawn flat.
 *
 * The render itself cannot be the icon: shrunk to 32 the tool faces vanish and
 * at 16 it is a brown smudge, which is what soft shading and photographic
 * detail always do at favicon size. The idea survives that translation though,
 * and a flat isometric cube is a strong silhouette at any size because its
 * outline is a hexagon rather than yet another rounded square.
 *
 * These vary how much detail sits on the faces, since that is the part with a
 * cost. Every one is rendered down to 16 so the cost is visible.
 *
 * Run: node --experimental-strip-types scripts/icon-options.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TOP = '#e0873f';
const LEFT = '#b4530a';
const RIGHT = '#8f4108';

/* An isometric cube, drawn once. Rise 22 over run 38, so the faces skew ~30deg. */
const CUBE = `
  <path d="M50 10 L88 32 L50 54 L12 32 Z" fill="${TOP}"/>
  <path d="M12 32 L50 54 L50 94 L12 72 Z" fill="${LEFT}"/>
  <path d="M88 32 L88 72 L50 94 L50 54 Z" fill="${RIGHT}"/>`;

/* Content laid on the left face has to lie down with it, so it is skewed to
   match rather than pasted on flat, which reads as a sticker. */
const onLeftFace = (inner) =>
  `<g transform="translate(12 32) skewY(30) scale(0.95)">${inner}</g>`;

const wrench = (w) => `
  <path d="M9 30 L24 15" stroke="#fff" stroke-width="${w}" stroke-linecap="round" fill="none"/>
  <path d="M31 8 A8 8 0 1 0 23 16" stroke="#fff" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

const OPTIONS = [
  {
    id: 'a-plain',
    note: 'The cube alone. Three tones, nothing on the faces.',
    svg: svg(CUBE),
  },
  {
    id: 'b-wrench',
    note: 'A spanner lying on the left face, skewed to sit on it.',
    svg: svg(`${CUBE}${onLeftFace(wrench(5))}`),
  },
  {
    id: 'c-wrench-bold',
    note: 'Same, heavier stroke so it survives further down.',
    svg: svg(`${CUBE}${onLeftFace(wrench(7))}`),
  },
  {
    id: 'd-split',
    note: 'A seam across the cube, so it reads as pieces rather than a solid.',
    svg: svg(`${CUBE}
      <path d="M12 32 L50 54 L88 32" stroke="#faf9f7" stroke-width="2.5" fill="none"/>
      <path d="M50 54 L50 94" stroke="#faf9f7" stroke-width="2.5" fill="none"/>`),
  },
  {
    id: 'e-notch',
    note: 'A piece lifted out of the top, so the set is visibly openable.',
    svg: svg(`
      <path d="M50 10 L88 32 L50 54 L12 32 Z" fill="${TOP}"/>
      <path d="M12 32 L50 54 L50 94 L12 72 Z" fill="${LEFT}"/>
      <path d="M88 32 L88 72 L50 94 L50 54 Z" fill="${RIGHT}"/>
      <path d="M50 2 L69 13 L50 24 L31 13 Z" fill="${TOP}"/>`),
  },
];

const ROW_H = 118;
const W = 470;
const H = ROW_H * OPTIONS.length + 20;

const layers = [];
let y = 14;
for (const o of OPTIONS) {
  const buf = Buffer.from(o.svg);
  const at = async (px) => await sharp(buf, { density: 640 }).resize(px, px).png().toBuffer();
  layers.push(
    { input: await at(96), left: 20, top: y },
    { input: await at(48), left: 140, top: y + 24 },
    { input: await at(32), left: 208, top: y + 32 },
    { input: await at(16), left: 260, top: y + 40 },
    {
      input: await sharp({ create: { width: 90, height: 90, channels: 4, background: '#14120f' } })
        .png()
        .toBuffer(),
      left: 296,
      top: y + 3,
    },
    { input: await at(32), left: 325, top: y + 32 },
  );
  y += ROW_H;
}

await sharp({ create: { width: W, height: H, channels: 4, background: '#faf9f7' } })
  .composite(layers)
  .png()
  .toFile(join(root, 'icon-options.png'));

console.log('wrote icon-options.png');
OPTIONS.forEach((o, i) => console.log(` ${i + 1}  ${o.id.padEnd(14)} ${o.note}`));
