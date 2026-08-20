'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertFile, conversionAvailable } from '@/lib/convert';

/**
 * Opens a Word, Excel or PowerPoint file without the Office app.
 *
 * The document is converted to PDF on the server, then rendered here with
 * pdf.js. That split is the whole design: LibreOffice is the only thing that
 * reads the Office formats faithfully and it cannot run in a browser, but once
 * it has produced a PDF the viewing is something the browser already does well.
 *
 * It says the file is converted on a server, in four words under the button.
 * An earlier draft explained at length why, which was arguing with a promise
 * the site does not make. Say the fact, not the defence.
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

type Rendered = { page: number; url: string };

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
        This one needs the conversion service, which is not switched on yet.
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
          Opens in your browser. No Office licence and nothing to install.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a file
        </button>

        <p className="mt-4 text-xs text-ink-faint">Converted on our server, not stored.</p>

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
          <p className="text-xs tabular-nums text-ink-faint">
            {busy ? `${busy}…` : `${pages.length} page${pages.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={file.name.replace(/\.[^.]+$/, '') + '.pdf'}
              className="text-accent underline underline-offset-4"
            >
              Download as PDF
            </a>
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

      <div className="mt-6 space-y-6">
        {pages.map((p) => (
          <figure key={p.page} className="overflow-hidden rounded-lg border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Page ${p.page}`} className="block w-full" />
            <figcaption className="px-3 py-2 text-xs tabular-nums text-ink-faint">
              Page {p.page}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
