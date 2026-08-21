'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * SVG to PNG, entirely in the browser.
 *
 * The competitors cap free output at something like 500px and sell the crisp
 * export. There is no cost reason for that cap. Rasterising a vector is the
 * browser's own Canvas API doing work on the user's machine, so the resolution
 * is free to us at any size and the file never leaves their computer.
 *
 * The one real constraint is the canvas area limit, which varies by browser and
 * is roughly 16384px per side. 8K is well inside it.
 */

type Preset = { label: string; width: number | null; note: string };

const PRESETS: Preset[] = [
  { label: 'Original', width: null,  note: 'as authored' },
  { label: '1080p',    width: 1920,  note: '1920px wide' },
  { label: '4K',       width: 3840,  note: '3840px wide' },
  { label: '8K',       width: 7680,  note: '7680px wide' },
];

type Source = {
  name: string;
  url: string;
  width: number;
  height: number;
};

/** Bytes, rendered the way a person reads them. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * An SVG can state its size in three different ways and plenty state it in
 * none. Width and height attributes win, then the viewBox, and a square
 * fallback last so a malformed file still converts to something rather than
 * failing with nothing on screen.
 */
function readIntrinsicSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const el = doc.documentElement;

  const attr = (name: string) => {
    const raw = el.getAttribute(name);
    if (!raw) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const w = attr('width');
  const h = attr('height');
  if (w && h) return { width: w, height: h };

  const viewBox = el.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(parseFloat);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  return { width: 512, height: 512 };
}

export default function SvgToPng() {
  const [source, setSource] = useState<Source | null>(null);
  const [presetIndex, setPresetIndex] = useState(2);
  const [transparent, setTransparent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; bytes: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs are leaked memory until revoked, and this page can churn
  // through a lot of them while somebody tries different sizes.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
  }, [source]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const accept = useCallback(async (file: File) => {
    setError(null);
    setResult(null);

    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setError('That is not an SVG. Pick a file ending in .svg.');
      return;
    }

    const text = await file.text();
    if (!text.includes('<svg')) {
      setError('That file does not contain an SVG.');
      return;
    }

    const { width, height } = readIntrinsicSize(text);
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    setSource({ name: file.name, url: URL.createObjectURL(blob), width, height });
  }, []);

  const convert = useCallback(async () => {
    if (!source) return;
    setBusy(true);
    setError(null);

    try {
      const preset = PRESETS[presetIndex];
      const scale = preset.width ? preset.width / source.width : 1;
      const outW = Math.round(source.width * scale);
      const outH = Math.round(source.height * scale);

      const img = new Image();
      img.decoding = 'sync';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error('The browser could not render that SVG. It may reference fonts or images it cannot reach.'));
        img.src = source.url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get a drawing context.');

      if (!transparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }
      ctx.drawImage(img, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('The image was too large for this browser to encode. Try a smaller size.');

      setResult({ url: URL.createObjectURL(blob), bytes: blob.size, w: outW, h: outH });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [source, presetIndex, transparent]);

  const preset = PRESETS[presetIndex];
  const outW = source ? Math.round(preset.width ? preset.width : source.width) : 0;
  const outH = source
    ? Math.round(preset.width ? source.height * (preset.width / source.width) : source.height)
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
      {/* Drop zone and preview */}
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
          if (f) void accept(f);
        }}
        className={`order-1 min-w-0 lg:order-2 rounded-lg border-2 border-dashed p-8 min-h-[340px] flex flex-col items-center justify-center text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        {source ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source.url}
              alt=""
              className="max-h-52 max-w-full"
              style={{ background: transparent ? 'none' : '#fff' }}
            />
            <p className="mt-5 text-sm text-ink-soft break-all">{source.name}</p>
            <p className="text-sm text-ink-faint">
              {Math.round(source.width)} × {Math.round(source.height)} as authored
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 text-sm text-accent underline underline-offset-4"
            >
              Choose a different file
            </button>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">Drop an SVG here</p>
            <p className="mt-1 text-sm text-ink-soft">Nothing is uploaded. It stays on your machine.</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-md bg-accent text-accent-ink px-4 py-2 text-sm font-medium"
            >
              Choose a file
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void accept(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Controls */}
      <div className="order-2 lg:order-1 lg:sticky lg:top-20 rounded-lg border border-line bg-surface p-5">
        <fieldset disabled={!source} className="disabled:opacity-50">
          <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Output size
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => {
                  setPresetIndex(i);
                  setResult(null);
                }}
                className={`rounded-md border px-3 py-2 text-sm text-left ${
                  i === presetIndex
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}
              >
                <span className="block font-medium">{p.label}</span>
                <span className="block text-xs text-ink-faint">{p.note}</span>
              </button>
            ))}
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => {
                setTransparent(e.target.checked);
                setResult(null);
              }}
              className="size-4 accent-[var(--accent)]"
            />
            Transparent background
          </label>

          {source && (
            <p className="mt-4 text-sm text-ink-soft tabular-nums">
              Exports at {outW} × {outH}
            </p>
          )}

          <button
            onClick={() => void convert()}
            disabled={!source || busy}
            className="mt-4 w-full rounded-md bg-accent text-accent-ink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? 'Rendering…' : 'Convert to PNG'}
          </button>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 rounded-md border border-line bg-surface-alt p-4">
            <p className="text-sm tabular-nums">
              {result.w} × {result.h} PNG, {formatBytes(result.bytes)}
            </p>
            <a
              href={result.url}
              download={(source?.name.replace(/\.svg$/i, '') ?? 'image') + `-${result.w}.png`}
              className="mt-3 block w-full rounded-md border border-accent text-accent text-center px-4 py-2 text-sm font-semibold"
            >
              Download PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
