'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandoff } from '@/components/useHandoff';
import DownloadButton from '@/components/DownloadButton';
import { convertFile, conversionAvailable } from '@/lib/convert';

/**
 * Converts a document into another kind of document.
 *
 * Word, Markdown, HTML and plain text, in the combinations that are worth
 * having. Two programs do the work on the server and the pair decides which:
 * pandoc for anything touching Markdown, since LibreOffice cannot read or
 * write it at all, and LibreOffice for anything that has to keep Word layout.
 *
 * Markdown to PDF goes through Word on the way, because pandoc writes a PDF
 * only by calling LaTeX and a LaTeX install is a gigabyte for one conversion.
 */

export type DocFormat = 'docx' | 'md' | 'html' | 'txt' | 'pdf' | 'epub';

const ACCEPT: Record<DocFormat, string> = {
  docx: '.doc,.docx,.odt,.rtf',
  md: '.md,.markdown,.txt',
  html: '.html,.htm',
  txt: '.txt',
  pdf: '.pdf',
  epub: '.epub',
};

const NOUN: Record<DocFormat, string> = {
  docx: 'Word document',
  md: 'Markdown file',
  html: 'HTML file',
  txt: 'text file',
  pdf: 'PDF',
  epub: 'EPUB',
};

/** Formats worth showing before downloading, because they are readable text. */
const PREVIEWABLE: DocFormat[] = ['md', 'html', 'txt'];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocConvert({ from, to }: { from: DocFormat; to: DocFormat }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const run = useCallback(
    async (f: File) => {
      setFile(f);
      setError(null);
      setPreview(null);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setBusy(true);

      abort.current?.abort();
      abort.current = new AbortController();

      const result = await convertFile(f, to, abort.current.signal);
      setBusy(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOutSize(result.blob.size);
      setOutUrl(URL.createObjectURL(result.blob));
      if (PREVIEWABLE.includes(to)) setPreview(await result.blob.text());
    },
    [to],
  );

  // Files chosen on the home page, if that is how you arrived.
  useHandoff((files) => {
    void run(files[0]);
  });

  if (!conversionAvailable) {
    return (
      <p className="rounded-xl border border-line bg-surface p-5 text-ink-soft">
        This tool is unavailable right now.
      </p>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void run(f); }}
        className={`flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a {NOUN[from]} here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          Headings, lists, links and tables all come across.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ? 'Converting…' : 'Choose a file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[from]}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(f); e.target.value = ''; }}
        />
      </div>

      {file && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs tabular-nums text-ink-faint">
              {busy ? 'Converting…' : formatBytes(file.size)}
            </p>
          </div>
          {outUrl && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {preview !== null && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(preview);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-accent underline underline-offset-4"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              <DownloadButton href={outUrl} filename={file.name.replace(/\.[^.]+$/, '') + '.' + to} variant="quiet">
                Download, {formatBytes(outSize)}
              </DownloadButton>
            </div>
          )}
        </div>
      )}

      {preview !== null && (
        <textarea
          value={preview}
          readOnly
          rows={18}
          spellCheck={false}
          className="mt-4 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
        />
      )}

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </div>
  );
}
