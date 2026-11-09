/**
 * Turning a photo of a sheet of paper into a flat scan.
 *
 * findPaper   where the sheet is: the largest bright region, found by an
 *             Otsu threshold on a small copy, and its four outermost corners
 * homography  the projective map from the output rectangle back onto that
 *             four-sided shape in the photo
 * warp        every output pixel looked up in the photo through that map,
 *             with bilinear sampling, which is what straightens a page shot
 *             at an angle instead of merely cropping it
 * clean       colour with levels stretched, greyscale, or black and white by
 *             a local threshold, so a shadow across half the page does not
 *             turn that half black
 *
 * All of it is plain arithmetic on RGBA arrays, so it runs anywhere and is
 * tested without a browser.
 */

export type Pt = { x: number; y: number };
/** Corners in the order top left, top right, bottom right, bottom left. */
export type Quad = [Pt, Pt, Pt, Pt];
export type Filter = 'color' | 'gray' | 'bw';
export type Pixels = { data: Uint8ClampedArray; width: number; height: number };

const lum = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

/** The threshold that best splits a histogram into two groups. */
export function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let at = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; at = t; }
  }
  return at;
}

/**
 * The sheet's corners in a (small) image, as fractions of its width and
 * height, or null when nothing looks like a sheet of paper.
 */
export function findPaper(img: Pixels): Quad | null {
  const { data, width: w, height: h } = img;
  const n = w * h;
  const g = new Uint8Array(n);
  const hist = new Array(256).fill(0);
  for (let p = 0; p < n; p++) {
    const v = Math.round(lum(data, p * 4));
    g[p] = v;
    hist[v]++;
  }
  const t = otsu(hist, n);
  // Largest connected bright region, four-way, by flood fill.
  const label = new Int32Array(n).fill(-1);
  const stack = new Int32Array(n);
  let bestSize = 0;
  let bestLabel = -1;
  let next = 0;
  for (let s = 0; s < n; s++) {
    if (label[s] !== -1 || g[s] <= t) continue;
    let top = 0;
    stack[top++] = s;
    label[s] = next;
    let size = 0;
    while (top) {
      const p = stack[--top];
      size++;
      const x = p % w;
      const y = (p - x) / w;
      const visit = (q: number) => { if (label[q] === -1 && g[q] > t) { label[q] = next; stack[top++] = q; } };
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (y > 0) visit(p - w);
      if (y < h - 1) visit(p + w);
    }
    if (size > bestSize) { bestSize = size; bestLabel = next; }
    next++;
  }
  // A sheet fills a fair part of the photo but not all of it. Outside that
  // range the photo is most likely already cropped, or not of paper.
  if (bestSize < n * 0.12 || bestSize > n * 0.97) return null;

  const c: Quad = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  const score = [Infinity, -Infinity, -Infinity, Infinity];
  for (let p = 0; p < n; p++) {
    if (label[p] !== bestLabel) continue;
    const x = p % w;
    const y = (p - x) / w;
    // Outermost points along the diagonals are the corners of a quadrilateral
    // that is roughly upright, which a photographed page is.
    if (x + y < score[0]) { score[0] = x + y; c[0] = { x, y }; }
    if (x - y > score[1]) { score[1] = x - y; c[1] = { x, y }; }
    if (x + y > score[2]) { score[2] = x + y; c[2] = { x, y }; }
    if (x - y < score[3]) { score[3] = x - y; c[3] = { x, y }; }
  }
  // Pulled a hair towards the middle, because a corner a pixel outside the
  // sheet leaves a dotted line of table down the edge of the scan, and one a
  // pixel inside loses nothing anyone wrote.
  const cx = (c[0].x + c[1].x + c[2].x + c[3].x) / 4;
  const cy = (c[0].y + c[1].y + c[2].y + c[3].y) / 4;
  return c.map((p) => ({ x: (p.x + 0.5 + (cx - p.x) * 0.012) / w, y: (p.y + 0.5 + (cy - p.y) * 0.012) / h })) as Quad;
}

/** The default when no sheet is found: the whole photo, just inside the edge. */
export const WHOLE: Quad = [{ x: 0.01, y: 0.01 }, { x: 0.99, y: 0.01 }, { x: 0.99, y: 0.99 }, { x: 0.01, y: 0.99 }];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** The size the flattened page should be, from the lengths of its sides. */
export function outputSize(q: Quad, max: number): { width: number; height: number } {
  const w = Math.max(dist(q[0], q[1]), dist(q[3], q[2]));
  const h = Math.max(dist(q[0], q[3]), dist(q[1], q[2]));
  const s = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
}

/** Solve A x = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

/**
 * The 3x3 projective map taking each `from` corner onto the matching `to`
 * corner, as nine numbers with the last fixed at 1.
 */
export function homography(from: Quad, to: Quad): number[] {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i];
    const { x: u, y: v } = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return [...solve(A, b), 1];
}

export function apply(H: number[], x: number, y: number): Pt {
  const d = H[6] * x + H[7] * y + H[8];
  return { x: (H[0] * x + H[1] * y + H[2]) / d, y: (H[3] * x + H[4] * y + H[5]) / d };
}

/**
 * The quadrilateral `q` (in pixels of `src`) flattened into a width x height
 * rectangle. Each output pixel is mapped back into the photo and sampled
 * between its four neighbours.
 */
export function warp(src: Pixels, q: Quad, width: number, height: number): Pixels {
  const rect: Quad = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  const H = homography(rect, q);
  const out = new Uint8ClampedArray(width * height * 4);
  const { data, width: sw, height: sh } = src;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = apply(H, x + 0.5, y + 0.5);
      const fx = Math.min(sw - 1.001, Math.max(0, p.x - 0.5));
      const fy = Math.min(sh - 1.001, Math.max(0, p.y - 0.5));
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const ax = fx - x0;
      const ay = fy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sw * 4;
      const i11 = i01 + 4;
      const o = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = data[i00 + c] * (1 - ax) + data[i10 + c] * ax;
        const bot = data[i01 + c] * (1 - ax) + data[i11 + c] * ax;
        out[o + c] = top * (1 - ay) + bot * ay;
      }
      out[o + 3] = 255;
    }
  }
  return { data: out, width, height };
}

/**
 * Paper made white and ink made dark.
 *
 * color  each channel stretched so the page's own white becomes white
 * gray   the same on brightness alone
 * bw     Bradley's local threshold: a pixel is ink when it is clearly darker
 *        than the average around it, which keeps a shadowed corner legible
 */
export function clean(img: Pixels, filter: Filter): Pixels {
  const { data, width: w, height: h } = img;
  const n = w * h;
  const out = new Uint8ClampedArray(data.length);

  if (filter === 'bw') {
    const g = new Float64Array(n);
    for (let p = 0; p < n; p++) g[p] = lum(data, p * 4);
    // Integral image, one row and column larger so lookups need no edge cases.
    const W = w + 1;
    const I = new Float64Array(W * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += g[y * w + x];
        I[(y + 1) * W + x + 1] = I[y * W + x + 1] + row;
      }
    }
    const r = Math.max(4, Math.round(Math.max(w, h) / 32));
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r);
        const x1 = Math.min(w, x + r + 1);
        const sum = I[y1 * W + x1] - I[y0 * W + x1] - I[y1 * W + x0] + I[y0 * W + x0];
        const mean = sum / ((x1 - x0) * (y1 - y0));
        const v = g[y * w + x] < mean * 0.85 ? 0 : 255;
        const o = (y * w + x) * 4;
        out[o] = out[o + 1] = out[o + 2] = v;
        out[o + 3] = 255;
      }
    }
    return { data: out, width: w, height: h };
  }

  // Levels from the histogram: the darkest 1% becomes black and the
  // brightest 5% white, the paper being most of the page.
  const level = (values: (p: number) => number) => {
    const hist = new Array(256).fill(0);
    for (let p = 0; p < n; p++) hist[Math.round(values(p))]++;
    let lo = 0;
    let hi = 255;
    for (let acc = 0; lo < 255 && (acc += hist[lo]) < n * 0.01; lo++);
    for (let acc = 0; hi > 0 && (acc += hist[hi]) < n * 0.05; hi--);
    if (hi - lo < 32) { lo = 0; hi = 255; }
    return { lo, span: hi - lo };
  };
  if (filter === 'gray') {
    const { lo, span } = level((p) => lum(data, p * 4));
    for (let p = 0; p < n; p++) {
      const v = ((lum(data, p * 4) - lo) / span) * 255;
      const o = p * 4;
      out[o] = out[o + 1] = out[o + 2] = v;
      out[o + 3] = 255;
    }
    return { data: out, width: w, height: h };
  }
  const levels = [0, 1, 2].map((c) => level((p) => data[p * 4 + c]));
  for (let p = 0; p < n; p++) {
    const o = p * 4;
    for (let c = 0; c < 3; c++) out[o + c] = ((data[o + c] - levels[c].lo) / levels[c].span) * 255;
    out[o + 3] = 255;
  }
  return { data: out, width: w, height: h };
}
