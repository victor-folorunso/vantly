'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PageDeck, { type RenderedPage } from '@/components/PageDeck';

/**
 * Opens a PDF without a PDF reader.
 *
 * Nothing leaves the machine here. pdf.js does the whole job in the browser,
 * which is the difference between this and the Office viewers: those need
 * LibreOffice to read the format at all, and a PDF is already something the
 * browser can render.
 */

export default function PdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* True once the pages are not in the order they arrived in. Reordering is
     only worth offering if the result can be taken away, so the download
     appears with the first move and not before. */
  const reordered = pages.some((p, i) => p.page !== i + 1);

  const move = useCallback((from: number, to: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    // The old download is for the old order, so it stops being offered.
    setOutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  /* Writes the pages out in the order shown. pdf-lib copies the real pages
     from the original file rather than the images rendered for the screen, so
     the text stays text and the file does not become a stack of pictures. */
  const save = useCallback(async () => {
    if (!file) return;
    setBusy('Saving');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pages.map((p) => p.page - 1));
      copied.forEach((page) => out.addPage(page));
      const blob = new Blob([(await out.save()) as BlobPart], { type: 'application/pdf' });
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setError('The pages could not be saved in that order.');
    } finally {
      setBusy(null);
    }
  }, [file, pages]);

  const pagesRef = useRef<RenderedPage[]>([]);
  pagesRef.current = pages;
  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const open = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setPages([]);
    setBusy('Opening');

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();

      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const out: RenderedPage[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setBusy(`Rendering page ${i} of ${doc.numPages}`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        // A PDF page is transparent where nothing is drawn, and a JPEG has no
        // transparency, so without this the margins come out black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
        if (blob) out.push({ page: i, url: URL.createObjectURL(blob) });
        setPages([...out]);
      }
    } catch (e) {
      setError(
        e instanceof Error && /password/i.test(e.message)
          ? 'That PDF is password protected.'
          : 'That file could not be opened as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void open(f); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a PDF here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          Read it a page at a time or scroll the whole thing.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-medium">{file.name}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {reordered &&
            (outUrl ? (
              <a
                href={outUrl}
                download={file.name.replace(/\.pdf$/i, '') + '-reordered.pdf'}
                className="rounded-lg border border-accent px-4 py-2 font-semibold text-accent"
              >
                Download
              </a>
            ) : (
              <button
                onClick={() => void save()}
                disabled={busy !== null}
                className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-60"
              >
                Save this order
              </button>
            ))}
          <button
            onClick={() => { setFile(null); setPages([]); setError(null); setOutUrl(null); }}
            className="text-ink-faint underline underline-offset-4"
          >
            Open another
          </button>
        </div>
      </div>

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}

      <div className="mt-6">
        <PageDeck pages={pages} noun="page" defaultMode="all" busy={busy} onMove={move} />
      </div>
    </div>
  );
}
