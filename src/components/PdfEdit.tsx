'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';

/**
 * Three small edits to a PDF that share one shape: load, change, save.
 *
 * text     pull the words out, page by page
 * unlock   open with a password, write back without one
 * mark     stamp a watermark across every page
 *
 * Built together because each is a few lines on top of the same load and save,
 * and three separate components would mean maintaining the drop zone, the error
 * handling and the memory cleanup three times.
 *
 * Unlocking needs saying plainly: this removes a password you already know. It
 * is not a crack. pdf-lib cannot open a file without the password, so a PDF you
 * cannot open stays closed, which is the correct behaviour rather than a
 * limitation.
 */

type Mode = 'text' | 'unlock' | 'mark';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfEdit({ mode }: { mode: Mode }) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [text, setText] = useState('');
  const [markText, setMarkText] = useState('DRAFT');
  const [opacity, setOpacity] = useState(0.18);
  const [angle, setAngle] = useState(45);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const reset = () => {
    setFile(null); setText(''); setError(null); setOutUrl(null); setPassword('');
  };

  /* ── Extract text, which is pdf.js rather than pdf-lib ─────────────── */
  const extract = useCallback(async (f: File) => {
    setBusy('Reading');
    setError(null);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();

      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const parts: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setBusy(`Reading page ${i} of ${doc.numPages}`);
        const content = await (await doc.getPage(i)).getTextContent();

        /* pdf.js returns positioned fragments rather than lines, so a naive
           join runs every line together. Fragments carrying an end-of-line
           marker get a newline, and a gap in the vertical position starts a
           new paragraph. */
        let out = '';
        let lastY: number | null = null;
        for (const item of content.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
          const y = item.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 4) out += '\n';
          out += item.str;
          if (item.hasEOL) out += '\n';
          lastY = y;
        }
        parts.push(`--- Page ${i} ---\n${out.trim()}`);
      }

      const joined = parts.join('\n\n');
      setText(joined);
      if (!joined.replace(/--- Page \d+ ---/g, '').trim()) {
        setError(
          'No text found. This is probably a scan, which is a picture of words rather than words. Reading it needs OCR.',
        );
      }
    } catch (e) {
      setError(
        e instanceof Error && /password/i.test(e.message)
          ? 'That PDF is password protected.'
          : 'That file could not be read as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  /* ── Unlock and watermark, both pdf-lib ────────────────────────────── */
  const write = useCallback(async () => {
    if (!file) return;
    setBusy('Working');
    setError(null);
    try {
      const { PDFDocument, degrees, rgb, StandardFonts } = await import('pdf-lib');

      const doc = await PDFDocument.load(await file.arrayBuffer(), {
        // The only way pdf-lib opens an encrypted file. Without this it throws
        // rather than asking.
        ignoreEncryption: mode === 'unlock',
      });

      if (mode === 'mark') {
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          // Sized to the diagonal so the text spans the page whatever its
          // shape, and never overflows a narrow one.
          const size = Math.min(width, height) / (markText.length * 0.42 || 1);
          page.drawText(markText, {
            x: width / 2 - (font.widthOfTextAtSize(markText, size) / 2) * Math.cos((angle * Math.PI) / 180),
            y: height / 2 - (size / 2),
            size,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity,
            rotate: degrees(angle),
          });
        }
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutSize(blob.size);
      setOutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
    } catch (e) {
      setError(
        e instanceof Error && /encrypt|password/i.test(e.message)
          ? 'This PDF is encrypted in a way that cannot be opened without the password. Open it in a reader with the password, print to PDF, and try again.'
          : 'Something went wrong writing the PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, [file, mode, markText, opacity, angle]);

  const pick = (f: File) => {
    setFile(f);
    setOutUrl(null);
    setError(null);
    if (mode === 'text') void extract(f);
  };

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a PDF here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'text' && 'The text comes back page by page, ready to copy.'}
          {mode === 'unlock' && 'Removes a password you already know, so it stops asking every time.'}
          {mode === 'mark' && 'Stamps your text across every page.'}
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
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <ToolLayout
      settings={
        mode === 'text' ? null : (
          <>
            {mode === 'mark' && (
              <>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Watermark text
                  </span>
                  <input
                    value={markText}
                    onChange={(e) => setMarkText(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
                <div className="rounded-xl border border-line bg-surface p-4">
                  <label className="block text-sm">
                    <span className="flex justify-between">
                      Opacity
                      <span className="tabular-nums text-ink-faint">{Math.round(opacity * 100)}%</span>
                    </span>
                    <input type="range" min={5} max={60} value={opacity * 100}
                      onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                      className="mt-1.5 w-full accent-[var(--accent)]" />
                  </label>
                  <label className="mt-3 block text-sm">
                    <span className="flex justify-between">
                      Angle
                      <span className="tabular-nums text-ink-faint">{angle}°</span>
                    </span>
                    <input type="range" min={0} max={90} step={15} value={angle}
                      onChange={(e) => setAngle(Number(e.target.value))}
                      className="mt-1.5 w-full accent-[var(--accent)]" />
                  </label>
                </div>
              </>
            )}
            <button
              onClick={() => void write()}
              disabled={busy !== null || (mode === 'mark' && !markText.trim())}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
            >
              {busy ?? (mode === 'unlock' ? 'Remove the password' : 'Add the watermark')}
            </button>
          </>
        )
      }
      status={
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs tabular-nums text-ink-faint">
              {busy ?? formatBytes(file.size)}
            </p>
          </div>
        </>
      }
      actions={
        <>
          {outUrl && (
            <DownloadButton href={outUrl} filename={file.name.replace(/\.pdf$/i, '') + (mode === 'unlock' ? '-unlocked.pdf' : '-marked.pdf')} variant="quiet">
              Download PDF, {formatBytes(outSize)}
            </DownloadButton>
          )}
          <button onClick={reset} className="text-sm text-ink-faint underline underline-offset-4">
            Use another PDF
          </button>
        </>
      }
    >
      {mode === 'text' && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Text
            </span>
            {text && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy all'}
              </button>
            )}
          </div>
          <textarea
            value={text}
            readOnly
            rows={18}
            spellCheck={false}
            placeholder="The text appears here."
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>
      )}

      {mode === 'unlock' && (
        <p className="mt-5 max-w-2xl rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
          This removes the password from a PDF you can already open. It is not a
          way into a file you do not have the password for, and it will not
          pretend otherwise.
        </p>
      )}

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </ToolLayout>
  );
}
