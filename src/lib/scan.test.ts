import { describe, expect, it } from 'vitest';
import { apply, clean, findPaper, homography, otsu, outputSize, warp, type Pixels, type Quad } from './scan';

/** A dark photo with a bright quadrilateral in it. */
function photo(w: number, h: number, q: Quad): Pixels {
  const data = new Uint8ClampedArray(w * h * 4);
  // Inside test: the point is on the inner side of every edge.
  const inside = (x: number, y: number) =>
    q.every((a, i) => {
      const b = q[(i + 1) % 4];
      return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) >= 0;
    });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = inside(x + 0.5, y + 0.5) ? 235 : 40;
      const o = (y * w + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = v;
      data[o + 3] = 255;
    }
  return { data, width: w, height: h };
}

describe('scan', () => {
  it('splits a two-tone histogram between the tones', () => {
    const hist = new Array(256).fill(0);
    hist[40] = 500;
    hist[220] = 500;
    const t = otsu(hist, 1000);
    expect(t).toBeGreaterThanOrEqual(40);
    expect(t).toBeLessThan(220);
  });

  it('finds the corners of a tilted sheet', () => {
    const q: Quad = [{ x: 60, y: 30 }, { x: 260, y: 50 }, { x: 240, y: 270 }, { x: 40, y: 250 }];
    const found = findPaper(photo(300, 300, q))!;
    expect(found).not.toBeNull();
    found.forEach((p, i) => {
      expect(Math.abs(p.x * 300 - q[i].x)).toBeLessThan(4);
      expect(Math.abs(p.y * 300 - q[i].y)).toBeLessThan(4);
    });
  });

  it('gives up on a photo with no sheet in it', () => {
    const q: Quad = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }, { x: 0, y: 300 }];
    expect(findPaper(photo(300, 300, q))).toBeNull();
  });

  it('maps each corner onto its partner', () => {
    const a: Quad = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }];
    const b: Quad = [{ x: 10, y: 5 }, { x: 90, y: 12 }, { x: 95, y: 70 }, { x: 3, y: 60 }];
    const H = homography(a, b);
    a.forEach((p, i) => {
      const m = apply(H, p.x, p.y);
      expect(m.x).toBeCloseTo(b[i].x, 6);
      expect(m.y).toBeCloseTo(b[i].y, 6);
    });
  });

  it('flattens a tilted sheet into an all-white page', () => {
    const q: Quad = [{ x: 60, y: 30 }, { x: 260, y: 50 }, { x: 240, y: 270 }, { x: 40, y: 250 }];
    const size = outputSize(q, 1000);
    expect(size.width).toBeGreaterThan(195);
    const out = warp(photo(300, 300, q), q, size.width, size.height);
    let dark = 0;
    for (let i = 0; i < out.data.length; i += 4) if (out.data[i] < 128) dark++;
    // Only the outermost ring of pixels may blend with the background.
    expect(dark / (out.width * out.height)).toBeLessThan(0.02);
  });

  it('keeps ink black in a shadowed corner', () => {
    // Paper fading from 240 to 120 left to right, with a dark stroke in each half.
    const w = 200;
    const h = 100;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const paper = 240 - (x / w) * 120;
        const ink = (y >= 45 && y < 55 && ((x >= 20 && x < 60) || (x >= 140 && x < 180)));
        const v = ink ? paper * 0.35 : paper;
        const o = (y * w + x) * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
      }
    const bw = clean({ data, width: w, height: h }, 'bw');
    const at = (x: number, y: number) => bw.data[(y * w + x) * 4];
    expect(at(40, 50)).toBe(0);
    expect(at(160, 50)).toBe(0);
    expect(at(40, 20)).toBe(255);
    expect(at(185, 85)).toBe(255);
  });
});
