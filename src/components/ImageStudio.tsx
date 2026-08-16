'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Resize and compress, which are the same operation with a different dial in
 * front of it.
 *
 * Both draw the image onto a canvas at some size and re-encode it at some
 * quality. Splitting them into two components would have meant maintaining the
 * queue, the previews, the zip and the memory cleanup twice, so the mode is a
 * prop and the panel changes rather than the machinery.
 *
 * Resizing keeps the aspect ratio always. A free width and height field looks
 * more capable and is almost never what anybody wants: it produces a stretched
 * image and no warning that it happened.
 */

type Mode = 'compress' | 'resize';
type Status = 'waiting' | 'working' | 'done' | 'failed';

type Item = {
  id: string;
  file: File;
  status: Status;
  url?: string;
  bytes?: number;
  outW?: number;
  outH?: number;
  srcW?: number;
  srcH?: number;
  error?: string;
};

const OUTPUT = {
  keep: { label: 'Same as input', mime: null },
  jpg: { label: 'JPG', mime: 'image/jpeg' },
  png: { label: 'PNG', mime: 'image/png' },
  webp: { label: 'WebP', mime: 'image/webp' },
} as const;

type OutputKey = keyof typeof OUTPUT;

/* Long edge presets, since that is how people actually describe a size: "make
   it fit 1080" rather than a pair of exact numbers. */
const PRESETS = [
  { label: 'Original', px: 0 },
  { label: '2560', px: 2560 },
  { label: '1920', px: 1920 },
  { label: '1280', px: 1280 },
  { label: '1080', px: 1080 },
  { label: '640', px: 640 },
];

let counter = 0;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

export default function ImageStudio({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<Item[]>([]);
  // Resizing keeps a visually lossless default; compressing lets you choose,
  // because trading quality for size is the entire point of that one.
  const [quality, setQuality] = useState(mode === 'compress' ? 0.75 : 0.92);
  const [longEdge, setLongEdge] = useState(mode === 'resize' ? 1920 : 0);
  const [output, setOutput] = useState<OutputKey>(mode === 'compress' ? 'webp' : 'keep');
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    },
    [],
  );

  const add = useCallback((files: FileList | File[]) => {
    const ok = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!ok.length) return;
    setItems((prev) => [
      ...prev,
      ...ok.map((file) => ({ id: `s${counter++}`, file, status: 'waiting' as Status })),
    ]);
  }, []);

  const run = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'waiting' || i.status === 'failed');
    if (!pending.length) return;
    setRunning(true);

    for (const item of pending) {
      setItems((p) =>
        p.map((i) => (i.id === item.id ? { ...i, status: 'working', error: undefined } : i)),
      );
      try {
        const bitmap = await createImageBitmap(item.file);

        // The chosen mime, or the source's own when keeping it. A format the
        // canvas cannot write falls back to PNG rather than lying about it.
        let mime = OUTPUT[output].mime ?? item.file.type;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) mime = 'image/png';

        let w = bitmap.width;
        let h = bitmap.height;
        if (longEdge > 0) {
          const scale = longEdge / Math.max(w, h);
          // Never enlarge. Scaling a small image up invents detail that was
          // never captured and makes the file bigger for a worse picture.
          if (scale < 1) {
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('This browser would not give us a canvas.');
        ctx.imageSmoothingQuality = 'high';
        if (mime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(bitmap, 0, 0, w, h);
        const srcW = bitmap.width;
        const srcH = bitmap.height;
        bitmap.close();

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, mime, mime === 'image/png' ? undefined : quality),
        );
        if (!blob) throw new Error('The browser could not write that format.');

        const url = URL.createObjectURL(blob);
        setItems((p) =>
          p.map((i) =>
            i.id === item.id
              ? { ...i, status: 'done', url, bytes: blob.size, outW: w, outH: h, srcW, srcH }
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
  }, [items, quality, longEdge, output]);

  const downloadZip = useCallback(async () => {
    const done = items.filter((i) => i.status === 'done' && i.url);
    if (!done.length) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const i of done) {
        const data = await (await fetch(i.url!)).blob();
        zip.file(i.file.name.replace(/\.[^.]+$/, '') + '.' + extensionFor(data.type), data);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mode === 'compress' ? 'compressed' : 'resized'}-images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }, [items, mode]);

  const doneItems = items.filter((i) => i.status === 'done');
  const pendingCount = items.filter((i) => i.status === 'waiting' || i.status === 'failed').length;
  const originalTotal = doneItems.reduce((a, i) => a + i.file.size, 0);
  const newTotal = doneItems.reduce((a, i) => a + (i.bytes ?? 0), 0);
  const pct = originalTotal ? Math.round((1 - newTotal / originalTotal) * 100) : 0;

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
        } ${items.length ? 'p-5' : 'flex min-h-[300px] flex-col items-center justify-center p-8 text-center'}`}
      >
        {items.length === 0 ? (
          <>
            <p className="text-lg font-medium">Drop your images here</p>
            <p className="mt-1 text-sm text-ink-soft">
              JPG, PNG, WebP, AVIF, GIF or BMP. Nothing is uploaded.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
            >
              Choose images
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm tabular-nums text-ink-soft">
                {items.length} image{items.length === 1 ? '' : 's'}
                {doneItems.length > 0 && `, ${doneItems.length} done`}
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
              {items.map((i) => {
                const saved = i.bytes != null ? i.file.size - i.bytes : 0;
                return (
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
                        {i.status === 'working' && 'Working…'}
                        {i.status === 'waiting' && formatBytes(i.file.size)}
                        {i.status === 'done' && (
                          <>
                            {i.srcW}×{i.srcH}
                            {i.outW !== i.srcW && ` → ${i.outW}×${i.outH}`} ·{' '}
                            {formatBytes(i.file.size)} → {formatBytes(i.bytes ?? 0)}
                            {/* Asking for a longer edge than the image already
                                has does nothing, since it is never enlarged.
                                Without this the tool looks broken: you set a
                                size, pressed the button, and the dimensions did
                                not move. */}
                            {longEdge > 0 &&
                              i.outW === i.srcW &&
                              Math.max(i.srcW ?? 0, i.srcH ?? 0) <= longEdge &&
                              ` · already under ${longEdge}px`}
                          </>
                        )}
                        {i.status === 'failed' && (i.error ?? 'Failed')}
                      </p>
                    </div>
                    {i.status === 'done' && saved < 0 && (
                      <span
                        title="This came out larger than the original"
                        className="shrink-0 text-xs text-ink-faint"
                      >
                        larger
                      </span>
                    )}
                    {i.status === 'done' && i.url && (
                      <a
                        href={i.url}
                        download={
                          i.file.name.replace(/\.[^.]+$/, '') +
                          '.' +
                          extensionFor(OUTPUT[output].mime ?? i.file.type)
                        }
                        className="shrink-0 text-sm text-accent underline underline-offset-4"
                      >
                        Save
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <fieldset disabled={running}>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {mode === 'resize' ? 'Longest edge' : 'Also shrink to'}
          </legend>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setLongEdge(p.px)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                  longEdge === p.px
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* A number field beside the presets, because a preset list you have
              to fit into is the exact thing this is meant to avoid. */}
          <label className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
            or exactly
            <input
              type="number"
              min={16}
              max={20000}
              value={longEdge || ''}
              placeholder="px"
              onChange={(e) => setLongEdge(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-24 rounded-md border border-line bg-ground px-2 py-1.5 text-sm tabular-nums text-ink outline-none focus:border-accent"
            />
            px
          </label>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            The aspect ratio is kept, and nothing is ever enlarged.
          </p>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Output format
            <select
              value={output}
              onChange={(e) => setOutput(e.target.value as OutputKey)}
              className="mt-2 w-full rounded-lg border border-line bg-ground px-2.5 py-2 text-sm font-medium normal-case tracking-normal text-ink outline-none focus:border-accent"
            >
              {(Object.keys(OUTPUT) as OutputKey[]).map((k) => (
                <option key={k} value={k}>
                  {OUTPUT[k].label}
                </option>
              ))}
            </select>
          </label>

          {/* Only where it is the actual job. Resizing does not need a
              quality question; it needs the picture to survive. */}
          {mode === 'compress' && output !== 'png' && (
            <label className="mt-5 block text-sm">
              <span className="flex justify-between">
                Quality
                <span className="tabular-nums text-ink-faint">{Math.round(quality * 100)}%</span>
              </span>
              <input
                type="range"
                min={0.3}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
              />
              <span className="mt-2 block text-xs leading-relaxed text-ink-faint">
                {quality >= 0.9
                  ? 'Visually identical to the original for most photos.'
                  : quality >= 0.7
                    ? 'The usual sweet spot. Much smaller, hard to tell apart.'
                    : 'Small files, visible softening in detailed areas.'}
              </span>
            </label>
          )}
        </fieldset>

        <button
          onClick={() => void run()}
          disabled={!pendingCount || running}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {running
            ? 'Working…'
            : `${mode === 'resize' ? 'Resize' : 'Compress'} ${pendingCount || ''}`.trim()}
        </button>

        {doneItems.length > 1 && (
          <button
            onClick={() => void downloadZip()}
            disabled={zipping}
            className="mt-3 w-full rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent disabled:opacity-60"
          >
            {zipping ? 'Building zip…' : `Download all ${doneItems.length} as a zip`}
          </button>
        )}

        {doneItems.length > 0 && (
          <p className="mt-3 text-center text-xs tabular-nums text-ink-faint">
            {formatBytes(originalTotal)} → {formatBytes(newTotal)}
            {pct > 0 ? `, ${pct}% smaller` : pct < 0 ? `, ${-pct}% larger` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
