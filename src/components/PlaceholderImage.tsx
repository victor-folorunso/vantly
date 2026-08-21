'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSetting } from '@/lib/remember';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';

/**
 * Makes a placeholder image at whatever size is needed.
 *
 * Drawn on a canvas, so there is no service to call and no hotlinked URL that
 * stops resolving in two years. That is the difference worth having: the
 * usual placeholder services put a live dependency into a mockup, and mockups
 * outlive the services.
 *
 * The size pages pass their own dimensions in and everything else is the
 * same tool, because somebody looking for 1200x630 is not looking for a
 * placeholder generator, they are looking for the number a brief gave them.
 */

const PALETTES: { name: string; bg: string; fg: string }[] = [
  { name: 'Grey', bg: '#d8d5cf', fg: '#5b5852' },
  { name: 'Slate', bg: '#2f333b', fg: '#aab1bd' },
  { name: 'Sand', bg: '#e8dcc8', fg: '#7a6a4f' },
  { name: 'Mint', bg: '#cfe5dc', fg: '#3f6b5c' },
  { name: 'Blush', bg: '#eddad6', fg: '#8a5b52' },
];

const MAX = 5000;

function clamp(n: number): number {
  return Math.max(1, Math.min(MAX, Math.round(n) || 1));
}

export default function PlaceholderImage({
  width: initialWidth = 800,
  height: initialHeight = 600,
  fixed = false,
}: {
  width?: number;
  height?: number;
  /** Size pages lock the dimensions, the general tool does not. */
  fixed?: boolean;
}) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [label, setLabel] = useState('');
  const [palette, setPalette] = useSetting('placeholder', 'palette', 0);
  const [format, setFormat] = useSetting<'png' | 'jpg' | 'webp'>('placeholder', 'format', 'png');
  const [showGrid, setShowGrid] = useSetting('placeholder', 'grid', true);
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = clamp(width);
    const h = clamp(height);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    const { bg, fg } = PALETTES[palette];

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (showGrid) {
      // The diagonals are the convention, and they earn their place: they make
      // it obvious at a glance when a mockup has stretched the image out of
      // proportion, which a flat rectangle hides.
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = Math.max(1, Math.min(w, h) / 400);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const text = label.trim() || `${w} × ${h}`;
    // Sized against the smaller edge so a leaderboard banner and a skyscraper
    // both end up with text that fits.
    let fontSize = Math.min(w, h) / 6;
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    do {
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
      if (ctx.measureText(text).width <= w * 0.82) break;
      fontSize -= Math.max(1, fontSize * 0.06);
    } while (fontSize > 6);

    ctx.fillText(text, w / 2, h / 2);

    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSize(blob.size);
        setUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      },
      mime,
      format === 'png' ? undefined : 0.9,
    );
  }, [width, height, label, palette, format, showGrid]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const fieldLabel = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <ToolLayout
      settings={
        <>
          {!fixed && (
            <div className="flex items-end gap-3">
              <label className="block text-sm">
                <span className={fieldLabel}>Width</span>
                <input
                  type="number"
                  min={1}
                  max={MAX}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 1)}
                  className="mt-2 w-28 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
                />
              </label>
              <span className="pb-3 text-ink-faint">×</span>
              <label className="block text-sm">
                <span className={fieldLabel}>Height</span>
                <input
                  type="number"
                  min={1}
                  max={MAX}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 1)}
                  className="mt-2 w-28 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
                />
              </label>
            </div>
          )}

          <label className="block text-sm">
            <span className={fieldLabel}>Text on it</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${clamp(width)} × ${clamp(height)}`}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>

          <div>
            <span className={fieldLabel}>Colour</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPalette(i)}
                  aria-pressed={palette === i}
                  title={p.name}
                  className={`size-9 rounded-lg border-2 transition-colors ${
                    palette === i ? 'border-accent' : 'border-line'
                  }`}
                  style={{ background: p.bg }}
                >
                  <span className="block size-full rounded-md" style={{ color: p.fg }} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={fieldLabel}>Format</span>
            <div className="mt-2 inline-flex rounded-lg border border-line p-0.5 text-sm">
              {(['png', 'jpg', 'webp'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  className={`rounded-md px-3 py-1 font-medium uppercase transition-colors ${
                    format === f ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Diagonal lines
          </label>
        </>
      }
      status={`${clamp(width)} × ${clamp(height)} pixels, downloaded at full size`}
      actions={
        url ? (
          <DownloadButton
            href={url}
            filename={`placeholder-${clamp(width)}x${clamp(height)}.${format}`}
          >
            Download, {size < 1024 ? `${size} B` : `${(size / 1024).toFixed(0)} KB`}
          </DownloadButton>
        ) : null
      }
    >
        <div className="mt-2 flex min-h-[16rem] items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface p-4">
          {/* Shown at whatever fits rather than at full size, so a 1920 wide
              image does not force the page sideways on a phone. */}
          <canvas ref={canvasRef} className="max-h-[28rem] max-w-full object-contain" />
        </div>
    </ToolLayout>
  );
}
