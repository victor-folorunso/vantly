'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import DropIcon from '@/components/DropIcon';
import ToolLayout from '@/components/ToolLayout';
import { clean, findPaper, outputSize, warp, WHOLE, type Filter, type Pixels, type Quad } from '@/lib/scan';

/**
 * Phone photos of paper into a PDF that reads like a scan.
 *
 * Each photo is searched for the sheet in it, and the four corners are put
 * where the sheet's corners are. They can be dragged when the guess is off.
 * The sheet is then flattened, not just cropped: a page photographed at an
 * angle comes out rectangular, with its lines straight.
 *
 * Everything happens here in the browser. Photos of letters, forms and IDs
 * are exactly the kind of thing that should not be uploaded to be tidied up.
 */

type Turn = 0 | 90 | 180 | 270;
type Page = {
  id: number;
  name: string;
  /** Up to 3000px, kept for the final pages. */
  full: ImageBitmap;
  /** Up to 900px, as pixels, for the quick previews. */
  small: Pixels;
  /** A display copy of the photo. */
  url: string;
  ratio: number;
  quad: Quad;
  found: Quad | null;
  turn: Turn;
};

type Size = 'fit' | 'a4' | 'letter';
const SIZES: Record<Size, { label: string; w: number; h: number }> = {
  fit: { label: 'Same shape as the page', w: 0, h: 0 },
  a4: { label: 'A4', w: 595.28, h: 841.89 },
  letter: { label: 'US Letter', w: 612, h: 792 },
};
const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: 'color', label: 'Colour', hint: 'Whitened paper, colours kept. For anything with stamps, photos or highlighter.' },
  { id: 'gray', label: 'Greyscale', hint: 'Smaller files, still soft enough for pencil and faint print.' },
  { id: 'bw', label: 'Black and white', hint: 'Like a photocopy. The sharpest text and the smallest file, and shadows drop out.' },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

let nextId = 1;

function canvasOf(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function scaled(src: CanvasImageSource, w: number, h: number, max: number) {
  const s = Math.min(1, max / Math.max(w, h));
  const c = canvasOf(Math.round(w * s), Math.round(h * s));
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return { c, ctx };
}

const toPixels = (q: Quad, w: number, h: number) => q.map((p) => ({ x: p.x * w, y: p.y * h })) as Quad;

/** A flattened, cleaned page as a canvas, turned the way it should read. */
function render(src: Pixels, quad: Quad, filter: Filter, turn: Turn, max: number): HTMLCanvasElement {
  const q = toPixels(quad, src.width, src.height);
  const size = outputSize(q, max);
  const page = clean(warp(src, q, size.width, size.height), filter);
  const flat = canvasOf(page.width, page.height);
  flat.getContext('2d')!.putImageData(new ImageData(page.data as Uint8ClampedArray<ArrayBuffer>, page.width, page.height), 0, 0);
  if (!turn) return flat;
  const side = turn % 180 !== 0;
  const out = canvasOf(side ? page.height : page.width, side ? page.width : page.height);
  const ctx = out.getContext('2d')!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((turn * Math.PI) / 180);
  ctx.drawImage(flat, -page.width / 2, -page.height / 2);
  flat.width = flat.height = 0;
  return out;
}

async function decode(file: File): Promise<Blob> {
  if (/\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type)) {
    const { heicTo } = await import('heic-to');
    return heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 });
  }
  return file;
}

async function load(file: File): Promise<Page> {
  // createImageBitmap applies the camera's orientation flag, so a portrait
  // photo arrives upright.
  const bitmap = await createImageBitmap(await decode(file));
  const { width: w, height: h } = bitmap;
  const big = scaled(bitmap, w, h, 3000);
  const full = await createImageBitmap(big.c);
  big.c.width = big.c.height = 0;
  bitmap.close();

  const small = scaled(full, full.width, full.height, 900);
  const pixels: Pixels = { data: small.ctx.getImageData(0, 0, small.c.width, small.c.height).data, width: small.c.width, height: small.c.height };
  const tiny = scaled(full, full.width, full.height, 360);
  const found = findPaper({ data: tiny.ctx.getImageData(0, 0, tiny.c.width, tiny.c.height).data, width: tiny.c.width, height: tiny.c.height });
  const blob = await new Promise<Blob | null>((r) => small.c.toBlob(r, 'image/jpeg', 0.85));
  small.c.width = small.c.height = tiny.c.width = tiny.c.height = 0;
  return {
    id: nextId++,
    name: file.name,
    full,
    small: pixels,
    url: blob ? URL.createObjectURL(blob) : '',
    ratio: full.width / full.height,
    quad: found ?? WHOLE,
    found,
    turn: 0,
  };
}

/* ── The corner editor ─────────────────────────────────────────────────── */

function Corners({ page, onChange }: { page: Page; onChange: (q: Quad) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const [zoom, setZoom] = useState<{ i: number; x: number; y: number; w: number; h: number } | null>(null);

  const at = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };
  const move = (e: React.PointerEvent) => {
    if (drag.current === null) return;
    const p = at(e);
    const q = [...page.quad] as Quad;
    q[drag.current] = p;
    onChange(q);
    setZoom({ i: drag.current, ...p, w: box.current!.clientWidth, h: box.current!.clientHeight });
  };
  const end = () => { drag.current = null; setZoom(null); };
  const pts = page.quad.map((p) => `${p.x * 1000},${p.y * 1000}`).join(' ');

  return (
    <div
      ref={box}
      className="relative mx-auto w-full touch-none select-none"
      style={{ aspectRatio: String(page.ratio), maxHeight: '70vh', maxWidth: `calc(70vh * ${page.ratio})` }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={page.url} alt={page.name} draggable={false} className="block size-full rounded-lg" />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
        <path d={`M0 0H1000V1000H0Z M${pts.split(' ').join(' L')}Z`} fill="rgba(0,0,0,0.45)" fillRule="evenodd" />
        <polygon points={pts} fill="none" stroke="var(--color-accent, #f97316)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      </svg>
      {page.quad.map((p, i) => (
        <button
          key={i}
          type="button"
          aria-label={['Top left', 'Top right', 'Bottom right', 'Bottom left'][i] + ' corner'}
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-accent/80 shadow-md active:cursor-grabbing"
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          onPointerDown={(e) => {
            drag.current = i;
            try { box.current?.setPointerCapture(e.pointerId); } catch {}
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.02 : 0.004;
            const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
            if (!d) return;
            e.preventDefault();
            const q = [...page.quad] as Quad;
            q[i] = { x: Math.max(0, Math.min(1, p.x + d[0])), y: Math.max(0, Math.min(1, p.y + d[1])) };
            onChange(q);
          }}
        />
      ))}
      {zoom && (
        // A magnified view of the corner under the finger, which would
        // otherwise hide exactly the spot being placed.
        <div
          className="pointer-events-none absolute size-28 overflow-hidden rounded-full border-2 border-white shadow-lg"
          style={{
            left: zoom.x > 0.5 ? '8px' : undefined,
            right: zoom.x > 0.5 ? undefined : '8px',
            top: '8px',
            backgroundImage: `url(${page.url})`,
            backgroundSize: `${zoom.w * 3}px ${zoom.h * 3}px`,
            backgroundPosition: `${-(zoom.x * zoom.w * 3 - 56)}px ${-(zoom.y * zoom.h * 3 - 56)}px`,
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

/* ── The tool ─────────────────────────────────────────────────────────── */

export default function ScanToPdf() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('color');
  const [size, setSize] = useState<Size>('fit');
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const thumbKeys = useRef<Record<number, string>>({});

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  const add = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|avif)$/i.test(f.name));
    if (!list.length) { setError('Those are not photos. Use JPG, PNG, WebP or HEIC.'); return; }
    setError(null);
    const failed: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setBusy(`Reading photo ${i + 1} of ${list.length}`);
      try {
        const page = await load(list[i]);
        setPages((p) => [...p, page]);
        setSelected((s) => s ?? page.id);
      } catch {
        failed.push(list[i].name);
      }
    }
    setBusy(null);
    setOut(null);
    if (failed.length) setError(`${failed.join(', ')} could not be read.`);
  }, []);

  // Previews of the finished pages, redrawn shortly after anything that
  // changes them settles, so dragging a corner stays smooth.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next: Record<number, string> = {};
      let changed = false;
      for (const p of pages) {
        const key = `${p.quad.map((c) => `${c.x.toFixed(4)},${c.y.toFixed(4)}`).join(';')}|${p.turn}|${filter}`;
        if (thumbKeys.current[p.id] === key && thumbs[p.id]) { next[p.id] = thumbs[p.id]; continue; }
        const c = render(p.small, p.quad, filter, p.turn, 520);
        next[p.id] = c.toDataURL('image/jpeg', 0.8);
        c.width = c.height = 0;
        thumbKeys.current[p.id] = key;
        changed = true;
      }
      if (changed || Object.keys(next).length !== Object.keys(thumbs).length) setThumbs(next);
    }, 120);
    return () => clearTimeout(timer);
  }, [pages, filter, thumbs]);

  const update = (id: number, patch: Partial<Page>) => {
    setPages((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setOut(null);
  };
  const move = (i: number, d: -1 | 1) => {
    setPages((all) => {
      const j = i + d;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setOut(null);
  };
  const remove = (id: number) => {
    setPages((all) => {
      const gone = all.find((p) => p.id === id);
      if (gone) { gone.full.close(); URL.revokeObjectURL(gone.url); }
      const rest = all.filter((p) => p.id !== id);
      if (selected === id) setSelected(rest[0]?.id ?? null);
      return rest;
    });
    setOut(null);
  };

  const make = async () => {
    setBusy('Making the PDF');
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        setBusy(`Flattening page ${i + 1} of ${pages.length}`);
        await new Promise((r) => setTimeout(r, 0));
        const p = pages[i];
        const src = scaled(p.full, p.full.width, p.full.height, 3000);
        const pixels: Pixels = { data: src.ctx.getImageData(0, 0, src.c.width, src.c.height).data, width: src.c.width, height: src.c.height };
        src.c.width = src.c.height = 0;
        const c = render(pixels, p.quad, filter, p.turn, 2200);
        // Black and white compresses far better as PNG, and JPEG would blur
        // the edges of the letters it exists to make crisp.
        const png = filter === 'bw';
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.82));
        const { width: iw, height: ih } = c;
        c.width = c.height = 0;
        if (!blob) throw new Error('encode');
        const bytes = await blob.arrayBuffer();
        const img = png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

        let pw: number;
        let ph: number;
        if (size === 'fit') {
          // As if the long side were A4's, which keeps text at a sensible
          // printed size whatever the photo's resolution.
          const s = 841.89 / Math.max(iw, ih);
          pw = iw * s;
          ph = ih * s;
        } else {
          const portrait = ih >= iw;
          pw = portrait ? SIZES[size].w : SIZES[size].h;
          ph = portrait ? SIZES[size].h : SIZES[size].w;
        }
        const page = doc.addPage([pw, ph]);
        const s = Math.min(pw / iw, ph / ih);
        page.drawImage(img, { x: (pw - iw * s) / 2, y: (ph - ih * s) / 2, width: iw * s, height: ih * s });
      }
      doc.setTitle(pages.length === 1 ? pages[0].name.replace(/\.[^.]+$/, '') : 'Scan');
      doc.setProducer('Vantly');
      const saved = await doc.save();
      const blob = new Blob([saved as BlobPart], { type: 'application/pdf' });
      setOut((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), size: blob.size };
      });
    } catch {
      setError('Something went wrong making the PDF. Very large photos can run out of memory; try fewer at a time.');
    } finally {
      setBusy(null);
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/*,.heic,.heif"
      multiple
      className="sr-only"
      onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
    />
  );

  if (!pages.length) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void add(e.dataTransfer.files); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <DropIcon />
        <p className="text-lg font-medium">Drop photos of your pages here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          JPG, PNG, WebP or HEIC, straight from the phone. A darker surface behind the paper helps find its edges.
        </p>
        <button onClick={() => input.current?.click()} disabled={busy !== null} className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60">
          {busy ?? 'Choose photos'}
        </button>
        {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        {picker}
      </div>
    );
  }

  const current = pages.find((p) => p.id === selected) ?? pages[0];
  const index = pages.indexOf(current);

  return (
    <ToolLayout
      title="Scan settings"
      settings={
        <>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Look</legend>
            <div className="mt-2 space-y-2">
              {FILTERS.map((f) => (
                <label key={f.id} className="flex gap-2 text-sm">
                  <input type="radio" name="filter" checked={filter === f.id} onChange={() => { setFilter(f.id); setOut(null); }} className="mt-1" />
                  <span>
                    {f.label}
                    <span className="block text-xs leading-relaxed text-ink-faint">{f.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Page size</legend>
            <div className="mt-2 space-y-1.5">
              {(Object.keys(SIZES) as Size[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="size" checked={size === k} onChange={() => { setSize(k); setOut(null); }} />
                  {SIZES[k].label}
                </label>
              ))}
            </div>
          </fieldset>
          <button onClick={() => void make()} disabled={busy !== null} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60">
            {busy ?? `Make PDF of ${pages.length} page${pages.length === 1 ? '' : 's'}`}
          </button>
          {error && <p className="text-xs leading-relaxed text-accent">{error}</p>}
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{pages.length} page{pages.length === 1 ? '' : 's'}</p>
          <p className="text-xs text-ink-faint">Nothing leaves this device.</p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename="scan.pdf">
              Download PDF, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button onClick={() => input.current?.click()} disabled={busy !== null} className="text-sm text-ink-faint underline underline-offset-4">
            Add photos
          </button>
          {picker}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
        <section className="rounded-2xl border border-line bg-surface-alt p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-ink-soft">
              Page {index + 1}: {current.found ? 'drag the corners onto the corners of the paper if they are off.' : 'no sheet found, so the whole photo is used. Drag the corners onto the paper.'}
            </span>
            <span className="flex gap-3">
              {current.found && (
                <button onClick={() => update(current.id, { quad: current.found! })} className="text-ink-faint underline underline-offset-4">Detected edges</button>
              )}
              <button onClick={() => update(current.id, { quad: WHOLE })} className="text-ink-faint underline underline-offset-4">Whole photo</button>
            </span>
          </div>
          <Corners page={current} onChange={(q) => update(current.id, { quad: q })} />
        </section>

        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {pages.map((p, i) => (
            <li key={p.id} className={`rounded-xl border p-2 ${p.id === current.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface'}`}>
              <button onClick={() => setSelected(p.id)} className="block w-full" aria-label={`Edit page ${i + 1}`}>
                {thumbs[p.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[p.id]} alt={`Page ${i + 1} as it will look`} className="mx-auto max-h-56 rounded border border-line bg-white object-contain" />
                ) : (
                  <span className="block h-40 animate-pulse rounded bg-line/40" />
                )}
              </button>
              <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                <span className="tabular-nums text-ink-faint">{i + 1}</span>
                <span className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="rounded border border-line px-1.5 py-0.5 disabled:opacity-30">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label="Move later" className="rounded border border-line px-1.5 py-0.5 disabled:opacity-30">↓</button>
                  <button onClick={() => update(p.id, { turn: (((p.turn + 90) % 360) as Turn) })} aria-label="Turn a quarter clockwise" className="rounded border border-line px-1.5 py-0.5">↻</button>
                  <button onClick={() => remove(p.id)} aria-label="Remove" className="rounded border border-line px-1.5 py-0.5 text-accent">✕</button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </ToolLayout>
  );
}
