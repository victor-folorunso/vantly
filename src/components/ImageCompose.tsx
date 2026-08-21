'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';

/**
 * Joins images together, or stamps text across one.
 *
 * Both draw onto a canvas and hand back a PNG, which is why they share a file.
 *
 * Merging keeps the aspect ratio of every picture. Photos from different
 * cameras rarely match, so the joined edge is scaled to a common width when
 * stacking and a common height when placing side by side. Stretching them to
 * fit would be easier and would look wrong.
 */

type Mode = 'merge' | 'watermark';
type Loaded = { name: string; img: HTMLImageElement; url: string };

async function loadImage(file: File): Promise<Loaded> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('not an image'));
    img.src = url;
  });
  return { name: file.name, img, url };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const POSITIONS = [
  ['top-left', 'Top left'], ['top', 'Top'], ['top-right', 'Top right'],
  ['left', 'Left'], ['centre', 'Centre'], ['right', 'Right'],
  ['bottom-left', 'Bottom left'], ['bottom', 'Bottom'], ['bottom-right', 'Bottom right'],
] as const;

type Position = (typeof POSITIONS)[number][0];

export default function ImageCompose({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<Loaded[]>([]);
  const [direction, setDirection] = useState<'down' | 'across'>('down');
  const [gap, setGap] = useState(0);
  const [background, setBackground] = useState('#ffffff');

  const [text, setText] = useState('© Vantly');
  const [size, setSize] = useState(6);
  const [opacity, setOpacity] = useState(0.55);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [colour, setColour] = useState('#ffffff');
  const [tiled, setTiled] = useState(false);

  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const itemsRef = useRef<Loaded[]>([]);
  itemsRef.current = items;
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    },
    [],
  );

  const add = useCallback(
    async (files: FileList) => {
      setError(null);
      const loaded: Loaded[] = [];
      for (const f of [...files]) {
        try {
          loaded.push(await loadImage(f));
        } catch {
          setError(`${f.name} could not be read as an image.`);
        }
      }
      setItems((prev) => (mode === 'watermark' ? loaded.slice(0, 1) : [...prev, ...loaded]));
    },
    [mode],
  );

  const draw = useCallback(() => {
    if (items.length === 0) return;
    const canvas = document.createElement('canvas');

    if (mode === 'merge') {
      const common =
        direction === 'down'
          ? Math.max(...items.map((i) => i.img.naturalWidth))
          : Math.max(...items.map((i) => i.img.naturalHeight));

      // Each picture scaled to the shared edge, so nothing is stretched.
      const sized = items.map((i) => {
        const scale =
          direction === 'down' ? common / i.img.naturalWidth : common / i.img.naturalHeight;
        return { img: i.img, w: i.img.naturalWidth * scale, h: i.img.naturalHeight * scale };
      });

      canvas.width =
        direction === 'down'
          ? common
          : sized.reduce((n, s) => n + s.w, 0) + gap * (sized.length - 1);
      canvas.height =
        direction === 'down'
          ? sized.reduce((n, s) => n + s.h, 0) + gap * (sized.length - 1)
          : common;

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let offset = 0;
      for (const s of sized) {
        if (direction === 'down') {
          ctx.drawImage(s.img, 0, offset, s.w, s.h);
          offset += s.h + gap;
        } else {
          ctx.drawImage(s.img, offset, 0, s.w, s.h);
          offset += s.w + gap;
        }
      }
    } else {
      const { img } = items[0];
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Sized as a share of the picture, so the stamp looks the same on a
      // phone photo and on a 6000px export.
      const px = Math.round((Math.min(canvas.width, canvas.height) * size) / 100);
      ctx.font = `600 ${px}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = colour;
      ctx.globalAlpha = opacity;
      ctx.textBaseline = 'middle';

      if (tiled) {
        const w = ctx.measureText(text).width;
        ctx.rotate(-Math.PI / 8);
        for (let y = -canvas.height; y < canvas.height * 2; y += px * 4) {
          for (let x = -canvas.width; x < canvas.width * 2; x += w + px * 3) {
            ctx.fillText(text, x, y);
          }
        }
      } else {
        const pad = px;
        const w = ctx.measureText(text).width;
        const left = position.includes('left')
          ? pad
          : position.includes('right')
            ? canvas.width - w - pad
            : (canvas.width - w) / 2;
        const top = position.startsWith('top')
          ? pad + px / 2
          : position.startsWith('bottom')
            ? canvas.height - pad - px / 2
            : canvas.height / 2;
        ctx.textAlign = 'left';
        ctx.fillText(text, left, top);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      setOutSize(blob.size);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    }, 'image/png');
  }, [items, mode, direction, gap, background, text, size, opacity, position, colour, tiled]);

  // Redraw whenever anything changes, so the preview is never behind the
  // controls that produced it.
  useEffect(() => {
    draw();
  }, [draw]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  if (items.length === 0) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) void add(e.dataTransfer.files); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">
          {mode === 'merge' ? 'Drop your pictures here' : 'Drop a picture here'}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'merge'
            ? 'Joined in the order you add them, across or down.'
            : 'Your text, at any size, corner or tiled across the whole thing.'}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose {mode === 'merge' ? 'pictures' : 'a picture'}
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={mode === 'merge'}
          className="sr-only"
          onChange={(e) => { if (e.target.files?.length) void add(e.target.files); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <ToolLayout
      settings={
        <>
          {mode === 'merge' ? (
            <>
              <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
                {(['down', 'across'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    aria-pressed={direction === d}
                    className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                      direction === d ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <label className="block text-sm">
                <span className="flex justify-between">
                  Gap
                  <span className="tabular-nums text-ink-faint">{gap}px</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--accent)]"
                />
              </label>

              {gap > 0 && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="size-10 cursor-pointer rounded-lg border border-line bg-surface"
                  />
                  <span className="text-sm text-ink-soft">Gap colour</span>
                </div>
              )}

              <div>
                <span className={label}>{items.length} pictures</span>
                <ul className="mt-2 space-y-1.5">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{it.name}</span>
                      <button
                        onClick={() =>
                          setItems((prev) => {
                            const next = [...prev];
                            if (i === 0) return next;
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            return next;
                          })
                        }
                        disabled={i === 0}
                        aria-label="Move up"
                        className="rounded border border-line px-2 text-xs disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() =>
                          setItems((prev) => {
                            const next = [...prev];
                            if (i === next.length - 1) return next;
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            return next;
                          })
                        }
                        disabled={i === items.length - 1}
                        aria-label="Move down"
                        className="rounded border border-line px-2 text-xs disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setItems((prev) => prev.filter((_, pi) => pi !== i))}
                        aria-label="Remove"
                        className="text-ink-faint hover:text-accent"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 text-sm text-accent underline underline-offset-4"
                >
                  Add more
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className={label}>Text</span>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                />
              </label>

              <label className="block text-sm">
                <span className="flex justify-between">
                  Size
                  <span className="tabular-nums text-ink-faint">{size}%</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--accent)]"
                />
              </label>

              <label className="block text-sm">
                <span className="flex justify-between">
                  Opacity
                  <span className="tabular-nums text-ink-faint">{Math.round(opacity * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                  className="mt-1.5 w-full accent-[var(--accent)]"
                />
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="size-10 cursor-pointer rounded-lg border border-line bg-surface"
                />
                <span className="text-sm text-ink-soft">Colour</span>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={tiled}
                  onChange={(e) => setTiled(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Repeat across the whole picture
              </label>

              {!tiled && (
                <div>
                  <span className={label}>Where</span>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {POSITIONS.map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => setPosition(id)}
                        aria-pressed={position === id}
                        title={name}
                        className={`rounded-lg border py-2.5 text-xs transition-colors ${
                          position === id
                            ? 'border-accent bg-accent-soft text-accent'
                            : 'border-line text-ink-soft hover:text-ink'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => {
              items.forEach((i) => URL.revokeObjectURL(i.url));
              setItems([]);
              setOutUrl(null);
            }}
            className="text-sm text-ink-faint underline underline-offset-4"
          >
            Start again
          </button>
        </>
      }
      status={outUrl ? `PNG, ${formatBytes(outSize)}` : null}
      actions={
        outUrl ? (
          <DownloadButton
            href={outUrl}
            filename={mode === 'merge' ? 'merged.png' : 'watermarked.png'}
          >
            Download PNG
          </DownloadButton>
        ) : null
      }
    >
      {outUrl ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={outUrl} alt="The result" className="block w-full" />
        </div>
      ) : (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-line bg-surface text-sm text-ink-faint">
          The result appears here.
        </div>
      )}
      {error && <p className="mt-3 text-sm text-accent">{error}</p>}
    </ToolLayout>
  );
}
