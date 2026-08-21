'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';

/**
 * Every page of a PDF as an image, at a resolution you choose.
 *
 * Rendered with pdf.js, which is the same engine Firefox uses to display PDFs,
 * so what comes out matches what a browser would show rather than an
 * approximation of it.
 *
 * Scale rather than DPI in the interface, because a PDF page has no inherent
 * pixel size. A page is measured in points, 72 to the inch, so scale 2 gives
 * 144 DPI and scale 4 gives 288, which is about right for print. The labels say
 * both so nobody has to know that.
 */

type Rendered = { page: number; url: string; w: number; h: number; bytes: number };

const SCALES = [
  { value: 1, label: 'Screen', note: '72 DPI' },
  { value: 2, label: 'Retina', note: '144 DPI' },
  { value: 3, label: 'Large', note: '216 DPI' },
  { value: 4, label: 'Print', note: '288 DPI' },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfToImages({ format }: { format: 'png' | 'jpg' }) {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(2);
  const [pages, setPages] = useState<Rendered[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pagesRef = useRef<Rendered[]>([]);
  pagesRef.current = pages;
  useEffect(() => () => { pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)); }, []);

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';

  const render = useCallback(
    async (f: File, atScale: number) => {
      setBusy('Reading');
      setError(null);
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      setPages([]);

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
        const out: Rendered[] = [];

        for (let i = 1; i <= doc.numPages; i++) {
          setBusy(`Rendering page ${i} of ${doc.numPages}`);
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: atScale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;

          // JPEG has no alpha, and a PDF page is transparent where nothing is
          // drawn. Without a white ground the margins come out black.
          if (format === 'jpg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          await page.render({ canvas, canvasContext: ctx, viewport }).promise;

          const blob = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, mime, format === 'jpg' ? 0.92 : undefined),
          );
          if (!blob) throw new Error('render failed');

          out.push({
            page: i,
            url: URL.createObjectURL(blob),
            w: canvas.width,
            h: canvas.height,
            bytes: blob.size,
          });
          setPages([...out]);
        }
      } catch (e) {
        setError(
          e instanceof Error && /password|encrypt/i.test(e.message)
            ? 'That PDF is password protected. Remove the password first.'
            : 'That file could not be read as a PDF.',
        );
      } finally {
        setBusy(null);
      }
    },
    [format, mime],
  );

  const pick = (f: File) => { setFile(f); void render(f, scale); };

  const downloadZip = useCallback(async () => {
    // Null rather than a bare return: the button treats null as nothing to
    // save, and an undefined would not match the type it expects.
    if (!pages.length) return null;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const base = (file?.name ?? 'pdf').replace(/\.pdf$/i, '');
      for (const p of pages) {
        zip.file(`${base}-${String(p.page).padStart(3, '0')}.${format}`,
          await (await fetch(p.url)).blob());
      }
      const out = await zip.generateAsync({ type: 'blob' });
      return out;
    } finally {
      setZipping(false);
    }
  }, [pages, file, format]);

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a PDF here</p>
        <p className="mt-1 text-sm text-ink-soft">
          Every page comes back as a {format.toUpperCase()}.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {busy ?? `${pages.length} page${pages.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          onClick={() => { setFile(null); setPages([]); }}
          className="text-sm text-ink-faint underline underline-offset-4"
        >
          Use another PDF
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Resolution
        </span>
        {SCALES.map((s) => (
          <button
            key={s.value}
            disabled={busy !== null}
            onClick={() => { setScale(s.value); void render(file, s.value); }}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              s.value === scale
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {s.label}
            <span className="ml-1.5 text-xs text-ink-faint">{s.note}</span>
          </button>
        ))}
      </div>

      {pages.length > 1 && (
        <DownloadButton prepare={downloadZip} filename={`${(file?.name ?? 'pdf').replace(/\.pdf$/i, '')}-${format}.zip`}>
          {`Download all ${pages.length} as a zip`}
        </DownloadButton>
      )}

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {pages.map((p) => (
          <li key={p.page} className="overflow-hidden rounded-lg border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Page ${p.page}`} className="block w-full" />
            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
              <span className="text-xs tabular-nums text-ink-faint">
                {p.w}×{p.h} · {formatBytes(p.bytes)}
              </span>
              <DownloadButton href={p.url} filename={`${(file.name).replace(/\.pdf$/i, '')}-${String(p.page).padStart(3, '0')}.${format}`}>
                Save
              </DownloadButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
