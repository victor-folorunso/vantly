'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import { useSetting } from '@/lib/remember';

/**
 * Four tools you use with your hands rather than by pasting something in:
 * a signature pad, a wheel to spin, a tally counter and a stopwatch.
 */

export type Plaything = 'signature' | 'wheel' | 'tally' | 'stopwatch';

const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

/** Fair random integer below max, without the modulo bias. */
function randomInt(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/* ── Signature ───────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number; w: number };
type Stroke = { color: string; size: number; points: Pt[] };

const INKS = [
  { name: 'Black', value: '#111111' },
  { name: 'Blue', value: '#1d3fbb' },
];

/**
 * Strokes are kept as points and redrawn, rather than painted once, so a
 * stroke can be undone and the download can be drawn again at twice the
 * size without the edges going soft.
 *
 * Line width follows pen pressure where there is a pen, and speed where
 * there is not: a fast stroke thins out, the way ink does.
 */
function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], scale: number, dx = 0, dy = 0) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    const p = s.points;
    if (p.length === 1) {
      ctx.beginPath();
      ctx.arc((p[0].x - dx) * scale, (p[0].y - dy) * scale, (s.size * p[0].w * scale) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1];
      const b = p[i];
      // Each segment curves through the midpoints, which hides the corners
      // between samples on a slow mouse.
      const prev = p[i - 2] ?? a;
      ctx.beginPath();
      ctx.lineWidth = s.size * ((a.w + b.w) / 2) * scale;
      ctx.moveTo(((prev.x + a.x) / 2 - dx) * scale, ((prev.y + a.y) / 2 - dy) * scale);
      ctx.quadraticCurveTo((a.x - dx) * scale, (a.y - dy) * scale, ((a.x + b.x) / 2 - dx) * scale, ((a.y + b.y) / 2 - dy) * scale);
      ctx.stroke();
    }
  }
}

function Signature() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const [color, setColor] = useSetting('signature-generator', 'ink', INKS[0].value);
  const [size, setSize] = useSetting('signature-generator', 'size', 3);

  const redraw = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    if (c.width !== Math.round(width * dpr)) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    drawStrokes(ctx, current.current ? [...strokes, current.current] : strokes, dpr);
  }, [strokes]);

  useEffect(() => {
    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [redraw]);

  const point = (e: React.PointerEvent): Pt => {
    const r = canvas.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let w = 1;
    if (e.pointerType === 'pen' && e.pressure > 0) w = 0.4 + e.pressure * 1.2;
    else if (last.current) {
      const dist = Math.hypot(x - last.current.x, y - last.current.y);
      const dt = Math.max(1, e.timeStamp - last.current.t);
      w = Math.max(0.45, Math.min(1.25, 1.3 - (dist / dt) * 0.35));
    }
    last.current = { x, y, t: e.timeStamp };
    return { x, y, w };
  };

  const down = (e: React.PointerEvent) => {
    // Keeps the stroke going when the pen strays off the pad. It throws for
    // a pointer the browser no longer tracks, which is no reason to drop it.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    last.current = null;
    current.current = { color, size, points: [point(e)] };
    redraw();
  };
  const move = (e: React.PointerEvent) => {
    if (!current.current) return;
    const p = point(e);
    const pts = current.current.points;
    // Ease the width toward the new value so a sudden speed change does not
    // leave a visible step.
    p.w = pts[pts.length - 1].w * 0.6 + p.w * 0.4;
    pts.push(p);
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    const s = current.current;
    current.current = null;
    setStrokes((all) => [...all, s]);
  };

  /** The signature cropped to its ink, at 3x, on a transparent background. */
  const exportPng = async () => {
    const pad = 12;
    const all = strokes.flatMap((s) => s.points.map((p) => ({ ...p, r: (s.size * p.w) / 2 })));
    const minX = Math.min(...all.map((p) => p.x - p.r)) - pad;
    const minY = Math.min(...all.map((p) => p.y - p.r)) - pad;
    const maxX = Math.max(...all.map((p) => p.x + p.r)) + pad;
    const maxY = Math.max(...all.map((p) => p.y + p.r)) + pad;
    const scale = 3;
    const out = document.createElement('canvas');
    out.width = Math.ceil((maxX - minX) * scale);
    out.height = Math.ceil((maxY - minY) * scale);
    drawStrokes(out.getContext('2d')!, strokes, scale, minX, minY);
    return new Promise<Blob>((res) => out.toBlob((b) => res(b!), 'image/png'));
  };

  return (
    <ToolLayout
      title="Pen"
      settings={
        <>
          <div>
            <span className={label}>Ink</span>
            <div className="mt-2 flex gap-2">
              {INKS.map((ink) => (
                <button
                  key={ink.value}
                  onClick={() => setColor(ink.value)}
                  aria-pressed={color === ink.value}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                    color === ink.value ? 'border-accent bg-accent-soft' : 'border-line'
                  }`}
                >
                  <span className="size-3 rounded-full" style={{ background: ink.value }} /> {ink.name}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm">
            <span className="flex justify-between">
              Thickness <span className="tabular-nums text-ink-faint">{size}</span>
            </span>
            <input type="range" min={1.5} max={7} step={0.5} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1.5 w-full" />
          </label>
          <p className="text-xs leading-relaxed text-ink-faint">
            Applies to the next stroke. The download is cropped to the signature, three times the size you drew it, with
            a transparent background so it sits on any page.
          </p>
        </>
      }
      actions={
        <>
          <button
            onClick={() => setStrokes((s) => s.slice(0, -1))}
            disabled={!strokes.length}
            className="text-sm text-ink-soft underline underline-offset-4 disabled:opacity-40"
          >
            Undo
          </button>
          <button
            onClick={() => setStrokes([])}
            disabled={!strokes.length}
            className="text-sm text-ink-soft underline underline-offset-4 disabled:opacity-40"
          >
            Clear
          </button>
          {strokes.length > 0 && (
            <DownloadButton prepare={exportPng} filename="signature.png">
              Download PNG
            </DownloadButton>
          )}
        </>
      }
    >
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
        <canvas
          ref={canvas}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="block h-[300px] w-full cursor-crosshair touch-none sm:h-[360px]"
          aria-label="Signature pad. Draw with a mouse, finger or pen."
        />
        <div className="pointer-events-none absolute inset-x-10 bottom-16 border-b border-neutral-300" />
        {!strokes.length && (
          <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm text-neutral-400">Sign above the line</p>
        )}
      </div>
    </ToolLayout>
  );
}

/* ── Wheel ───────────────────────────────────────────────────────────────── */

const SLICE = ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#14b8a6', '#ec4899'];

function Wheel() {
  const [raw, setRaw] = useSetting('wheel-spinner', 'options', 'Pizza\nSushi\nTacos\nCurry\nBurgers\nSalad');
  const items = useMemo(() => raw.split('\n').map((s) => s.trim()).filter(Boolean), [raw]);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [removeWinner, setRemoveWinner] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const size = c.clientWidth;
    c.width = c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);
    const n = Math.max(items.length, 1);
    const step = (Math.PI * 2) / n;
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(angle);
    for (let i = 0; i < n; i++) {
      // Starts at the top (-90°) so slice 0 sits under the pointer at rest.
      const a0 = -Math.PI / 2 + i * step;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 4, a0, a0 + step);
      ctx.closePath();
      // With an odd count, the last slice would meet the first in the same
      // colour, so it takes the next one along.
      const colour = SLICE[(i === n - 1 && n % SLICE.length === 1 ? i + 1 : i) % SLICE.length];
      ctx.fillStyle = items.length ? colour : '#d4d4d4';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (items[i]) {
        ctx.save();
        ctx.rotate(a0 + step / 2);
        ctx.fillStyle = '#fff';
        const font = Math.max(11, Math.min(20, (r * step) / 3.2));
        ctx.font = `600 ${font}px system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        let text = items[i];
        const room = r - 34;
        while (ctx.measureText(text).width > room && text.length > 1) text = text.slice(0, -2) + '…';
        ctx.fillText(text, r - 18, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(r, r, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, [items, angle]);

  const spin = () => {
    if (items.length < 2 || spinning) return;
    setWinner(null);
    setSpinning(true);
    const n = items.length;
    const pick = randomInt(n);
    const step = (Math.PI * 2) / n;
    // Land somewhere inside the chosen slice, not always on its middle,
    // which would look rigged.
    const offset = (0.15 + (randomInt(1000) / 1000) * 0.7) * step;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const turns = reduce ? 1 : 6 + randomInt(3);
    const start = angle;
    const base = start - (start % (Math.PI * 2));
    const end = base + turns * Math.PI * 2 + (Math.PI * 2 - (pick * step + offset));
    const duration = reduce ? 600 : 5200;
    const t0 = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setAngle(start + (end - start) * eased);
      if (t < 1) setTimeout(tick, 16);
      else {
        setSpinning(false);
        setWinner(items[pick]);
      }
    };
    tick();
  };

  return (
    <ToolLayout
      title="Options"
      settings={
        <>
          <label className="block text-sm">
            <span className={label}>One per line</span>
            <textarea
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setWinner(null); }}
              rows={10}
              disabled={spinning}
              className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <p className="text-xs tabular-nums text-ink-faint">{items.length} option{items.length === 1 ? '' : 's'}</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} />
            Take the winner off the wheel
          </label>
          <p className="text-xs leading-relaxed text-ink-faint">
            The result is chosen with your browser&apos;s cryptographic random numbers before the wheel starts turning,
            so every option has exactly the same chance.
          </p>
        </>
      }
    >
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[460px]">
          <canvas ref={canvas} className="aspect-square w-full" aria-label="Wheel" role="img" />
          <div
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 border-x-[14px] border-t-[26px] border-x-transparent border-t-ink"
          />
        </div>
        <button
          onClick={spin}
          disabled={items.length < 2 || spinning}
          className="mt-6 rounded-xl bg-accent px-10 py-3 text-lg font-semibold text-accent-ink disabled:opacity-60"
        >
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
        {items.length < 2 && <p className="mt-3 text-sm text-ink-faint">Add at least two options.</p>}
        <div aria-live="polite" className="mt-5 min-h-[4.5rem] text-center">
          {winner && (
            <>
              <p className="text-sm text-ink-faint">The wheel says</p>
              <p className="text-3xl font-semibold">{winner}</p>
              {removeWinner && (
                <button
                  onClick={() => {
                    const lines = raw.split('\n');
                    const i = lines.findIndex((l) => l.trim() === winner);
                    if (i >= 0) lines.splice(i, 1);
                    setRaw(lines.join('\n'));
                    setWinner(null);
                  }}
                  className="mt-2 text-sm text-accent underline underline-offset-4"
                >
                  Remove {winner} and spin again
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}

/* ── Tally ───────────────────────────────────────────────────────────────── */

type Counter = { name: string; count: number };

function Tally() {
  const [counters, setCounters] = useSetting<Counter[]>('tally-counter', 'counters', [{ name: 'Count', count: 0 }]);
  const [active, setActiveState] = useState(0);
  // Mirrored in a ref so a key pressed straight after choosing a counter
  // lands on the one just chosen.
  const activeRef = useRef(0);
  const setActive = useCallback((i: number) => {
    activeRef.current = i;
    setActiveState(i);
  }, []);
  const [step, setStep] = useSetting('tally-counter', 'step', 1);
  // The key handler reads the newest counts through this, so it does not
  // have to be torn down and added again on every press.
  const latest = useRef(counters);
  useEffect(() => { latest.current = counters; }, [counters]);

  const bump = useCallback(
    (i: number, by: number) => {
      const next = latest.current.map((c, j) => (j === i ? { ...c, count: c.count + by } : c));
      // Written straight away too, so two presses inside one frame both count.
      latest.current = next;
      setCounters(next);
      setActive(i);
    },
    [setCounters, setActive],
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, button')) return;
      const i = Math.min(activeRef.current, latest.current.length - 1);
      if (e.key === ' ' || e.key === '+' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        bump(i, step);
      } else if (e.key === '-' || e.key === 'ArrowDown') {
        e.preventDefault();
        bump(i, -step);
      } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= latest.current.length) {
        setActive(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [bump, step, setActive]);

  const total = counters.reduce((a, c) => a + c.count, 0);

  return (
    <ToolLayout
      title="Counters"
      settings={
        <>
          <label className="block text-sm">
            <span className={label}>Each click adds</span>
            <input
              type="number"
              min={1}
              value={step}
              onChange={(e) => setStep(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
              className="mt-2 w-24 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
            />
          </label>
          <button
            onClick={() => setCounters([...counters, { name: `Count ${counters.length + 1}`, count: 0 }])}
            disabled={counters.length >= 9}
            className="self-start rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-40"
          >
            Add a counter
          </button>
          <button
            onClick={() => { if (confirm('Set every counter back to zero?')) setCounters(counters.map((c) => ({ ...c, count: 0 }))); }}
            className="self-start text-sm text-ink-faint underline underline-offset-4"
          >
            Reset all
          </button>
          <p className="text-xs leading-relaxed text-ink-faint">
            Space, Enter or the up arrow adds to the highlighted counter, minus or the down arrow takes away, and the
            number keys pick a counter. The counts are kept in this browser, so a reload does not lose them.
          </p>
        </>
      }
      status={counters.length > 1 ? <p className="text-sm tabular-nums text-ink-soft">Total {total.toLocaleString()}</p> : undefined}
    >
      <div className={`grid gap-4 ${counters.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {counters.map((c, i) => (
          <div
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-2xl border bg-surface p-5 ${i === active && counters.length > 1 ? 'border-accent' : 'border-line'}`}
          >
            <div className="flex items-center gap-3">
              {counters.length > 1 && <span className="text-xs tabular-nums text-ink-faint">{i + 1}</span>}
              <input
                value={c.name}
                onChange={(e) => setCounters(counters.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                aria-label="Counter name"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
              />
              {counters.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCounters(counters.filter((_, j) => j !== i)); setActive(0); }}
                  className="text-xs text-ink-faint underline underline-offset-4"
                >
                  Remove
                </button>
              )}
            </div>
            <p className={`my-4 text-center font-semibold tabular-nums ${counters.length > 1 ? 'text-6xl' : 'text-8xl'}`}>
              {c.count.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); bump(i, -step); }}
                aria-label={`Take ${step} from ${c.name}`}
                className="rounded-xl border border-line px-5 py-4 text-2xl font-semibold"
              >
                −
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); bump(i, step); }}
                aria-label={`Add ${step} to ${c.name}`}
                className="flex-1 rounded-xl bg-accent py-4 text-2xl font-semibold text-accent-ink active:scale-[0.99]"
              >
                +{step === 1 ? '' : step}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCounters(counters.map((x, j) => (j === i ? { ...x, count: 0 } : x))); }}
                className="rounded-xl border border-line px-4 text-sm text-ink-soft"
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToolLayout>
  );
}

/* ── Stopwatch and timer ─────────────────────────────────────────────────── */

function clock(ms: number, tenths = true): string {
  const neg = ms < 0;
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${neg ? '-' : ''}${h ? `${h}:` : ''}${mm}:${ss}${tenths ? `.${String(cs).padStart(2, '0')}` : ''}`;
}

/** Elapsed time from the clock, not from counting ticks: a background tab
 *  slows timers down, but the clock keeps going. */
function useTicker(running: boolean) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => force((n) => n + 1), 31);
    return () => clearInterval(id);
  }, [running]);
}

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((at) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.3);
    });
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* No audio, so the flashing title has to do. */
  }
}

function Stopwatch() {
  const [tab, setTab] = useState<'stopwatch' | 'timer'>('stopwatch');

  // Stopwatch
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [banked, setBanked] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  // Timer
  const [mins, setMins] = useState('5');
  const [secs, setSecs] = useState('0');
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [rang, setRang] = useState(false);

  useTicker(startedAt !== null || endsAt !== null);
  // eslint-disable-next-line react-hooks/purity
  const now = performance.now();
  const elapsed = banked + (startedAt !== null ? now - startedAt : 0);
  const remaining = endsAt !== null ? endsAt - now : (left ?? (Number(mins) * 60 + Number(secs)) * 1000);

  useEffect(() => {
    if (endsAt === null) return;
    const ms = endsAt - performance.now();
    const id = setTimeout(() => {
      setEndsAt(null);
      setLeft(0);
      setRang(true);
      beep();
    }, Math.max(0, ms));
    return () => clearTimeout(id);
  }, [endsAt]);

  // The tab title carries the time, so it can be read from another tab.
  useEffect(() => {
    const base = document.title;
    return () => { document.title = base; };
  }, []);
  useEffect(() => {
    const original = document.title.replace(/^[^|]*\| /, '');
    if (tab === 'timer' && (endsAt !== null || rang)) document.title = `${rang ? 'Time is up' : clock(remaining, false)} | ${original}`;
    else if (tab === 'stopwatch' && startedAt !== null) document.title = `${clock(elapsed, false)} | ${original}`;
    else document.title = original;
  });

  const big = 'font-mono text-6xl font-semibold tabular-nums sm:text-8xl';
  const primary = 'rounded-xl bg-accent px-8 py-3 text-lg font-semibold text-accent-ink';
  const secondary = 'rounded-xl border border-line px-8 py-3 text-lg';

  const lapTimes = laps.map((t, i) => t - (laps[i - 1] ?? 0));
  const best = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const worst = lapTimes.length > 1 ? Math.max(...lapTimes) : null;

  return (
    <div>
      <div className="mx-auto mb-8 flex w-fit gap-1 rounded-xl border border-line p-1">
        {(['stopwatch', 'timer'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-lg px-5 py-2 text-sm font-medium ${tab === t ? 'bg-accent-soft text-ink' : 'text-ink-soft'}`}
          >
            {t === 'stopwatch' ? 'Stopwatch' : 'Timer'}
          </button>
        ))}
      </div>

      {tab === 'stopwatch' ? (
        <div className="text-center">
          <p className={big} aria-live="off">{clock(elapsed)}</p>
          <div className="mt-8 flex justify-center gap-3">
            {startedAt === null ? (
              <button onClick={() => setStartedAt(performance.now())} className={primary}>
                {elapsed ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button onClick={() => { setBanked(elapsed); setStartedAt(null); }} className={primary}>
                Stop
              </button>
            )}
            {startedAt !== null ? (
              <button onClick={() => setLaps([...laps, elapsed])} className={secondary}>
                Lap
              </button>
            ) : (
              <button onClick={() => { setBanked(0); setLaps([]); }} disabled={!elapsed} className={`${secondary} disabled:opacity-40`}>
                Reset
              </button>
            )}
          </div>
          {laps.length > 0 && (
            <table className="mx-auto mt-8 w-full max-w-md text-sm">
              <thead>
                <tr className="text-ink-faint">
                  <th className="py-1.5 text-left font-medium">Lap</th>
                  <th className="py-1.5 text-right font-medium">Lap time</th>
                  <th className="py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((t, i) => ({ t, i, lap: lapTimes[i] })).reverse().map(({ t, i, lap }) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-1.5 text-left tabular-nums">{i + 1}</td>
                    <td
                      className={`py-1.5 text-right font-mono tabular-nums ${
                        lap === best ? 'text-green-600 dark:text-green-400' : lap === worst ? 'text-accent' : ''
                      }`}
                    >
                      {clock(lap)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-ink-soft">{clock(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="text-center">
          {endsAt === null && left === null && !rang ? (
            <div className="flex items-end justify-center gap-3">
              {(
                [
                  ['Minutes', mins, setMins, 999],
                  ['Seconds', secs, setSecs, 59],
                ] as const
              ).map(([name, v, set, max]) => (
                <label key={name} className="text-sm text-ink-faint">
                  {name}
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={v}
                    onChange={(e) => set(e.target.value)}
                    className="mt-1 block w-32 rounded-xl border border-line bg-surface px-3 py-3 text-center font-mono text-4xl tabular-nums text-ink outline-none focus:border-accent"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className={`${big} ${rang ? 'animate-pulse text-accent' : ''}`}>{clock(Math.max(0, remaining), false)}</p>
          )}
          {endsAt === null && left === null && !rang && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[1, 3, 5, 10, 15, 25, 30, 60].map((m) => (
                <button key={m} onClick={() => { setMins(String(m)); setSecs('0'); }} className="rounded-lg border border-line px-3 py-1.5 text-sm">
                  {m} min
                </button>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-center gap-3">
            {rang ? (
              <button onClick={() => { setRang(false); setLeft(null); }} className={primary}>
                Done
              </button>
            ) : endsAt === null ? (
              <button
                onClick={() => {
                  const ms = left ?? (Number(mins) * 60 + Number(secs)) * 1000;
                  if (ms > 0) setEndsAt(performance.now() + ms);
                }}
                disabled={left === null && !(Number(mins) * 60 + Number(secs) > 0)}
                className={`${primary} disabled:opacity-60`}
              >
                {left !== null ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button onClick={() => { setLeft(remaining); setEndsAt(null); }} className={primary}>
                Pause
              </button>
            )}
            {(left !== null || endsAt !== null) && !rang && (
              <button onClick={() => { setEndsAt(null); setLeft(null); }} className={secondary}>
                Cancel
              </button>
            )}
          </div>
          <p className="mt-6 text-xs text-ink-faint">
            It beeps three times at zero, and the time shows in the tab title so you can work in another tab. Keep this
            tab open.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Playthings({ tool }: { tool: Plaything }) {
  if (tool === 'signature') return <Signature />;
  if (tool === 'wheel') return <Wheel />;
  if (tool === 'tally') return <Tally />;
  return <Stopwatch />;
}
