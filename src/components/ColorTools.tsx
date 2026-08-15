'use client';

import { useMemo, useState } from 'react';

/**
 * Colour conversion and contrast, sharing one set of maths.
 *
 * The contrast checker is the one worth getting right. Most of them tell you
 * pass or fail and stop, which leaves you guessing at what would fix it. This
 * one shows the ratio, the four separate thresholds, and a live sample of the
 * actual text, because "4.3 against a required 4.5" is information you can act
 * on and "fail" is not.
 */

export type Rgb = { r: number; g: number; b: number };

export function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (hex) {
    let h = hex[1];
    // Three digit shorthand doubles each digit: #abc is #aabbcc, not #0a0b0c.
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(s);
  if (hsl) {
    const parts = hsl[1].split(/[\s,/]+/).filter(Boolean);
    const h = parseFloat(parts[0]);
    const sat = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    if (![h, sat, l].some(Number.isNaN)) return hslToRgb(h, sat, l);
  }

  return null;
}

export function toHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/** CMYK here is the naive conversion, which is what a screen tool can honestly
    offer. A real print conversion needs an ICC profile for the specific press. */
export function rgbToCmyk({ r, g, b }: Rgb) {
  const R = r / 255, G = g / 255, B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: ((1 - R - k) / (1 - k)) * 100,
    m: ((1 - G - k) / (1 - k)) * 100,
    y: ((1 - B - k) / (1 - k)) * 100,
    k: k * 100,
  };
}

/** Relative luminance, per WCAG. The 0.03928 branch is the sRGB gamma curve and
    dropping it, as plenty of implementations do, shifts the ratio slightly. */
function luminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function Field({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
      <div className="flex items-center gap-3">
        <code className="font-mono text-[13px]">{value}</code>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="text-xs text-accent underline underline-offset-4"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function ColorConverter() {
  const [input, setInput] = useState('#b4530a');
  const rgb = useMemo(() => parseColor(input), [input]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <div
          className="h-40 rounded-xl border border-line"
          style={{ background: rgb ? toHex(rgb) : 'transparent' }}
        />
        <input
          type="color"
          value={rgb ? toHex(rgb) : '#000000'}
          onChange={(e) => setInput(e.target.value)}
          className="mt-3 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="#b4530a, rgb(180 83 10), hsl(25 89% 37%)"
          className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[13px] outline-none focus:border-accent"
        />
        {!rgb && input.trim() && (
          <p className="mt-2 text-xs text-accent">
            Not a colour we recognise. Try hex, rgb() or hsl().
          </p>
        )}
      </div>

      {rgb && (
        <div className="rounded-xl border border-line bg-surface px-4">
          {(() => {
            const hsl = rgbToHsl(rgb);
            const cmyk = rgbToCmyk(rgb);
            const r = Math.round(rgb.r), g = Math.round(rgb.g), b = Math.round(rgb.b);
            return (
              <>
                <Field label="Hex" value={toHex(rgb)} />
                <Field label="RGB" value={`rgb(${r}, ${g}, ${b})`} />
                <Field label="CSS rgb" value={`rgb(${r} ${g} ${b})`} />
                <Field
                  label="HSL"
                  value={`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`}
                />
                <Field
                  label="CMYK"
                  value={`${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%`}
                />
                <div className="py-3 text-xs leading-relaxed text-ink-faint">
                  CMYK here is the straightforward conversion, which is what any
                  screen tool can honestly give you. Matching a specific press
                  needs that printer&rsquo;s own colour profile.
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const THRESHOLDS = [
  { label: 'AA, normal text', min: 4.5 },
  { label: 'AA, large text', min: 3 },
  { label: 'AAA, normal text', min: 7 },
  { label: 'AAA, large text', min: 4.5 },
];

export function ContrastChecker() {
  const [fg, setFg] = useState('#6b6862');
  const [bg, setBg] = useState('#faf9f7');
  const f = parseColor(fg);
  const b = parseColor(bg);
  const ratio = f && b ? contrastRatio(f, b) : null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div
          className="rounded-xl border border-line p-8"
          style={{ background: b ? toHex(b) : undefined, color: f ? toHex(f) : undefined }}
        >
          <p className="text-2xl font-semibold tracking-tight">Large text looks like this</p>
          <p className="mt-3 leading-relaxed">
            And this is what a normal paragraph looks like at the size most body
            text is actually set. If you have to lean in to read this, the number
            beside it is telling you something true.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Small print, the size nobody tests and everybody ships.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['Text colour', fg, setFg],
            ['Background', bg, setBg],
          ].map(([label, val, set]) => (
            <label key={label as string} className="text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {label as string}
              </span>
              <div className="mt-2 flex gap-2">
                <input
                  type="color"
                  value={parseColor(val as string) ? toHex(parseColor(val as string)!) : '#000000'}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface"
                />
                <input
                  value={val as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  spellCheck={false}
                  className="w-full rounded-lg border border-line bg-surface px-3 font-mono text-[13px] outline-none focus:border-accent"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Ratio</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">
          {ratio ? ratio.toFixed(2) : '—'}
          <span className="text-xl text-ink-faint">:1</span>
        </p>

        <ul className="mt-5 space-y-2">
          {THRESHOLDS.map((t) => {
            const pass = ratio !== null && ratio >= t.min;
            const short = ratio !== null ? t.min - ratio : 0;
            return (
              <li key={t.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-soft">{t.label}</span>
                <span className={`shrink-0 tabular-nums ${pass ? 'text-ink' : 'text-accent'}`}>
                  {ratio === null ? '—' : pass ? 'Passes' : `${short.toFixed(2)} short`}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs leading-relaxed text-ink-faint">
          Large text means 18.66px bold or 24px and up. Falling short by a small
          amount is usually one step of lightness away, which is why the gap is
          shown rather than a bare pass or fail.
        </p>
      </div>
    </div>
  );
}
