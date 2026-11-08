'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import PdfDrop from '@/components/PdfDrop';
import { loadPdfJs } from '@/lib/pdfRaster';

/**
 * Crop PDF pages by trimming each edge.
 *
 * The crop is a percentage of the page rather than a fixed distance, so a
 * document with pages of different sizes is trimmed in proportion, and it is
 * written as the page's CropBox. That is how every PDF reader decides what to
 * show and print, and it is lossless: nothing is re-encoded.
 *
 * Which also means it is not redaction. The trimmed area is hidden, not
 * deleted, and a PDF editor can bring it back. The page says so, and points
 * at Redact PDF for anything that has to be gone.
 *
 * Margins are set as the reader sees the page. A page stored sideways and
 * displayed upright has its edges mapped back to the stored orientation, or
 * cropping the top of a turned scan would trim its side.
 */

type Edges = { top: number; right: number; bottom: number; left: number };
const NONE: Edges = { top: 0, right: 0, bottom: 0, left: 0 };

/** Visual edges to the page's own edges, for a page displayed with /Rotate r. */
function toPageEdges(e: Edges, r: number): Edges {
  if (r === 90) return { left: e.top, top: e.right, right: e.bottom, bottom: e.left };
  if (r === 180) return { left: e.right, right: e.left, top: e.bottom, bottom: e.top };
  if (r === 270) return { right: e.top, bottom: e.right, left: e.bottom, top: e.left };
  return e;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [count, setCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [edges, setEdges] = useState<Edges>(NONE);
  const [scope, setScope] = useState<'all' | 'one'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);
  const task = useRef<{ destroy: () => Promise<void> } | null>(null);
  const reader = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfJs>>['getDocument']>['promise']> | null>(null);

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  // The loading task, not the document, is what releases the worker's copy.
  useEffect(() => () => { void task.current?.destroy(); }, []);

  const open = useCallback(async (f: File) => {
    setError(null);
    setBusy('Reading');
    try {
      const data = await f.arrayBuffer();
      const pdfjs = await loadPdfJs();
      void task.current?.destroy();
      const loading = pdfjs.getDocument({ data: data.slice(0) });
      task.current = loading;
      reader.current = await loading.promise;
      setBytes(data);
      setCount(reader.current.numPages);
      setIndex(0);
      setEdges(NONE);
      setOut(null);
      setFile(f);
    } catch (e) {
      setError(
        e instanceof Error && /password/i.test(e.message)
          ? 'That PDF has a password. Remove it first with Unlock PDF.'
          : 'That file could not be read as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  // Draw the page being looked at. Rotation is applied by pdf.js, so the
  // preview is the page as a reader shows it, which is the frame the margins
  // are set in.
  useEffect(() => {
    const doc = reader.current;
    if (!doc || !file) return;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(index + 1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 900 / Math.max(base.width, base.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
      if (!cancelled) setPreview(canvas.toDataURL('image/png'));
    })().catch(() => { if (!cancelled) setError('That page could not be drawn.'); });
    return () => { cancelled = true; };
  }, [index, file]);

  const apply = useCallback(async () => {
    if (!bytes || !file) return;
    setBusy('Cropping');
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0));
      doc.getPages().forEach((page, i) => {
        if (scope === 'one' && i !== index) return;
        const r = ((page.getRotation().angle % 360) + 360) % 360;
        const e = toPageEdges(edges, r);
        // Trimmed from what is currently shown, so a page that was already
        // cropped is cropped further rather than reset to the full sheet.
        const box = page.getCropBox();
        page.setCropBox(
          box.x + (box.width * e.left) / 100,
          box.y + (box.height * e.bottom) / 100,
          (box.width * (100 - e.left - e.right)) / 100,
          (box.height * (100 - e.top - e.bottom)) / 100,
        );
      });
      const saved = await doc.save();
      const blob = new Blob([saved as BlobPart], { type: 'application/pdf' });
      setOut((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), size: blob.size };
      });
    } catch {
      setError('Something went wrong writing the PDF.');
    } finally {
      setBusy(null);
    }
  }, [bytes, file, edges, scope, index]);

  const setEdge = (k: keyof Edges, v: number) => {
    setOut(null);
    setEdges((e) => {
      const next = { ...e, [k]: Math.max(0, Math.min(45, v)) };
      return next;
    });
  };

  if (!file) {
    return (
      <PdfDrop
        onFile={(f) => void open(f)}
        hint="Trim the margins off every page, or just one. You see the result before you save."
        busy={busy}
        error={error}
      />
    );
  }

  const nothing = !edges.top && !edges.right && !edges.bottom && !edges.left;

  return (
    <ToolLayout
      title="Trim"
      settings={
        <>
          <div className="grid grid-cols-2 gap-3">
            {(['top', 'bottom', 'left', 'right'] as const).map((k) => (
              <label key={k} className="block text-sm">
                <span className="flex justify-between capitalize">
                  {k}
                  <span className="tabular-nums text-ink-faint">{edges[k]}%</span>
                </span>
                <input
                  type="range" min={0} max={45} step={0.5} value={edges[k]}
                  onChange={(e) => setEdge(k, Number(e.target.value))}
                  className="mt-1.5 w-full"
                  aria-label={`Trim ${k}`}
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => { setEdges(NONE); setOut(null); }}
            className="self-start text-sm text-ink-faint underline underline-offset-4"
          >
            Reset
          </button>

          <fieldset className="space-y-1.5 text-sm">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Apply to</legend>
            <label className="mt-2 flex items-center gap-2">
              <input type="radio" name="crop-scope" checked={scope === 'all'} onChange={() => { setScope('all'); setOut(null); }} />
              Every page
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="crop-scope" checked={scope === 'one'} onChange={() => { setScope('one'); setOut(null); }} />
              Only page {index + 1}
            </label>
          </fieldset>

          <button
            onClick={() => void apply()}
            disabled={nothing || busy !== null}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? 'Crop'}
          </button>
          <p className="text-xs leading-relaxed text-ink-faint">
            Cropping hides the edges rather than deleting them, so it is not a way to remove something private. Use
            Redact PDF for that.
          </p>
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {count} page{count === 1 ? '' : 's'}, {formatBytes(file.size)}
          </p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename={file.name.replace(/\.pdf$/i, '') + '-cropped.pdf'} variant="quiet">
              Download PDF, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button
            onClick={() => { setFile(null); setPreview(null); setOut(null); }}
            className="text-sm text-ink-faint underline underline-offset-4"
          >
            Use another PDF
          </button>
        </>
      }
    >
      <div className="rounded-2xl border border-line bg-surface-alt p-4">
        <div className="relative mx-auto w-fit max-w-full">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`Page ${index + 1}`} className="block max-h-[70vh] max-w-full shadow-sm" />
          ) : (
            <div className="grid h-96 w-72 place-items-center text-sm text-ink-faint">Drawing the page…</div>
          )}
          {preview && (
            <>
              {/* The part that will be trimmed, shaded so the kept area reads
                  as the page. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-ink/45" style={{ height: `${edges.top}%` }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/45" style={{ height: `${edges.bottom}%` }} />
              <div
                className="pointer-events-none absolute left-0 bg-ink/45"
                style={{ top: `${edges.top}%`, bottom: `${edges.bottom}%`, width: `${edges.left}%` }}
              />
              <div
                className="pointer-events-none absolute right-0 bg-ink/45"
                style={{ top: `${edges.top}%`, bottom: `${edges.bottom}%`, width: `${edges.right}%` }}
              />
              <div
                className="pointer-events-none absolute border-2 border-dashed border-accent"
                style={{ top: `${edges.top}%`, bottom: `${edges.bottom}%`, left: `${edges.left}%`, right: `${edges.right}%` }}
              />
            </>
          )}
        </div>
        {count > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="tabular-nums text-ink-soft">
              Page {index + 1} of {count}
            </span>
            <button
              onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
              disabled={index === count - 1}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </ToolLayout>
  );
}
