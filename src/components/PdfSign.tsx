'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';

/**
 * Puts a signature on a PDF.
 *
 * Draw it with a mouse or a finger, or upload a photograph of one. It is
 * placed as a transparent PNG on the page you choose.
 *
 * What this is not is said on the page: it is a picture of a signature, the
 * same as printing, signing and scanning, not a cryptographic signature. Tools
 * that blur that line are the reason people think a drawn squiggle proves
 * something it does not.
 *
 * Drawing uses pointer events rather than mouse events, so a phone, a tablet
 * and a stylus all work without three code paths.
 */

type Placement = 'bottom-left' | 'bottom-right' | 'bottom-centre' | 'top-left' | 'top-right';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfSign() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [placement, setPlacement] = useState<Placement>('bottom-right');
  const [width, setWidth] = useState(30);
  const [hasInk, setHasInk] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);

  const padRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const loadPdf = useCallback(async (f: File) => {
    setError(null);
    setOutUrl(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      setPage(doc.getPageCount());
      setFile(f);
    } catch {
      setError('That file could not be read as a PDF.');
    }
  }, []);

  /* ── The signature pad ───────────────────────────────────────────────── */

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current!;
    const box = canvas.getBoundingClientRect();
    // The canvas is drawn at a fixed resolution and displayed at whatever
    // width it gets, so screen coordinates need scaling to canvas ones.
    return {
      x: ((e.clientX - box.left) / box.width) * canvas.width,
      y: ((e.clientY - box.top) / box.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = padRef.current!.getContext('2d')!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = padRef.current!.getContext('2d')!;
    const p = point(e);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#101010';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const stop = () => {
    drawing.current = false;
  };

  const clearPad = () => {
    const canvas = padRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  /* ── Placing it ──────────────────────────────────────────────────────── */

  const sign = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

      let pngBytes: ArrayBuffer;
      if (uploaded) {
        pngBytes = await (await fetch(uploaded)).arrayBuffer();
      } else {
        const blob = await new Promise<Blob | null>((r) => padRef.current!.toBlob(r, 'image/png'));
        if (!blob) throw new Error('no signature');
        pngBytes = await blob.arrayBuffer();
      }

      const png = await doc.embedPng(pngBytes);
      const target = doc.getPage(Math.min(Math.max(page, 1), doc.getPageCount()) - 1);
      const { width: pw, height: ph } = target.getSize();

      const drawWidth = (pw * width) / 100;
      const drawHeight = (png.height / png.width) * drawWidth;
      const margin = pw * 0.06;

      const x = placement.includes('left')
        ? margin
        : placement.includes('right')
          ? pw - drawWidth - margin
          : (pw - drawWidth) / 2;
      const y = placement.startsWith('top') ? ph - drawHeight - margin : margin;

      target.drawImage(png, { x, y, width: drawWidth, height: drawHeight });

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutSize(blob.size);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setError('The signature could not be added.');
    } finally {
      setBusy(false);
    }
  }, [file, page, placement, width, uploaded]);

  if (!file) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center">
        <p className="text-lg font-medium">Drop the PDF to sign</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          Then draw your name, or upload a picture of it.
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadPdf(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">{pageCount} pages</p>
        </div>
        <button
          onClick={() => { setFile(null); setOutUrl(null); }}
          className="text-sm text-ink-faint underline underline-offset-4"
        >
          Use another PDF
        </button>
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-1 min-w-0 lg:order-2">
          <span className={label}>Your signature</span>
          {uploaded ? (
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploaded} alt="Your signature" className="max-h-24" />
              <button
                onClick={() => setUploaded(null)}
                className="text-sm text-ink-faint underline underline-offset-4"
              >
                Draw one instead
              </button>
            </div>
          ) : (
            <>
              <canvas
                ref={padRef}
                width={800}
                height={260}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={stop}
                onPointerLeave={stop}
                className="mt-2 block w-full cursor-crosshair touch-none rounded-xl border border-line bg-white"
              />
              <div className="mt-2 flex gap-4 text-sm">
                <button onClick={clearPad} className="text-ink-faint underline underline-offset-4">
                  Clear
                </button>
                <button
                  onClick={() => signatureRef.current?.click()}
                  className="text-accent underline underline-offset-4"
                >
                  Upload a picture instead
                </button>
              </div>
            </>
          )}
          <input
            ref={signatureRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setUploaded(URL.createObjectURL(f));
              e.target.value = '';
            }}
          />
        </div>

        <div className="order-2 space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-sm lg:order-1 lg:sticky lg:top-20">
          <label className="block text-sm">
            <span className={label}>Page</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={page}
              onChange={(e) => setPage(Number(e.target.value) || 1)}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
            />
          </label>

          <div>
            <span className={label}>Where</span>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  ['top-left', 'Top left'],
                  ['top-right', 'Top right'],
                  ['bottom-left', 'Bottom left'],
                  ['bottom-right', 'Bottom right'],
                  ['bottom-centre', 'Bottom centre'],
                ] as [Placement, string][]
              ).map(([id, text]) => (
                <button
                  key={id}
                  onClick={() => setPlacement(id)}
                  aria-pressed={placement === id}
                  className={`rounded-lg border py-2 text-xs transition-colors ${
                    placement === id
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="flex justify-between">
              Size
              <span className="tabular-nums text-ink-faint">{width}% of the page</span>
            </span>
            <input
              type="range"
              min={10}
              max={60}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void sign()}
              disabled={busy || (!hasInk && !uploaded)}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
            >
              {busy ? 'Signing…' : 'Add the signature'}
            </button>
            {outUrl && (
              <DownloadButton href={outUrl} filename={file.name.replace(/\.pdf$/i, '') + '-signed.pdf'} variant="quiet">
                Download, {formatBytes(outSize)}
              </DownloadButton>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft">
        This puts a picture of your signature on the page, the same as printing,
        signing and scanning it back. It is not a cryptographic signature, and
        it does not prove who signed.
      </p>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}
    </div>
  );
}
