'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Raster image conversion on a canvas, for every pair the browser can honestly
 * do. One component behind fifteen addresses.
 *
 * The browser will decode more formats than it will write. Chromium encodes
 * PNG, JPEG and WebP and nothing else, but asking toBlob for AVIF or BMP does
 * not fail: it quietly returns a PNG. Trusting the requested type would have
 * shipped PNG data inside a file named .avif, which opens fine everywhere and
 * is wrong in a way nobody would report. So the encodable targets are listed
 * rather than inferred, and the blob's own type is checked after the fact.
 */

type Status = 'waiting' | 'working' | 'done' | 'failed';

type Item = {
  id: string;
  file: File;
  status: Status;
  url?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: string;
};

export type EncodableTarget = 'png' | 'jpg' | 'webp';

const MIME: Record<EncodableTarget, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

let counter = 0;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageConvert({
  target,
  accept,
  sourceLabel,
}: {
  target: EncodableTarget;
  /** Extensions this page invites, used only to filter what gets queued. */
  accept: string[];
  sourceLabel: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(0.9);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lossy = target !== 'png';

  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    },
    [],
  );

  const add = useCallback(
    (files: FileList | File[]) => {
      const ok = Array.from(files).filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        return accept.includes(ext) || f.type.startsWith('image/');
      });
      if (!ok.length) return;
      setItems((prev) => [
        ...prev,
        ...ok.map((file) => ({ id: `i${counter++}`, file, status: 'waiting' as Status })),
      ]);
    },
    [accept],
  );

  const convertAll = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'waiting' || i.status === 'failed');
    if (!pending.length) return;
    setRunning(true);

    for (const item of pending) {
      setItems((p) =>
        p.map((i) => (i.id === item.id ? { ...i, status: 'working', error: undefined } : i)),
      );
      try {
        // createImageBitmap decodes off the main thread and handles every
        // format the browser knows, including the ones an <img> tag is fussy
        // about.
        const bitmap = await createImageBitmap(item.file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('This browser would not give us a canvas.');

        // JPEG has no alpha. Without a white ground underneath, anything
        // transparent comes out black rather than empty.
        if (target === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, MIME[target], lossy ? quality : undefined),
        );
        if (!blob) throw new Error('The browser could not write that format.');
        if (blob.type !== MIME[target]) {
          // The silent substitution described at the top of this file. Better
          // to refuse than to hand somebody a mislabelled file.
          throw new Error(`This browser cannot write ${target.toUpperCase()}.`);
        }

        const url = URL.createObjectURL(blob);
        setItems((p) =>
          p.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  url,
                  bytes: blob.size,
                  width: canvas.width,
                  height: canvas.height,
                }
              : i,
          ),
        );
      } catch (e) {
        setItems((p) =>
          p.map((i) =>
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
  }, [items, target, quality, lossy]);

  const downloadZip = useCallback(async () => {
    const done = items.filter((i) => i.status === 'done' && i.url);
    if (!done.length) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const i of done) {
        const data = await (await fetch(i.url!)).blob();
        zip.file(i.file.name.replace(/\.[^.]+$/, '') + '.' + target, data);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${target}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }, [items, target]);

  const doneCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'waiting' || i.status === 'failed').length;
  const saved = items
    .filter((i) => i.status === 'done')
    .reduce((acc, i) => acc + (i.file.size - (i.bytes ?? 0)), 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
        className={`rounded-2xl border-2 border-dashed transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        } ${items.length ? 'p-5' : 'flex min-h-[320px] flex-col items-center justify-center p-8 text-center'}`}
      >
        {items.length === 0 ? (
          <>
            <p className="text-lg font-medium">Drop your {sourceLabel} files here</p>
            <p className="mt-1 text-sm text-ink-soft">
              As many as you like. Nothing is uploaded.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
            >
              Choose files
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm tabular-nums text-ink-soft">
                {items.length} file{items.length === 1 ? '' : 's'}
                {doneCount > 0 && `, ${doneCount} converted`}
              </p>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-accent underline underline-offset-4"
                >
                  Add more
                </button>
                <button
                  onClick={() => {
                    items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
                    setItems([]);
                  }}
                  className="text-ink-faint underline underline-offset-4"
                >
                  Clear
                </button>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded bg-surface-alt">
                    {i.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.url} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] uppercase text-ink-faint">
                        {i.file.name.split('.').pop()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.file.name}</p>
                    <p className="text-xs tabular-nums text-ink-faint">
                      {i.status === 'working' && 'Converting…'}
                      {i.status === 'waiting' && formatBytes(i.file.size)}
                      {i.status === 'done' &&
                        `${i.width}×${i.height} · ${formatBytes(i.file.size)} → ${formatBytes(i.bytes ?? 0)}`}
                      {i.status === 'failed' && (i.error ?? 'Failed')}
                    </p>
                  </div>
                  {i.status === 'done' && i.url && (
                    <a
                      href={i.url}
                      download={i.file.name.replace(/\.[^.]+$/, '') + '.' + target}
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
          accept={accept.map((e) => `.${e}`).join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {lossy ? (
          <label className="block text-sm">
            <span className="flex justify-between">
              Quality
              <span className="tabular-nums text-ink-faint">{Math.round(quality * 100)}%</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={quality}
              disabled={running}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="mt-2 w-full accent-[var(--accent)]"
            />
            <span className="mt-2 block text-xs leading-relaxed text-ink-faint">
              90% is usually indistinguishable from the original at a fraction of
              the size.
            </span>
          </label>
        ) : (
          <p className="text-xs leading-relaxed text-ink-faint">
            PNG is lossless, so there is no quality to set. Every pixel comes out
            exactly as it went in, transparency included.
          </p>
        )}

        <button
          onClick={() => void convertAll()}
          disabled={!pendingCount || running}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {running
            ? 'Converting…'
            : `Convert ${pendingCount || ''} file${pendingCount === 1 ? '' : 's'}`.trim()}
        </button>

        {doneCount > 1 && (
          <button
            onClick={() => void downloadZip()}
            disabled={zipping}
            className="mt-3 w-full rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent disabled:opacity-60"
          >
            {zipping ? 'Building zip…' : `Download all ${doneCount} as a zip`}
          </button>
        )}

        {doneCount > 0 && saved > 0 && (
          <p className="mt-3 text-center text-xs tabular-nums text-ink-faint">
            {formatBytes(saved)} smaller in total
          </p>
        )}
      </div>
    </div>
  );
}
