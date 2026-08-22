'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Works out a tempo from tapping.
 *
 * The arithmetic is the easy part: the gap between taps, averaged, into beats
 * per minute. The judgement is in which taps to average.
 *
 * Averaging every tap since you started is wrong. A tempo drifts, and the
 * first few taps are always the worst, so an average over forty taps is
 * dominated by the moment you were still finding the beat. Averaging only the
 * last few is noisy, because one late tap moves it a long way.
 *
 * So it does both: a running figure over the recent window, which is what you
 * watch while tapping, and the spread across those taps, which tells you
 * whether the number is worth trusting.
 */

/* How many recent gaps to average. Eight is roughly two bars in four four,
   long enough to smooth a shaky hand and short enough to follow a real
   change in tempo. */
const WINDOW = 8;

/* Nothing musical is faster than this, so a gap shorter than it is a double
   tap or a key repeating, not a beat. */
const MIN_GAP_MS = 150;

/* Stop the count after a pause. Coming back to the page an hour later and
   having the old taps still counted would be worse than starting again. */
const RESET_AFTER_MS = 3000;

function round(n: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export default function BpmTapper() {
  const [taps, setTaps] = useState<number[]>([]);
  const [now, setNow] = useState(0);
  const lastTap = useRef(0);

  /* Drives the "waiting" state back on after a pause, without which the panel
     would sit there claiming a tempo nobody is still tapping. */
  useEffect(() => {
    if (taps.length === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [taps.length]);

  const tap = useCallback(() => {
    const at = Date.now();
    if (at - lastTap.current < MIN_GAP_MS) return;
    const stale = at - lastTap.current > RESET_AFTER_MS;
    lastTap.current = at;
    setNow(at);
    setTaps((prev) => (stale ? [at] : [...prev, at]));
  }, []);

  const reset = useCallback(() => {
    setTaps([]);
    lastTap.current = 0;
  }, []);

  /* Space and Enter, because that is what a hand already on the keyboard
     reaches for. Ignored while typing, so the number field still works. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        tap();
      }
      if (e.code === 'Escape') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap, reset]);

  const gaps = taps.slice(1).map((t, i) => t - taps[i]);
  const recent = gaps.slice(-WINDOW);
  const mean = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const bpm = mean > 0 ? 60000 / mean : 0;

  /* The spread across the window, as a share of the average gap. Under about
     three percent is steady; above ten and the number is a guess. */
  const spread = recent.length > 1 && mean > 0
    ? (Math.max(...recent) - Math.min(...recent)) / mean
    : 0;

  const waiting = taps.length > 0 && now - lastTap.current > RESET_AFTER_MS;
  const steadiness = spread < 0.03 ? 'Steady' : spread < 0.1 ? 'Close enough' : 'Uneven';

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <ToolLayout
      title="The count"
      settings={
        <>
          <div>
            <span className={label}>Taps</span>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{taps.length}</p>
          </div>

          {recent.length > 1 && (
            <div>
              <span className={label}>Steadiness</span>
              <p className="mt-1 text-sm">
                {steadiness}
                <span className="ml-2 tabular-nums text-ink-faint">
                  {round(spread * 100, 0)}% spread
                </span>
              </p>
            </div>
          )}

          <div>
            <span className={label}>Half and double</span>
            <p className="mt-1 text-sm tabular-nums text-ink-soft">
              {bpm > 0 ? `${round(bpm / 2)} · ${round(bpm * 2)}` : '—'}
            </p>
          </div>

          <button
            onClick={reset}
            disabled={taps.length === 0}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Start again
          </button>
        </>
      }
    >
      <button
        onClick={tap}
        className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center transition-colors active:border-accent active:bg-accent-soft"
      >
        {bpm > 0 && !waiting ? (
          <>
            <span className="text-6xl font-semibold tabular-nums">{round(bpm)}</span>
            <span className="mt-1 text-sm text-ink-faint">beats per minute</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-medium">
              {waiting ? 'Tap to start again' : 'Tap along'}
            </span>
            <span className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Click here, or press space, in time with the music.
            </span>
          </>
        )}

        {taps.length === 1 && (
          <span className="mt-4 text-sm text-ink-faint">Keep going, two taps make a tempo.</span>
        )}
      </button>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        The figure averages your last {WINDOW} gaps rather than everything since
        you started, so it follows the music instead of being held down by the
        first few taps.
      </p>
    </ToolLayout>
  );
}
