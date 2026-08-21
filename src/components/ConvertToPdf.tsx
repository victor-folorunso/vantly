'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandoff } from '@/components/useHandoff';
import DownloadButton from '@/components/DownloadButton';
import { convertFile, conversionAvailable } from '@/lib/convert';

/**
 * Turns a document into a PDF, using LibreOffice on the server.
 *
 * Word, Excel, PowerPoint, EPUB and HTML all reach the same place, so one
 * component covers the lot and each page only differs in what it accepts and
 * what it calls the file.
 *
 * Converting is the whole job here, unlike the viewers, which convert and then
 * render. So there is nothing to draw: the file goes out, a PDF comes back,
 * and the download appears.
 */

export type PdfSource = 'word' | 'excel' | 'powerpoint' | 'epub' | 'html' | 'any';

const ACCEPT: Record<PdfSource, string> = {
  word: '.doc,.docx,.odt,.rtf',
  excel: '.xls,.xlsx,.ods,.csv',
  powerpoint: '.ppt,.pptx,.odp',
  epub: '.epub',
  html: '.html,.htm',
  any: '.doc,.docx,.odt,.rtf,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp,.epub,.html,.htm,.txt',
};

const NOUN: Record<PdfSource, string> = {
  word: 'Word document',
  excel: 'spreadsheet',
  powerpoint: 'PowerPoint',
  epub: 'EPUB',
  html: 'HTML file',
  any: 'document',
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ConvertToPdf({ from }: { from: PdfSource }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
    },
    [],
  );

  const run = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setOutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setBusy(true);

    abort.current?.abort();
    abort.current = new AbortController();

    const result = await convertFile(f, 'pdf', abort.current.signal);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOutSize(result.blob.size);
    setOutUrl(URL.createObjectURL(result.blob));
  }, []);

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
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void run(f);
        }}
        className={`flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a {NOUN[from]} here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          Fonts, tables and layout are kept.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[from]}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void run(f);
            e.target.value = '';
          }}
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
            <DownloadButton href={outUrl} filename={file.name.replace(/\.[^.]+$/, '') + '.pdf'} variant="quiet">
              Download PDF, {formatBytes(outSize)}
            </DownloadButton>
          )}
        </div>
      )}

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </div>
  );
}
