'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandoff } from '@/components/useHandoff';
import DownloadButton from '@/components/DownloadButton';

/**
 * Merge, split and extract, which are one operation with different buttons.
 *
 * All three are "choose some pages, in some order, and write a new PDF". Built
 * once so the queue, the thumbnails, the selection and the memory cleanup exist
 * in a single place rather than three.
 *
 * pdf-lib does the writing and pdf.js does the drawing, and both arrive by
 * dynamic import when a file is actually dropped. Together they are around 1MB,
 * which a visitor who lands from a search result and reads the page should
 * never pay for.
 *
 * Everything happens in the browser. That matters more here than on most tools,
 * since the PDFs people merge and sign tend to be contracts and bank statements.
 */

type Mode = 'merge' | 'split' | 'extract';

type Page = {
  id: string;
  /** Which loaded document this page came from. */
  docIndex: number;
  /** Zero based page number inside that document. */
  pageIndex: number;
  label: string;
  thumb?: string;
  selected: boolean;
};

type Loaded = { name: string; bytes: ArrayBuffer };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfPages({ mode }: { mode: Mode }) {
  const [docs, setDocs] = useState<Loaded[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const add = useCallback(
    async (files: FileList | File[]) => {
      const pdfs = Array.from(files).filter(
        (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
      );
      if (!pdfs.length) return;

      setBusy('Reading');
      setError(null);
      try {
        // pdf.js is only needed for the thumbnails, so it loads here rather
        // than at the top of the file.
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        for (const file of pdfs) {
          const bytes = await file.arrayBuffer();
          const docIndex = docs.length + pdfs.indexOf(file);

          // pdf.js takes ownership of the buffer it is given, and pdf-lib needs
          // one later, so it gets a copy.
          const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
          const next: Page[] = [];

          for (let i = 0; i < doc.numPages; i++) {
            const page = await doc.getPage(i + 1);
            const viewport = page.getViewport({ scale: 0.35 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({
              canvas,
              canvasContext: canvas.getContext('2d')!,
              viewport,
            }).promise;

            next.push({
              id: `${docIndex}-${i}`,
              docIndex,
              pageIndex: i,
              label: pdfs.length > 1 ? `${file.name} p${i + 1}` : `Page ${i + 1}`,
              thumb: canvas.toDataURL('image/jpeg', 0.6),
              // Merge takes everything by default. The others start empty, so
              // the first click is a choice rather than an undo.
              selected: mode === 'merge',
            });
          }

          setDocs((d) => [...d, { name: file.name, bytes }]);
          setPages((p) => [...p, ...next]);
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
    [docs.length, mode],
  );

  const toggle = (id: string) =>
    setPages((p) => p.map((x) => (x.id === id ? { ...x, selected: !x.selected } : x)));

  const move = (from: number, to: number) =>
    setPages((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const build = useCallback(async () => {
    const chosen = pages.filter((p) => p.selected);
    if (!chosen.length) return;

    setBusy('Building');
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const out = await PDFDocument.create();

      // Sources are opened once each rather than per page, since a hundred page
      // extraction would otherwise parse the same file a hundred times.
      const sources = new Map<number, Awaited<ReturnType<typeof PDFDocument.load>>>();
      for (const p of chosen) {
        if (!sources.has(p.docIndex)) {
          sources.set(p.docIndex, await PDFDocument.load(docs[p.docIndex].bytes.slice(0)));
        }
      }

      for (const p of chosen) {
        const [copied] = await out.copyPages(sources.get(p.docIndex)!, [p.pageIndex]);
        out.addPage(copied);
      }

      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutSize(blob.size);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setError('Something went wrong writing the PDF.');
    } finally {
      setBusy(null);
    }
  }, [pages, docs]);

  const chosen = pages.filter((p) => p.selected).length;
  const verb = mode === 'merge' ? 'Merge' : mode === 'split' ? 'Split' : 'Extract';

  // Files chosen on the home page, if that is how you arrived.
  useHandoff((files) => {
    void add(files);
  });

  if (pages.length === 0) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void add(e.dataTransfer.files); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">
          {mode === 'merge' ? 'Drop your PDFs here' : 'Drop a PDF here'}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'merge'
            ? 'As many as you like. Drag them into the order you want afterwards.'
            : 'Pick the pages you want on the next screen.'}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          {mode === 'merge' ? 'Choose PDFs' : 'Choose a PDF'}
        </button>
        {busy && <p className="mt-4 text-sm text-ink-faint">{busy}…</p>}
        {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple={mode === 'merge'}
          className="sr-only"
          onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-ink-soft">
          {pages.length} page{pages.length === 1 ? '' : 's'}, {chosen} selected
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <button onClick={() => inputRef.current?.click()} className="text-accent underline underline-offset-4">
            Add more
          </button>
          <button
            onClick={() => setPages((p) => p.map((x) => ({ ...x, selected: true })))}
            className="text-ink-soft underline underline-offset-4"
          >
            Select all
          </button>
          <button
            onClick={() => setPages((p) => p.map((x) => ({ ...x, selected: false })))}
            className="text-ink-soft underline underline-offset-4"
          >
            None
          </button>
          <button
            onClick={() => { setPages([]); setDocs([]); setOutUrl(null); }}
            className="text-ink-faint underline underline-offset-4"
          >
            Clear
          </button>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {pages.map((p, i) => (
          <li key={p.id} className="relative">
            <button
              onClick={() => toggle(p.id)}
              aria-pressed={p.selected}
              className={`block w-full overflow-hidden rounded-lg border-2 bg-surface transition-colors ${
                p.selected ? 'border-accent' : 'border-line hover:border-ink-faint'
              }`}
            >
              {p.thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb} alt="" className="block w-full" />
              )}
              <span className="block truncate px-2 py-1.5 text-xs text-ink-soft">{p.label}</span>
            </button>

            {/* Order only matters when you are building one document out of
                several, so the arrows stay out of the way otherwise. */}
            {mode === 'merge' && (
              <span className="absolute right-1 top-1 flex gap-0.5">
                <button
                  onClick={() => move(i, i - 1)}
                  aria-label="Move earlier"
                  className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent"
                >
                  ‹
                </button>
                <button
                  onClick={() => move(i, i + 1)}
                  aria-label="Move later"
                  className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent"
                >
                  ›
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void build()}
          disabled={!chosen || busy !== null}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ?? `${verb} ${chosen} page${chosen === 1 ? '' : 's'}`}
        </button>

        {outUrl && (
          <DownloadButton href={outUrl} filename={mode === 'merge' ? 'merged.pdf' : 'pages.pdf'} variant="quiet">
            Download PDF, {formatBytes(outSize)}
          </DownloadButton>
        )}

        {error && <p className="text-sm text-accent">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
