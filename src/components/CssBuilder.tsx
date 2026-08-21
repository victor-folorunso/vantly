'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Builds a gradient or a box shadow, and shows it at full size.
 *
 * Both are the same tool underneath: move some sliders, read the CSS, copy it.
 * They are separate pages because they are separate searches.
 *
 * The preview is large on purpose. A gradient judged in a 100px swatch looks
 * nothing like the same gradient across a hero, and banding only shows at
 * size.
 */

type Mode = 'gradient' | 'shadow';

type Stop = { color: string; at: number };

const PRESETS: { name: string; stops: Stop[]; angle: number }[] = [
  { name: 'Dusk', angle: 160, stops: [{ color: '#2b1055', at: 0 }, { color: '#7597de', at: 100 }] },
  { name: 'Citrus', angle: 90, stops: [{ color: '#f8b500', at: 0 }, { color: '#fceabb', at: 100 }] },
  { name: 'Moss', angle: 135, stops: [{ color: '#134e5e', at: 0 }, { color: '#71b280', at: 100 }] },
  { name: 'Ember', angle: 45, stops: [{ color: '#7a1f1f', at: 0 }, { color: '#f26d5b', at: 100 }] },
];

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
  };
}

export default function CssBuilder({ mode }: { mode: Mode }) {
  /* Gradient */
  const [angle, setAngle] = useState(160);
  const [stops, setStops] = useState<Stop[]>(PRESETS[0].stops);
  const [radial, setRadial] = useState(false);

  /* Shadow */
  const [x, setX] = useState(0);
  const [y, setY] = useState(10);
  const [blur, setBlur] = useState(30);
  const [spread, setSpread] = useState(-6);
  const [shadowColor, setShadowColor] = useState('#0b1020');
  const [opacity, setOpacity] = useState(0.25);
  const [inset, setInset] = useState(false);

  const { copied, copy } = useCopy();

  const css = useMemo(() => {
    if (mode === 'gradient') {
      const list = [...stops]
        .sort((a, b) => a.at - b.at)
        .map((s) => `${s.color} ${s.at}%`)
        .join(', ');
      return radial
        ? `background: radial-gradient(circle at 50% 50%, ${list});`
        : `background: linear-gradient(${angle}deg, ${list});`;
    }
    const hex = shadowColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `box-shadow: ${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity});`;
  }, [mode, angle, stops, radial, x, y, blur, spread, shadowColor, opacity, inset]);

  const style = useMemo(() => {
    const value = css.slice(css.indexOf(':') + 1, -1).trim();
    return mode === 'gradient' ? { background: value } : { boxShadow: value };
  }, [css, mode]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  const slider = (
    name: string,
    value: number,
    set: (n: number) => void,
    min: number,
    max: number,
    suffix = 'px',
  ) => (
    <label className="block text-sm">
      <span className="flex justify-between">
        {name}
        <span className="tabular-nums text-ink-faint">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-1.5 w-full accent-[var(--accent)]"
      />
    </label>
  );

  return (
    <ToolLayout
      settings={
        <>
          {mode === 'gradient' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setStops(p.stops);
                      setAngle(p.angle);
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {stops.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) =>
                        setStops((prev) => prev.map((p, pi) => (pi === i ? { ...p, color: e.target.value } : p)))
                      }
                      className="size-10 cursor-pointer rounded-lg border border-line bg-surface"
                    />
                    <input
                      value={s.color}
                      onChange={(e) =>
                        setStops((prev) => prev.map((p, pi) => (pi === i ? { ...p, color: e.target.value } : p)))
                      }
                      className="w-28 rounded-lg border border-line bg-surface px-2 py-2 font-mono text-sm outline-none focus:border-accent"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={s.at}
                      onChange={(e) =>
                        setStops((prev) =>
                          prev.map((p, pi) => (pi === i ? { ...p, at: Number(e.target.value) } : p)),
                        )
                      }
                      className="flex-1 accent-[var(--accent)]"
                    />
                    {stops.length > 2 && (
                      <button
                        onClick={() => setStops((prev) => prev.filter((_, pi) => pi !== i))}
                        aria-label="Remove this colour"
                        className="text-ink-faint hover:text-accent"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setStops((prev) => [...prev, { color: '#ffffff', at: 100 }])}
                  className="text-sm text-accent underline underline-offset-4"
                >
                  Add a colour
                </button>
              </div>

              {!radial && slider('Angle', angle, setAngle, 0, 360, '°')}

              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={radial}
                  onChange={(e) => setRadial(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Radial instead of linear
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {slider('Across', x, setX, -80, 80)}
              {slider('Down', y, setY, -80, 80)}
              {slider('Blur', blur, setBlur, 0, 150)}
              {slider('Spread', spread, setSpread, -60, 60)}
              <label className="block text-sm">
                <span className="flex justify-between">
                  Opacity
                  <span className="tabular-nums text-ink-faint">{Math.round(opacity * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                  className="mt-1.5 w-full accent-[var(--accent)]"
                />
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="size-10 cursor-pointer rounded-lg border border-line bg-surface"
                />
                <input
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="w-32 rounded-lg border border-line bg-surface px-2 py-2 font-mono text-sm outline-none focus:border-accent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={inset}
                  onChange={(e) => setInset(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Inside the box instead of under it
              </label>
            </div>
          )}
        </>
      }
    >
        <span className={label}>Preview</span>
        {mode === 'gradient' ? (
          <div className="mt-2 h-72 rounded-2xl border border-line" style={style} />
        ) : (
          <div className="mt-2 flex h-72 items-center justify-center rounded-2xl border border-line bg-surface">
            <div className="size-40 rounded-2xl bg-[var(--paper)]" style={style} />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className={label}>CSS</span>
          <button onClick={() => copy(css)} className="text-sm text-accent underline underline-offset-4">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-[13px]">
          {css}
        </pre>
    </ToolLayout>
  );
}
