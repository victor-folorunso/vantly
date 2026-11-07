'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useHandoff } from '@/components/useHandoff';
import DownloadButton from '@/components/DownloadButton';
import DropIcon from '@/components/DropIcon';

/**
 * Merge, split, extract, delete, organize and rotate, which are one operation
 * with different buttons.
 *
 * All six are "choose some pages, in some order, turned some way, and write a
 * new PDF". Built once so the queue, the thumbnails, the selection and the
 * memory cleanup exist in a single place rather than six.
 *
 * What a selected page means depends on the mode. In merge, organize and
 * rotate every page starts selected and the selection is what is kept. In
 * split and extract nothing starts selected and the selection is what is
 * taken out. In delete nothing starts selected and the selection is what goes.
 *
 * pdf-lib does the writing and pdf.js does the drawing, and both arrive by
 * dynamic import when a file is actually dropped. Together they are around 1MB,
 * which a visitor who lands from a search result and reads the page should
 * never pay for.
 *
 * Everything happens in the browser. That matters more here than on most tools,
 * since the PDFs people merge and sign tend to be contracts and bank statements.
 */

type Mode = 'merge' | 'split' | 'extract' | 'delete' | 'organize' | 'rotate';

/** Modes where every page starts in the output. */
const KEEP_ALL: readonly Mode[] = ['merge', 'organize', 'rotate'];
/** Modes where the order of the pages can be changed. */
const REORDER: readonly Mode[] = ['merge', 'organize'];
/** Modes where pages can be turned. */
const TURN: readonly Mode[] = ['organize', 'rotate'];

const VERB: Record<Mode, string> = {
  merge: 'Merge',
  split: 'Split',
  extract: 'Extract',
  delete: 'Delete',
  organize: 'Save',
  rotate: 'Save',
};

const OUT_NAME: Record<Mode, string> = {
  merge: 'merged',
  split: 'pages',
  extract: 'extracted',
  delete: 'pages-removed',
  organize: 'organized',
  rotate: 'rotated',
};

type Page = {
  id: string;
  /** Which loaded document this page came from. */
  docIndex: number;
  /** Zero based page number inside that document. */
  pageIndex: number;
  label: string;
  thumb?: string;
  selected: boolean;
  /** Clockwise turn added on top of whatever the page already has, 0 to 270. */
  turn: number;
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
              // Merge, organize and rotate take everything by default. The
              // others start empty, so the first click is a choice rather
              // than an undo.
              selected: KEEP_ALL.includes(mode),
              turn: 0,
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

  const turn = (id: string, by: number) =>
    setPages((p) => p.map((x) => (x.id === id ? { ...x, turn: (x.turn + by + 360) % 360 } : x)));

  const turnAll = (by: number) =>
    setPages((p) => p.map((x) => ({ ...x, turn: (x.turn + by + 360) % 360 })));

  const move = (from: number, to: number) =>
    setPages((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const build = useCallback(async () => {
    // Delete writes the pages that were not picked. Everything else writes the
    // ones that were.
    const chosen = pages.filter((p) => (mode === 'delete' ? !p.selected : p.selected));
    if (!chosen.length) return;

    setBusy('Building');
    setError(null);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
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
        // Added to the page's own rotation, so a scan that was already marked
        // as turned keeps that and gains this.
        if (p.turn) copied.setRotation(degrees((copied.getRotation().angle + p.turn) % 360));
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
  }, [pages, docs, mode]);

  const selected = pages.filter((p) => p.selected).length;
  const writes = mode === 'delete' ? pages.length - selected : selected;
  const turned = pages.filter((p) => p.turn).length;
  const verb = VERB[mode];
  const buttonLabel =
    mode === 'delete'
      ? `Delete ${selected} page${selected === 1 ? '' : 's'}`
      : mode === 'rotate'
        ? `Save with ${turned} page${turned === 1 ? '' : 's'} turned`
        : mode === 'organize'
          ? `Save ${writes} page${writes === 1 ? '' : 's'}`
          : `${verb} ${selected} page${selected === 1 ? '' : 's'}`;
  // Nothing to write, or a delete that would leave an empty file.
  const blocked = !writes || (mode === 'rotate' && !turned);

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
        <DropIcon />
        <p className="text-lg font-medium">
          {mode === 'merge' ? 'Drop your PDFs here' : 'Drop a PDF here'}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'merge'
            ? 'As many as you like. Drag them into the order you want afterwards.'
            : mode === 'delete'
              ? 'Pick the pages to remove on the next screen.'
              : mode === 'rotate'
                ? 'Turn the pages that need it on the next screen.'
                : mode === 'organize'
                  ? 'Reorder, turn and remove pages on the next screen.'
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
    <ToolLayout
      title={mode === 'rotate' ? 'Rotation' : 'Selection'}
      settings={
        <>
          {TURN.includes(mode) && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => turnAll(-90)}
                className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent"
              >
                ↺ All left
              </button>
              <button
                onClick={() => turnAll(90)}
                className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent"
              >
                All right ↻
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {mode === 'merge' && (
              <button onClick={() => inputRef.current?.click()} className="text-accent underline underline-offset-4">
                Add more
              </button>
            )}
            {mode !== 'rotate' && (
            <>
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
            </>
            )}
            <button
              onClick={() => { setPages([]); setDocs([]); setOutUrl(null); }}
              className="text-ink-faint underline underline-offset-4"
            >
              Clear
            </button>
          </div>

          <button
            onClick={() => void build()}
            disabled={blocked || busy !== null}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? buttonLabel}
          </button>
          {mode === 'delete' && pages.length > 0 && selected === pages.length && (
            <p className="text-xs leading-relaxed text-ink-faint">
              That is every page. A PDF needs at least one left.
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink-faint">
            {mode === 'delete' && 'Click the pages to remove. They turn red.'}
            {mode === 'rotate' && 'Click a page to turn it a quarter clockwise. The arrow in its corner turns it back.'}
            {mode === 'organize' && 'Click a page to leave it out. Arrows move and turn it.'}
            {(mode === 'split' || mode === 'extract') && 'Click the pages you want in the new file.'}
          </p>
        </>
      }
      status={
        <span className="tabular-nums">
          {pages.length} page{pages.length === 1 ? '' : 's'}
          {mode === 'rotate'
            ? `, ${turned} turned`
            : mode === 'delete'
              ? `, ${selected} to remove`
              : mode === 'organize'
                ? `, ${writes} kept`
                : `, ${selected} selected`}
        </span>
      }
      actions={
        <>
          {outUrl && (
            <DownloadButton href={outUrl} filename={`${OUT_NAME[mode]}.pdf`} variant="quiet">
              Download PDF, {formatBytes(outSize)}
            </DownloadButton>
          )}
        </>
      }
    >
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {pages.map((p, i) => (
          <li key={p.id} className="relative">
            <button
              onClick={() => (mode === 'rotate' ? turn(p.id, 90) : toggle(p.id))}
              aria-pressed={mode === 'rotate' ? undefined : p.selected}
              aria-label={mode === 'rotate' ? `${p.label}, turn clockwise` : undefined}
              className={`block w-full overflow-hidden rounded-lg border-2 bg-surface transition-colors ${
                mode === 'rotate'
                  ? p.turn
                    ? 'border-accent'
                    : 'border-line hover:border-ink-faint'
                  : mode === 'delete'
                    ? p.selected
                      ? 'border-red-500 opacity-50'
                      : 'border-line hover:border-ink-faint'
                    : mode === 'organize'
                      ? p.selected
                        ? 'border-line hover:border-ink-faint'
                        : 'border-dashed border-line opacity-40'
                      : p.selected
                        ? 'border-accent'
                        : 'border-line hover:border-ink-faint'
              }`}
            >
              {p.thumb && (
                /* Square, so a quarter turn still fits: a page and its turned
                   self both sit inside the same box. */
                <span className="relative block aspect-square bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb}
                    alt=""
                    className="absolute inset-1 m-auto max-h-[calc(100%-0.5rem)] max-w-[calc(100%-0.5rem)] transition-transform duration-200"
                    style={{ transform: `rotate(${p.turn}deg)` }}
                  />
                </span>
              )}
              <span className="block truncate px-2 py-1.5 text-xs text-ink-soft">
                {p.label}
                {p.turn ? ` · ${p.turn}°` : ''}
              </span>
            </button>

            {mode === 'rotate' && p.turn !== 0 && (
              <button
                onClick={() => turn(p.id, -90)}
                aria-label="Turn back"
                className="absolute left-1 top-1 grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent"
              >
                ↺
              </button>
            )}

            {/* Order only matters when you are building one document out of
                several, so the arrows stay out of the way otherwise. */}
            {REORDER.includes(mode) && (
              <span className="absolute right-1 top-1 flex gap-0.5">
                {mode === 'organize' && (
                  <button
                    onClick={() => turn(p.id, 90)}
                    aria-label="Turn clockwise"
                    className="grid size-6 place-items-center rounded bg-ground/90 text-ink-soft hover:text-accent"
                  >
                    ↻
                  </button>
                )}
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
      {error && <p className="text-sm text-accent">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ''; }}
      />
    </ToolLayout>
  );
}
