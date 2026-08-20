'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Reads the words out of a picture, or out of a scanned PDF.
 *
 * Tesseract does the recognising, compiled to WebAssembly, so the picture
 * itself never leaves the machine. The recogniser and the language data do get
 * downloaded the first time, which is the one thing worth saying plainly: a
 * few megabytes arrive from a CDN, then it is cached and works offline.
 *
 * A PDF gets rendered to images first. Text in a scan is a picture of words,
 * so there is nothing to extract and everything to recognise, which is exactly
 * the case the plain PDF to text tool cannot handle and says so.
 */

type Mode = 'image' | 'pdf';

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'eng', label: 'English' },
  { id: 'fra', label: 'French' },
  { id: 'deu', label: 'German' },
  { id: 'spa', label: 'Spanish' },
  { id: 'por', label: 'Portuguese' },
  { id: 'ita', label: 'Italian' },
  { id: 'nld', label: 'Dutch' },
  { id: 'ara', label: 'Arabic' },
  { id: 'chi_sim', label: 'Chinese, simplified' },
  { id: 'hin', label: 'Hindi' },
  { id: 'rus', label: 'Russian' },
];

export default function OcrTool({ mode }: { mode: Mode }) {
  const [name, setName] = useState<string | null>(null);
  const [language, setLanguage] = useState('eng');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Renders every page of a PDF to a canvas, since a scan has no text in it. */
  const pdfToCanvases = useCallback(async (file: File): Promise<HTMLCanvasElement[]> => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).toString();

    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const out: HTMLCanvasElement[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      setBusy(`Rendering page ${i} of ${doc.numPages}`);
      const page = await doc.getPage(i);
      // 2.0 rather than 1.0: recognition accuracy falls off a cliff below
      // roughly 300 dpi, and a PDF point is 1/72 of an inch.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      out.push(canvas);
    }
    return out;
  }, []);

  const run = useCallback(
    async (file: File) => {
      setName(file.name);
      setError(null);
      setText('');
      setBusy('Starting');

      try {
        const { createWorker } = await import('tesseract.js');

        setBusy('Downloading the recogniser');
        const worker = await createWorker(language, 1, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') {
              setBusy(`Reading, ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        try {
          if (mode === 'pdf') {
            const canvases = await pdfToCanvases(file);
            const parts: string[] = [];
            for (let i = 0; i < canvases.length; i++) {
              setBusy(`Reading page ${i + 1} of ${canvases.length}`);
              const { data } = await worker.recognize(canvases[i]);
              parts.push(`--- Page ${i + 1} ---\n${data.text.trim()}`);
              setText(parts.join('\n\n'));
            }
          } else {
            const { data } = await worker.recognize(file);
            setText(data.text.trim());
            if (!data.text.trim()) {
              setError('No words were found in that picture.');
            }
          }
        } finally {
          await worker.terminate();
        }
      } catch (e) {
        setError(
          e instanceof Error && /network|fetch/i.test(e.message)
            ? 'The recogniser could not be downloaded. Check the connection and try again.'
            : 'That file could not be read.',
        );
      } finally {
        setBusy(null);
      }
    },
    [language, mode, pdfToCanvases],
  );

  const accept = mode === 'pdf' ? 'application/pdf,.pdf' : 'image/*';

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-2 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        {name && (
          <p className="pb-3 text-sm text-ink-faint">
            <span className="truncate">{name}</span>
            {busy && <span className="ml-2 tabular-nums">{busy}…</span>}
          </p>
        )}
      </div>

      {!text && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void run(f); }}
          className={`mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <p className="text-lg font-medium">
            {mode === 'pdf' ? 'Drop a scanned PDF here' : 'Drop a picture here'}
          </p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
            A photo of a page, a screenshot, or a scan.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? 'Choose a file'}
          </button>
          <p className="mt-6 max-w-sm text-xs leading-relaxed text-ink-faint">
            Your file stays on your machine. The recogniser itself is downloaded
            once, about 5MB, then cached.
          </p>
          {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(f); e.target.value = ''; }}
          />
        </div>
      )}

      {text && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {text.trim().split(/\s+/).length} words
            </span>
            <div className="flex gap-4 text-sm">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={URL.createObjectURL(new Blob([text], { type: 'text/plain' }))}
                download={(name ?? 'text').replace(/\.[^.]+$/, '') + '.txt'}
                className="text-accent underline underline-offset-4"
              >
                Download
              </a>
              <button
                onClick={() => { setText(''); setName(null); setError(null); }}
                className="text-ink-faint underline underline-offset-4"
              >
                Read another
              </button>
            </div>
          </div>
          <textarea
            value={text}
            readOnly
            rows={20}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Recognition is never perfect. A clean scan reads almost exactly, a
            photograph at an angle reads worse, and handwriting is not what this
            is for.
          </p>
        </div>
      )}
    </div>
  );
}
