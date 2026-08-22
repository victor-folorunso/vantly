'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { parseColor, toHex, rgbToHsl, rgbToCmyk, contrastRatio, type Rgb } from './ColorTools';

/**
 * Two ways into a palette, and several ways out.
 *
 * In: pull the colours out of an image, or build a set of harmonies from one
 * colour you already have. Those are the two situations people are actually in,
 * and a tool that only does one of them sends half its visitors away.
 *
 * Out: hex, CSS custom properties, Tailwind, SCSS, JSON. Copying six hex codes
 * one at a time and then typing them into a config is the tedious part, so the
 * tool does that rather than stopping at a row of swatches.
 *
 * Extraction uses `quantize`, the MIT median-cut implementation that Color
 * Thief itself is built on. Writing another one would take a day and be worse:
 * median cut is thirty years old and this version is already the one everybody
 * has tested.
 */

type ExportKind = 'hex' | 'css' | 'tailwind' | 'scss' | 'json';

function hslString(c: Rgb): string {
  const { h, s, l } = rgbToHsl(c);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/** Black or white, whichever is actually readable on this swatch. */
function readableOn(c: Rgb): string {
  const white = contrastRatio(c, { r: 255, g: 255, b: 255 });
  const black = contrastRatio(c, { r: 0, g: 0, b: 0 });
  return white >= black ? '#ffffff' : '#000000';
}

function rotate(c: Rgb, degrees: number): Rgb {
  const { h, s, l } = rgbToHsl(c);
  const next = (((h + degrees) % 360) + 360) % 360;
  return parseColor(`hsl(${next} ${s}% ${l}%)`)!;
}

function withLightness(c: Rgb, l: number): Rgb {
  const { h, s } = rgbToHsl(c);
  return parseColor(`hsl(${h} ${s}% ${Math.max(0, Math.min(100, l))}%)`)!;
}

const HARMONIES: Record<string, { label: string; note: string; build: (c: Rgb) => Rgb[] }> = {
  shades: {
    label: 'Shades',
    note: 'One hue at nine lightness steps. This is what a design system actually needs, and what most palette generators do not give you.',
    build: (c) => [95, 85, 75, 65, 55, 45, 35, 25, 15].map((l) => withLightness(c, l)),
  },
  complementary: {
    label: 'Complementary',
    note: 'Opposite on the wheel. High contrast, easy to overdo.',
    build: (c) => [c, rotate(c, 180)],
  },
  analogous: {
    label: 'Analogous',
    note: 'Neighbours on the wheel. Calm, and safe for backgrounds.',
    build: (c) => [rotate(c, -60), rotate(c, -30), c, rotate(c, 30), rotate(c, 60)],
  },
  triadic: {
    label: 'Triadic',
    note: 'Three points evenly spaced. Balanced without being flat.',
    build: (c) => [c, rotate(c, 120), rotate(c, 240)],
  },
  split: {
    label: 'Split complementary',
    note: 'The contrast of complementary with less of the fight.',
    build: (c) => [c, rotate(c, 150), rotate(c, 210)],
  },
  tetradic: {
    label: 'Tetradic',
    note: 'Two complementary pairs. Needs one colour to dominate or it falls apart.',
    build: (c) => [c, rotate(c, 90), rotate(c, 180), rotate(c, 270)],
  },
};

function exportAs(kind: ExportKind, colors: Rgb[]): string {
  const hex = colors.map(toHex);
  switch (kind) {
    case 'hex':
      return hex.join('\n');
    case 'css':
      return ':root {\n' + hex.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n') + '\n}';
    case 'tailwind':
      return (
        'theme: {\n  extend: {\n    colors: {\n      brand: {\n' +
        hex.map((h, i) => `        ${(i + 1) * 100}: '${h}',`).join('\n') +
        '\n      },\n    },\n  },\n}'
      );
    case 'scss':
      return hex.map((h, i) => `$color-${i + 1}: ${h};`).join('\n');
    case 'json':
      return JSON.stringify(
        colors.map((c) => ({ hex: toHex(c), rgb: `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)})`, hsl: hslString(c) })),
        null,
        2,
      );
  }
}

function Swatch({ color, onPick }: { color: Rgb; onPick?: (c: Rgb) => void }) {
  const [copied, setCopied] = useState(false);
  const hex = toHex(color);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
        onPick?.(color);
      }}
      title={`${hex}  ·  ${hslString(color)}`}
      className="group relative flex h-24 flex-1 min-w-[92px] flex-col justify-end rounded-lg border border-line p-2 transition-transform hover:scale-[1.02]"
      style={{ background: hex, color: readableOn(color) }}
    >
      <span className="font-mono text-[11px] opacity-80">{copied ? 'Copied' : hex}</span>
    </button>
  );
}

export default function PaletteTool() {
  const [mode, setMode] = useState<'image' | 'harmony'>('image');
  const [base, setBase] = useState('#b4530a');
  const [harmony, setHarmony] = useState<keyof typeof HARMONIES>('shades');
  const [extracted, setExtracted] = useState<Rgb[]>([]);
  const [count, setCount] = useState(6);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind>('hex');
  const [copiedExport, setCopiedExport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const extract = useCallback(
    async (file: File, n: number) => {
      setBusy(true);
      try {
        const bitmap = await createImageBitmap(file);
        // Downscaled before sampling. A 12 megapixel photo has far more pixels
        // than the answer needs, and quantising all of them is slow for a
        // result that does not change.
        const scale = Math.min(1, 200 / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();

        const { data } = ctx.getImageData(0, 0, w, h);
        const pixels: [number, number, number][] = [];
        for (let i = 0; i < data.length; i += 4) {
          // Skip anything mostly transparent, and skip near-white, which
          // otherwise dominates every palette taken from a product photo.
          if (data[i + 3] < 125) continue;
          if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) continue;
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
        if (!pixels.length) return setExtracted([]);

        const quantize = (await import('quantize')).default;
        const map = quantize(pixels, Math.max(2, n));
        const palette = (map ? map.palette() : []) as [number, number, number][];
        setExtracted(palette.slice(0, n).map(([r, g, b]) => ({ r, g, b })));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    if (file) void extract(file, count);
  }, [file, count, extract]);

  const baseRgb = parseColor(base);
  const colors = useMemo(() => {
    if (mode === 'image') return extracted;
    return baseRgb ? HARMONIES[harmony].build(baseRgb) : [];
  }, [mode, extracted, baseRgb, harmony]);

  const exported = colors.length ? exportAs(exportKind, colors) : '';

  return (
    <ToolLayout
      settings={
        <>
          <div className="flex flex-wrap gap-2">
            {(['image', 'harmony'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                  m === mode
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}
              >
                {m === 'image' ? 'From an image' : 'From one colour'}
              </button>
            ))}
          </div>

          {mode === 'image' ? (
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface text-center transition-colors hover:border-accent">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(URL.createObjectURL(f));
                    setFile(f);
                  }}
                />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-44 w-full object-cover" />
                ) : (
                  <span className="block p-8">
                    <span className="block font-medium">Choose an image</span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      Nothing is uploaded.
                    </span>
                  </span>
                )}
              </label>

              <label className="mt-4 block text-sm">
                <span className="flex justify-between">
                  Colours
                  <span className="tabular-nums text-ink-faint">{count}</span>
                </span>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <label className="text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Starting colour
                </span>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={baseRgb ? toHex(baseRgb) : '#000000'}
                    onChange={(e) => setBase(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface"
                  />
                  <input
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                    spellCheck={false}
                    className="w-44 rounded-lg border border-line bg-surface px-3 font-mono text-[13px] outline-none focus:border-accent"
                  />
                </div>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(HARMONIES) as (keyof typeof HARMONIES)[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setHarmony(k)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      k === harmony
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line text-ink-soft hover:border-ink-faint'
                    }`}
                  >
                    {HARMONIES[k].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      }
    >
      {mode === 'image' ? (
        <div>
          {busy ? (
            <p className="text-sm text-ink-soft">Reading the image…</p>
          ) : colors.length ? (
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <Swatch key={i} color={c} onPick={(picked) => setBase(toHex(picked))} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Pick an image and its colours appear here.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            {HARMONIES[harmony].note}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <Swatch key={i} color={c} />
            ))}
          </div>
        </>
      )}

      {colors.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Copy as
            </span>
            {(['hex', 'css', 'tailwind', 'scss', 'json'] as ExportKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setExportKind(k)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  k === exportKind
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}
              >
                {k === 'css' ? 'CSS variables' : k.toUpperCase()}
              </button>
            ))}
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(exported);
                setCopiedExport(true);
                setTimeout(() => setCopiedExport(false), 1500);
              }}
              className="ml-auto rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink"
            >
              {copiedExport ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface-alt p-4 font-mono text-[12px] leading-relaxed">
            {exported}
          </pre>
        </div>
      )}
    </ToolLayout>
  );
}
