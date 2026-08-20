'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * HEIC to JPG or WebP, in the browser, in bulk.
 *
 * Browsers outside Safari cannot decode HEIC, so this needs libheif compiled to
 * WebAssembly. That binary is heavy, which shapes the whole design: it is
 * imported only when somebody actually drops a file, so a visitor who arrives
 * from a search result and reads the page never pays for a decoder they did not
 * use.
 *
 * Batch is the default rather than a feature. Nobody has one photo from their
 * phone. They have the ninety that will not open on a Windows laptop, which is
 * also why the whole set can come back as a single zip.
 */

type Status = 'waiting' | 'working' | 'done' | 'failed';

type Item = {
  id: string;
  file: File;
  status: Status;
  url?: string;
  bytes?: number;
  error?: string;
};

const FORMATS = {
  jpeg: { label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp' },
} as const;

type FormatKey = keyof typeof FORMATS;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/.test(file.type);
}

export default function HeicConvert({ initialFormat = 'jpeg' }: { initialFormat?: FormatKey }) {
  const [items, setItems] = useState<Item[]>([]);
  // Set by the route, so /heic-to-webp lands on WebP rather than making someone
  // who searched for it change the setting themselves.
  const [format, setFormat] = useState<FormatKey>(initialFormat);
  /*
    Fixed rather than offered. A slider on a photo converter asks a question
    nobody can answer without seeing both results, and the honest answer is
    always "as good as it goes without the file being pointlessly huge". 92 is
    visually indistinguishable from the original on a photograph.
  */
  const quality = 0.92;
  const [running, setRunning] = useState(false);
  const [loadingDecoder, setLoadingDecoder] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Every converted blob holds memory until revoked, and a batch of ninety
  // photos is a lot to leave behind when somebody navigates away.
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    };
  }, []);

  const add = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter(isHeic);
    if (!accepted.length) return;
    setItems((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: 'waiting' as Status,
      })),
    ]);
  }, []);

  const convertAll = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'waiting' || i.status === 'failed');
    if (!pending.length) return;

    setRunning(true);
    setLoadingDecoder(true);

    // Imported here rather than at the top of the file. This is the whole
    // reason the landing page is light.
    const { heicTo } = await import('heic-to');
    setLoadingDecoder(false);

    const target = FORMATS[format];

    // One at a time. libheif is single threaded and a phone photo is large, so
    // converting ninety in parallel makes the tab unresponsive rather than
    // faster, and the per-file progress stops meaning anything.
    for (const item of pending) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'working', error: undefined } : i)),
      );
      try {
        const blob = await heicTo({
          blob: item.file,
          type: target.mime,
          quality,
        });
        const url = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'done', url, bytes: blob.size } : i,
          ),
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'failed',
                  error: e instanceof Error ? e.message : 'Could not read this file.',
                }
              : i,
          ),
        );
      }
    }

    setRunning(false);
  }, [items, format, quality]);

  const downloadZip = useCallback(async () => {
    const done = items.filter((i) => i.status === 'done' && i.url);
    if (!done.length) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const ext = FORMATS[format].ext;
      for (const i of done) {
        const data = await (await fetch(i.url!)).blob();
        zip.file(i.file.name.replace(/\.(heic|heif)$/i, '') + '.' + ext, data);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-photos.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }, [items, format]);

  const reset = useCallback(() => {
    items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    setItems([]);
  }, [items]);

  const doneCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'waiting' || i.status === 'failed').length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        } ${items.length ? 'p-5' : 'p-8 min-h-[340px] flex flex-col items-center justify-center text-center'}`}
      >
        {items.length === 0 ? (
          <>
            <p className="text-lg font-medium">Drop your photos here</p>
            <p className="mt-1 text-sm text-ink-soft">
              As many as you like. Nothing is uploaded.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-md bg-accent text-accent-ink px-4 py-2 text-sm font-medium"
            >
              Choose photos
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink-soft tabular-nums">
                {items.length} photo{items.length === 1 ? '' : 's'}
                {doneCount > 0 && `, ${doneCount} converted`}
              </p>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-accent underline underline-offset-4"
                >
                  Add more
                </button>
                <button onClick={reset} className="text-ink-faint underline underline-offset-4">
                  Clear
                </button>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="size-10 shrink-0 rounded bg-surface-alt overflow-hidden grid place-items-center">
                    {i.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.url} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-ink-faint">HEIC</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.file.name}</p>
                    <p className="text-xs text-ink-faint tabular-nums">
                      {i.status === 'working' && 'Converting…'}
                      {i.status === 'waiting' && formatBytes(i.file.size)}
                      {i.status === 'done' &&
                        `${formatBytes(i.file.size)} → ${formatBytes(i.bytes ?? 0)}`}
                      {i.status === 'failed' && (i.error ?? 'Failed')}
                    </p>
                  </div>
                  {i.status === 'done' && i.url && (
                    <a
                      href={i.url}
                      download={
                        i.file.name.replace(/\.(heic|heif)$/i, '') + '.' + FORMATS[format].ext
                      }
                      className="shrink-0 text-sm text-accent underline underline-offset-4"
                    >
                      Save
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".heic,.heif,image/heic,image/heif"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <fieldset disabled={running}>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Convert to
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(FORMATS) as FormatKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setFormat(k)}
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  k === format
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}
              >
                {FORMATS[k].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint leading-relaxed">
            {format === 'jpeg'
              ? 'JPG opens everywhere, including old software.'
              : 'WebP files are smaller at the same quality, and every current browser reads them.'}
          </p>
        </fieldset>

        <button
          onClick={() => void convertAll()}
          disabled={!pendingCount || running}
          className="mt-5 w-full rounded-md bg-accent text-accent-ink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loadingDecoder
            ? 'Getting ready…'
            : running
              ? 'Converting…'
              : `Convert ${pendingCount || ''} photo${pendingCount === 1 ? '' : 's'}`.trim()}
        </button>

        {loadingDecoder && (
          <p className="mt-2 text-xs text-ink-faint leading-relaxed">
            Loading the decoder.
          </p>
        )}

        {doneCount > 1 && (
          <button
            onClick={() => void downloadZip()}
            disabled={zipping}
            className="mt-3 w-full rounded-md border border-accent text-accent px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {zipping ? 'Building zip…' : `Download all ${doneCount} as a zip`}
          </button>
        )}
      </div>
    </div>
  );
}
