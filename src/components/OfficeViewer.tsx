'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import { convertFile, conversionAvailable } from '@/lib/convert';
import PageDeck, { type DeckMode, type PageNoun, type RenderedPage } from '@/components/PageDeck';

/**
 * Opens a Word, Excel or PowerPoint file without the Office app.
 *
 * The document is converted to PDF on the server, then rendered here with
 * pdf.js. That split is the whole design: LibreOffice is the only thing that
 * reads the Office formats faithfully and it cannot run in a browser, but once
 * it has produced a PDF the viewing is something the browser already does well.
 *
 * Where the conversion happens is not something the drop zone mentions. It is
 * plumbing, the same way no other converter on the web narrates its own
 * upload. What the file is used for belongs in a privacy policy, which is a
 * page rather than a caption.
 */

type Kind = 'docx' | 'xlsx' | 'pptx';

const ACCEPT: Record<Kind, string> = {
  docx: '.doc,.docx,.odt,.rtf',
  xlsx: '.xls,.xlsx,.ods,.csv',
  pptx: '.ppt,.pptx,.odp',
};

const NOUN: Record<Kind, string> = {
  docx: 'document',
  xlsx: 'spreadsheet',
  pptx: 'presentation',
};

type Rendered = RenderedPage;

/* A deck opens one slide at a time, because that is how a deck is read. A
   document opens as a scroll, because that is how a document is read, and
   because the browser's own find only searches what is on the page. */
const NOUNS: Record<Kind, PageNoun> = { docx: 'page', xlsx: 'sheet', pptx: 'slide' };
const DEFAULT_MODE: Record<Kind, DeckMode> = { docx: 'all', xlsx: 'all', pptx: 'one' };

export default function OfficeViewer({ kind }: { kind: Kind }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Rendered[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const pagesRef = useRef<Rendered[]>([]);
  pagesRef.current = pages;
  useEffect(() => () => {
    pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    abort.current?.abort();
  }, []);

  const open = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setPages([]);
    setPdfUrl(null);

    // Named rather than a spinner, because the first request after an idle
    // period wakes a container and takes a few seconds. "Converting" explains
    // that wait; a bare spinner reads as broken.
    setBusy('Converting');
    abort.current?.abort();
    abort.current = new AbortController();

    const result = await convertFile(f, 'pdf', abort.current.signal);
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }

    setPdfUrl(URL.createObjectURL(result.blob));

    try {
      setBusy('Rendering');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();

      const doc = await pdfjs.getDocument({ data: await result.blob.arrayBuffer() }).promise;
      const out: Rendered[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setBusy(`Rendering page ${i} of ${doc.numPages}`);
        const page = await doc.getPage(i);
        // 1.6 rather than 1, so the page is sharp on a high density screen
        // without the memory cost of rendering everything at 3x.
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
        if (blob) out.push({ page: i, url: URL.createObjectURL(blob) });
        setPages([...out]);
      }
    } catch {
      setError('The file converted but could not be displayed.');
    } finally {
      setBusy(null);
    }
  }, []);

  if (!conversionAvailable) {
    return (
      <p className="rounded-xl border border-line bg-surface p-5 text-ink-soft">
        This tool is unavailable right now.
      </p>
    );
  }

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
        <p className="text-lg font-medium">Drop a {NOUN[kind]} here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          No Office licence and nothing to install.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a file
        </button>

        {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {pdfUrl && (
            <DownloadButton href={pdfUrl} filename={file.name.replace(/\.[^.]+$/, '') + '.pdf'}>
              Download as PDF
            </DownloadButton>
          )}
          <button
            onClick={() => { abort.current?.abort(); setFile(null); setPages([]); setPdfUrl(null); }}
            className="text-ink-faint underline underline-offset-4"
          >
            Open another
          </button>
        </div>
      </div>

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}

      <div className="mt-6">
        <PageDeck
          pages={pages}
          noun={NOUNS[kind]}
          defaultMode={DEFAULT_MODE[kind]}
          busy={busy}
        />
      </div>
    </div>
  );
}
