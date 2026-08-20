'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Makes the whole set of icons a site needs, from one picture.
 *
 * The reason this is a tool rather than one export is that no single file
 * works everywhere. A browser tab wants a tiny ICO, an iPhone home screen
 * wants a 180px PNG, Android wants 192 and 512, and each of them silently
 * falls back to something ugly when the file is missing.
 *
 * The ICO is assembled here rather than by a library. An ICO is a six byte
 * header, one sixteen byte entry per size, and the image data, and since
 * Vista that data may be a PNG. So the sizes are drawn to canvas, encoded as
 * PNG by the browser, and wrapped in the container.
 */

const PNG_SIZES = [
  { size: 512, name: 'icon-512.png', what: 'Android, and the install prompt' },
  { size: 192, name: 'icon-192.png', what: 'Android home screen' },
  { size: 180, name: 'apple-touch-icon.png', what: 'iPhone and iPad home screen' },
  { size: 32, name: 'favicon-32.png', what: 'the browser tab' },
  { size: 16, name: 'favicon-16.png', what: 'the browser tab, small' },
];

const ICO_SIZES = [16, 32, 48];

const SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`;

type Made = { name: string; url: string; blob: Blob; size: number; what: string };

function drawTo(img: HTMLImageElement, size: number, background: string | null, padding: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }

  // Contain rather than cover, because a logo cropped to a square loses the
  // part that made it recognisable at 16 pixels.
  const inner = size * (1 - padding / 100);
  const scale = Math.min(inner / img.naturalWidth, inner / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return canvas;
}

async function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

/** Wraps PNGs in an ICO container. */
async function buildIco(pngs: { size: number; bytes: ArrayBuffer }[]): Promise<Blob> {
  const header = new ArrayBuffer(6 + pngs.length * 16);
  const view = new DataView(header);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // 1 means icon
  view.setUint16(4, pngs.length, true);

  let offset = header.byteLength;
  pngs.forEach((png, i) => {
    const at = 6 + i * 16;
    // 256 is written as 0, which is the quirk that breaks hand rolled writers.
    view.setUint8(at, png.size >= 256 ? 0 : png.size);
    view.setUint8(at + 1, png.size >= 256 ? 0 : png.size);
    view.setUint8(at + 2, 0); // colours in palette
    view.setUint8(at + 3, 0); // reserved
    view.setUint16(at + 4, 1, true); // colour planes
    view.setUint16(at + 6, 32, true); // bits per pixel
    view.setUint32(at + 8, png.bytes.byteLength, true);
    view.setUint32(at + 12, offset, true);
    offset += png.bytes.byteLength;
  });

  return new Blob([header, ...pngs.map((p) => p.bytes)], { type: 'image/x-icon' });
}

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`;
}

export default function FaviconGenerator() {
  const [made, setMade] = useState<Made[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [padding, setPadding] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const madeRef = useRef<Made[]>([]);
  madeRef.current = made;
  useEffect(
    () => () => {
      madeRef.current.forEach((m) => URL.revokeObjectURL(m.url));
    },
    [],
  );

  const build = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    try {
      const out: Made[] = [];

      const icoParts: { size: number; bytes: ArrayBuffer }[] = [];
      for (const size of ICO_SIZES) {
        const blob = await toPng(drawTo(img, size, background, padding));
        icoParts.push({ size, bytes: await blob.arrayBuffer() });
      }
      const ico = await buildIco(icoParts);
      out.push({
        name: 'favicon.ico',
        url: URL.createObjectURL(ico),
        blob: ico,
        size: ico.size,
        what: 'the browser tab, and every old browser',
      });

      for (const p of PNG_SIZES) {
        const blob = await toPng(drawTo(img, p.size, background, padding));
        out.push({
          name: p.name,
          url: URL.createObjectURL(blob),
          blob,
          size: blob.size,
          what: p.what,
        });
      }

      setMade((prev) => {
        prev.forEach((m) => URL.revokeObjectURL(m.url));
        return out;
      });
    } catch {
      setError('Those icons could not be made from this picture.');
    } finally {
      setBusy(false);
    }
  }, [background, padding]);

  const load = useCallback(
    async (file: File) => {
      setError(null);
      setName(file.name);
      const url = URL.createObjectURL(file);
      const img = new Image();
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('bad image'));
          img.src = url;
        });
        imgRef.current = img;
        await build();
      } catch {
        setError('That file could not be read as an image.');
      }
    },
    [build],
  );

  // Rebuild when the padding or background changes, but only once a picture
  // has actually been chosen.
  useEffect(() => {
    if (imgRef.current) void build();
  }, [build]);

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const m of made) zip.file(m.name, m.blob);
    zip.file('head.html', SNIPPET);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicons.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  if (made.length === 0 && !busy) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void load(f); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop your logo here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          A square picture works best. PNG, JPG or SVG.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a picture
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button onClick={() => void downloadAll()} className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink">
            Download all as a zip
          </button>
          <button
            onClick={() => { setMade([]); imgRef.current = null; setName(null); }}
            className="text-ink-faint underline underline-offset-4"
          >
            Use another picture
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-6">
        <label className="block text-sm">
          <span className="flex justify-between gap-6">
            Padding
            <span className="tabular-nums text-ink-faint">{padding}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="mt-1.5 w-48 accent-[var(--accent)]"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={background !== null}
            onChange={(e) => setBackground(e.target.checked ? '#ffffff' : null)}
            className="size-4 accent-[var(--accent)]"
          />
          Solid background
        </label>
        {background !== null && (
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="size-10 cursor-pointer rounded-lg border border-line bg-surface"
          />
        )}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {made.map((m) => (
          <li key={m.name} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.name} className="size-12 shrink-0 rounded object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm">{m.name}</p>
              <p className="truncate text-xs text-ink-faint">{m.what}</p>
            </div>
            <a
              href={m.url}
              download={m.name}
              className="shrink-0 text-xs text-accent underline underline-offset-4"
            >
              {formatBytes(m.size)}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Put this in your head tag
          </span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(SNIPPET);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-sm text-accent underline underline-offset-4"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed">
          {SNIPPET}
        </pre>
      </div>
    </div>
  );
}
