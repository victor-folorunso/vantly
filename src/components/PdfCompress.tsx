'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';

/**
 * Makes a PDF smaller, in one of two quite different ways.
 *
 * Tidy up      rewrites the file structure and drops what nothing points at.
 *              Lossless, text stays text, and on a file from a careless
 *              exporter it can still take a real bite out of the size.
 *
 * Flatten      renders every page to a JPEG and rebuilds the document around
 *              those. This is where the large savings are, and it is also
 *              destructive: the text stops being text, so it cannot be
 *              searched, selected or read aloud.
 *
 * Both are offered because the honest answer depends on what the file is for,
 * and a tool that quietly picks the destructive one has ruined a contract for
 * somebody. The size result is shown for both before anything is downloaded.
 */

type Method = 'tidy' | 'flatten';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<Method>('tidy');
  const [quality, setQuality] = useState(0.7);
  const [scale, setScale] = useState(1.5);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const run = useCallback(async () => {
    if (!file) return;
    setBusy('Working');
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await file.arrayBuffer();
      let blob: Blob;

      if (method === 'tidy') {
        const doc = await PDFDocument.load(source, { ignoreEncryption: true });
        // Object streams pack the bookkeeping together and compress it, which
        // is where a lossless saving actually comes from.
        const bytes = await doc.save({ useObjectStreams: true });
        blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      } else {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        // pdf.js takes ownership of the buffer it is handed, and pdf-lib needs
        // one afterwards, so it gets a copy.
        const reader = await pdfjs.getDocument({ data: source.slice(0) }).promise;
        const out = await PDFDocument.create();

        for (let i = 1; i <= reader.numPages; i++) {
          setBusy(`Page ${i} of ${reader.numPages}`);
          const page = await reader.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          // JPEG has no transparency, so without a white ground the margins
          // come out black.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;

          const jpeg = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, 'image/jpeg', quality),
          );
          if (!jpeg) throw new Error('encode failed');
          const embedded = await out.embedJpg(await jpeg.arrayBuffer());
          // Kept at the original page size in points, so paper size and
          // proportions survive even though the pixels changed.
          const original = page.getViewport({ scale: 1 });
          const added = out.addPage([original.width, original.height]);
          added.drawImage(embedded, {
            x: 0,
            y: 0,
            width: original.width,
            height: original.height,
          });
        }

        const bytes = await out.save();
        blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      }

      setOutSize(blob.size);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setError('That PDF could not be compressed.');
    } finally {
      setBusy(null);
    }
  }, [file, method, quality, scale]);

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); setOutUrl(null); } }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a PDF here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          For the one that is too big to email.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setOutUrl(null); } e.target.value = ''; }}
        />
      </div>
    );
  }

  const saved = outUrl && outSize > 0 ? Math.round((1 - outSize / file.size) * 100) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">{formatBytes(file.size)}</p>
        </div>
        <button
          onClick={() => { setFile(null); setOutUrl(null); }}
          className="text-sm text-ink-faint underline underline-offset-4"
        >
          Use another PDF
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(
          [
            ['tidy', 'Tidy up', 'Lossless. Text stays text. Smaller savings.'],
            ['flatten', 'Flatten to pictures', 'Much smaller. Text stops being text.'],
          ] as [Method, string, string][]
        ).map(([id, title, note]) => (
          <button
            key={id}
            onClick={() => { setMethod(id); setOutUrl(null); }}
            aria-pressed={method === id}
            className={`rounded-xl border p-4 text-left transition-colors ${
              method === id ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent'
            }`}
          >
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-ink-soft">{note}</p>
          </button>
        ))}
      </div>

      {method === 'flatten' && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="flex justify-between">
              Picture quality
              <span className="tabular-nums text-ink-faint">{Math.round(quality * 100)}%</span>
            </span>
            <input
              type="range"
              min={30}
              max={95}
              value={Math.round(quality * 100)}
              onChange={(e) => { setQuality(Number(e.target.value) / 100); setOutUrl(null); }}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
          <label className="block text-sm">
            <span className="flex justify-between">
              Resolution
              <span className="tabular-nums text-ink-faint">{Math.round(scale * 72)} dpi</span>
            </span>
            <input
              type="range"
              min={72}
              max={288}
              step={36}
              value={Math.round(scale * 72)}
              onChange={(e) => { setScale(Number(e.target.value) / 72); setOutUrl(null); }}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => void run()}
          disabled={busy !== null}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ?? 'Compress'}
        </button>
        {outUrl && (
          <>
            <DownloadButton href={outUrl} filename={file.name.replace(/\.pdf$/i, '') + '-smaller.pdf'} variant="quiet">
              Download, {formatBytes(outSize)}
            </DownloadButton>
            <p className="text-sm tabular-nums text-ink-soft">
              {saved !== null && saved > 0
                ? `${saved}% smaller`
                : 'Already about as small as it goes'}
            </p>
          </>
        )}
      </div>


      {error && <p className="mt-4 text-sm text-accent">{error}</p>}
    </div>
  );
}
