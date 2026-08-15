'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Enhancement that is real rather than invented.
 *
 * Everything here is a genuine operation on the pixels that exist: stretching
 * the histogram so the darkest pixel is black and the brightest is white,
 * sharpening with a convolution, adjusting colour. There is no upscaling and no
 * model, so no detail is fabricated. That is a deliberate limit, and the page
 * says so, because "AI enhance" tools mostly hallucinate texture and call it
 * recovery.
 *
 * Auto is the reason people come. It measures the image and picks the numbers
 * rather than asking somebody who does not know what "levels" means to guess.
 *
 * The comparison is a slider over one image rather than two side by side. Two
 * images means comparing two places at once, and the eye is bad at that: the
 * difference has to be held in memory across the gap. A wipe puts before and
 * after in the same square inch.
 */

type Adjust = {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpen: number;
};

const NEUTRAL: Adjust = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpen: 0 };

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Where the histogram actually starts and stops, ignoring the extreme tails.
 *
 * A pure min and max is hostage to a single stray pixel: one blown highlight
 * and the stretch does nothing. Cutting half a percent from each end is what
 * every auto-levels implementation does, for that reason.
 */
function histogramBounds(data: Uint8ClampedArray): { lo: number; hi: number } {
  const hist = new Array(256).fill(0);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) | 0;
    hist[lum]++;
    total++;
  }
  const cut = total * 0.005;
  let acc = 0;
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc > cut) {
      lo = i;
      break;
    }
  }
  acc = 0;
  for (let i = 255; i >= 0; i--) {
    acc += hist[i];
    if (acc > cut) {
      hi = i;
      break;
    }
  }
  return { lo, hi: Math.max(hi, lo + 1) };
}

function sharpenInPlace(src: ImageData, amount: number): ImageData {
  if (amount <= 0) return src;
  const { width: w, height: h, data } = src;
  const out = new Uint8ClampedArray(data);
  const k = amount; // centre weight grows, neighbours pull away
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const centre = data[i + c];
        const around =
          data[i - 4 + c] + data[i + 4 + c] + data[i - w * 4 + c] + data[i + w * 4 + c];
        // Unsharp mask: push the pixel away from the average of its neighbours.
        out[i + c] = clamp(centre + k * (centre - around / 4));
      }
    }
  }
  return new ImageData(out, w, h);
}

function apply(src: ImageData, a: Adjust, autoLevels: boolean): ImageData {
  const data = new Uint8ClampedArray(src.data);
  let lo = 0;
  let hi = 255;
  if (autoLevels) ({ lo, hi } = histogramBounds(src.data));
  const span = hi - lo;

  const contrast = (259 * (a.contrast + 255)) / (255 * (259 - a.contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (autoLevels) {
      r = ((r - lo) / span) * 255;
      g = ((g - lo) / span) * 255;
      b = ((b - lo) / span) * 255;
    }

    r += a.brightness;
    g += a.brightness;
    b += a.brightness;

    r = contrast * (r - 128) + 128;
    g = contrast * (g - 128) + 128;
    b = contrast * (b - 128) + 128;

    // Warmth moves red and blue in opposite directions, which is what a colour
    // temperature control does. Doing it to all three would just be brightness.
    r += a.warmth;
    b -= a.warmth;

    if (a.saturation !== 0) {
      const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const s = 1 + a.saturation / 100;
      r = lum + (r - lum) * s;
      g = lum + (g - lum) * s;
      b = lum + (b - lum) * s;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  return sharpenInPlace(new ImageData(data, src.width, src.height), a.sharpen / 100);
}

const SLIDERS: { key: keyof Adjust; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Brightness', min: -80, max: 80 },
  { key: 'contrast', label: 'Contrast', min: -80, max: 80 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'warmth', label: 'Warmth', min: -50, max: 50 },
  { key: 'sharpen', label: 'Sharpness', min: 0, max: 200 },
];

export default function ImageEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<Adjust>(NEUTRAL);
  const [autoLevels, setAutoLevels] = useState(true);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const sourceRef = useRef<ImageData | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      if (afterUrl) URL.revokeObjectURL(afterUrl);
    },
    [beforeUrl, afterUrl],
  );

  const load = useCallback(async (f: File) => {
    const bitmap = await createImageBitmap(f);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    sourceRef.current = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    setSize({ w: bitmap.width, h: bitmap.height });
    bitmap.close();
    setBeforeUrl(URL.createObjectURL(f));
    setFile(f);
  }, []);

  const render = useCallback(async () => {
    const src = sourceRef.current;
    if (!src) return;
    setBusy(true);
    try {
      const out = apply(src, adjust, autoLevels);
      const canvas = document.createElement('canvas');
      canvas.width = out.width;
      canvas.height = out.height;
      canvas.getContext('2d')!.putImageData(out, 0, 0);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (blob) {
        setAfterUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
    } finally {
      setBusy(false);
    }
  }, [adjust, autoLevels]);

  useEffect(() => {
    if (sourceRef.current) void render();
  }, [render, file]);

  const onMove = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSplit(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onMove(e.clientX);
    const touch = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', touch);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', touch);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [dragging, onMove]);

  if (!file) {
    return (
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-16 text-center transition-colors hover:border-accent">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && void load(e.target.files[0])}
        />
        <span className="text-lg font-medium">Drop a photo here</span>
        <span className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          It is corrected in your browser and never uploaded.
        </span>
      </label>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div
          ref={wrapRef}
          onMouseDown={(e) => {
            setDragging(true);
            onMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setDragging(true);
            onMove(e.touches[0].clientX);
          }}
          className="relative select-none overflow-hidden rounded-xl border border-line bg-surface-alt"
          style={{ cursor: 'ew-resize' }}
        >
          {/* After sits underneath, before is clipped on top. Dragging the
              handle reveals the corrected version from the right. */}
          {/* eslint-disable @next/next/no-img-element */}
          {afterUrl && <img src={afterUrl} alt="Corrected" className="block w-full" draggable={false} />}
          {beforeUrl && (
            <img
              src={beforeUrl}
              alt="Original"
              draggable={false}
              className="absolute inset-0 block h-full w-full object-cover"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            />
          )}
          {/* eslint-enable @next/next/no-img-element */}

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: `${split}%` }}
          >
            <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md">
              <svg viewBox="0 0 24 24" className="size-4 text-black" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 6 4 12l5 6M15 6l5 6-5 6" />
              </svg>
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            Before
          </span>
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            After
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="tabular-nums text-ink-faint">
            {file.name} · {size?.w}×{size?.h}
            {busy && ' · working…'}
          </p>
          <button
            onClick={() => {
              setFile(null);
              sourceRef.current = null;
              setAdjust(NEUTRAL);
            }}
            className="text-ink-faint underline underline-offset-4"
          >
            Use another photo
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={autoLevels}
            onChange={(e) => setAutoLevels(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Auto levels
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
              Stretches the tones so the darkest pixel is black and the lightest
              is white. This is what fixes a flat, hazy photo.
            </span>
          </span>
        </label>

        <div className="mt-5 space-y-4">
          {SLIDERS.map((s) => (
            <label key={s.key} className="block text-sm">
              <span className="flex justify-between">
                {s.label}
                <span className="tabular-nums text-ink-faint">{adjust[s.key]}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                value={adjust[s.key]}
                onChange={(e) => setAdjust((a) => ({ ...a, [s.key]: Number(e.target.value) }))}
                className="mt-1.5 w-full accent-[var(--accent)]"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setAdjust(NEUTRAL)}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft"
          >
            Reset
          </button>
          {afterUrl && (
            <a
              href={afterUrl}
              download={file.name.replace(/\.[^.]+$/, '') + '-enhanced.png'}
              className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-ink"
            >
              Download
            </a>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Nothing here invents detail. Every change is a real operation on the
          pixels already in your photo, so a blurry picture comes out sharper at
          the edges but no closer to being in focus.
        </p>
      </div>
    </div>
  );
}
