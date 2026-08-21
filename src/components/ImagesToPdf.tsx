'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';

/**
 * Images into one PDF, in the order you choose.
 *
 * pdf-lib embeds JPEG and PNG directly, so those two go in without being
 * re-encoded and lose nothing. Anything else the browser can decode, WebP and
 * AVIF included, is drawn to a canvas and turned into a JPEG first, because
 * pdf-lib cannot embed them and refusing the file would be worse than one
 * re-encode.
 *
 * Page size defaults to fitting each image rather than forcing A4. Forcing a
 * paper size on a set of photographs leaves white margins on every page, which
 * is rarely what somebody combining screenshots wants. A4 and Letter are there
 * for when the PDF is going to be printed.
 */

type Item = { id: string; file: File; url: string; w: number; h: number };

const SIZES = {
  fit: { label: 'Fit each image', dims: null },
  a4: { label: 'A4', dims: [595.28, 841.89] as [number, number] },
  letter: { label: 'Letter', dims: [612, 792] as [number, number] },
};
type SizeKey = keyof typeof SIZES;

let counter = 0;

export default function ImagesToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [size, setSize] = useState<SizeKey>('fit');
  const [landscape, setLandscape] = useState(false);
  const [margin, setMargin] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  useEffect(() => () => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
  }, []);
  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const add = useCallback(async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;

    const next: Item[] = [];
    for (const file of imgs) {
      const url = URL.createObjectURL(file);
      const bitmap = await createImageBitmap(file).catch(() => null);
      if (!bitmap) { URL.revokeObjectURL(url); continue; }
      next.push({ id: `i${counter++}`, file, url, w: bitmap.width, h: bitmap.height });
      bitmap.close();
    }
    setItems((p) => [...p, ...next]);
  }, []);

  const move = (from: number, to: number) =>
    setItems((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const remove = (id: string) =>
    setItems((p) => {
      const gone = p.find((x) => x.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return p.filter((x) => x.id !== id);
    });

  /** pdf-lib embeds JPEG and PNG only, so everything else becomes a JPEG. */
  async function bytesFor(file: File): Promise<{ data: ArrayBuffer; kind: 'jpg' | 'png' }> {
    if (file.type === 'image/jpeg') return { data: await file.arrayBuffer(), kind: 'jpg' };
    if (file.type === 'image/png') return { data: await file.arrayBuffer(), kind: 'png' };

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) throw new Error('could not convert');
    return { data: await blob.arrayBuffer(), kind: 'jpg' };
  }

  const build = useCallback(async () => {
    if (!items.length) return;
    setBusy('Building');
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (let i = 0; i < items.length; i++) {
        setBusy(`Adding image ${i + 1} of ${items.length}`);
        const { data, kind } = await bytesFor(items[i].file);
        const img = kind === 'jpg' ? await pdf.embedJpg(data) : await pdf.embedPng(data);

        if (size === 'fit') {
          const page = pdf.addPage([img.width + margin * 2, img.height + margin * 2]);
          page.drawImage(img, { x: margin, y: margin, width: img.width, height: img.height });
        } else {
          const [w, h] = SIZES[size].dims!;
          const [pw, ph] = landscape ? [h, w] : [w, h];
          const page = pdf.addPage([pw, ph]);
          const room = { w: pw - margin * 2, h: ph - margin * 2 };
          // Contain rather than cover, so nothing is cropped off the page.
          const scale = Math.min(room.w / img.width, room.h / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
    } catch {
      setError('Something went wrong building the PDF.');
    } finally {
      setBusy(null);
    }
  }, [items, size, landscape, margin]);

  if (!items.length) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void add(e.dataTransfer.files); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop your images here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          JPG, PNG, WebP, AVIF, GIF or HEIC. Drag them into order afterwards.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="order-1 min-w-0 lg:order-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm tabular-nums text-ink-soft">
            {items.length} image{items.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-3 text-sm">
            <button onClick={() => inputRef.current?.click()} className="text-accent underline underline-offset-4">
              Add more
            </button>
            <button
              onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); }}
              className="text-ink-faint underline underline-offset-4"
            >
              Clear
            </button>
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it, i) => (
            <li key={it.id} className="relative overflow-hidden rounded-lg border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" className="block aspect-[4/3] w-full object-contain" />
              <span className="block truncate px-2 py-1.5 text-xs text-ink-faint">
                {i + 1}. {it.w}×{it.h}
              </span>
              <span className="absolute right-1 top-1 flex gap-0.5">
                <button onClick={() => move(i, i - 1)} aria-label="Move earlier"
                  className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent">‹</button>
                <button onClick={() => move(i, i + 1)} aria-label="Move later"
                  className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent">›</button>
                <button onClick={() => remove(it.id)} aria-label="Remove"
                  className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent">×</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-2 rounded-2xl border border-line bg-surface p-5 shadow-sm lg:order-1 lg:sticky lg:top-20">
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Page size
        </span>
        <div className="mt-2 space-y-1.5">
          {(Object.keys(SIZES) as SizeKey[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="radio" name="size" checked={size === k} onChange={() => setSize(k)} />
              {SIZES[k].label}
            </label>
          ))}
        </div>

        {size !== 'fit' && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={landscape} onChange={(e) => setLandscape(e.target.checked)} />
            Landscape
          </label>
        )}

        <label className="mt-5 block text-sm">
          <span className="flex justify-between">
            Margin
            <span className="tabular-nums text-ink-faint">{margin}pt</span>
          </span>
          <input
            type="range" min={0} max={72} step={6}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </label>

        <button
          onClick={() => void build()}
          disabled={busy !== null}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ?? 'Build PDF'}
        </button>

        {outUrl && (
          <DownloadButton href={outUrl} filename="images.pdf" variant="quiet">
            Download PDF
          </DownloadButton>
        )}

        {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
