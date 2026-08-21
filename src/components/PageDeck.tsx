'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Shows rendered pages: one at a time or all of them, enlarged on demand, and
 * reordered where the tool allows it.
 *
 * A deck and a document want opposite things. Somebody opening a PowerPoint
 * wants to step through it the way it was meant to be read. Somebody opening a
 * twelve page contract wants to scroll. Neither is right for both, so it is a
 * setting, defaulted to whatever that file usually wants.
 *
 * Pages are labelled by their position rather than by the page they came from,
 * because once they have been reordered the original number is a lie.
 *
 * Used by every viewer rather than written per tool, so the arrows, the
 * counter, the enlarge view and the keyboard shortcuts behave the same
 * everywhere.
 */

export type RenderedPage = { page: number; url: string };
export type DeckMode = 'one' | 'all';

/* A slide, a page, a sheet. The label follows the file, because "Page 3 of 9"
   on a PowerPoint is not what anyone calls it. */
export type PageNoun = 'slide' | 'page' | 'sheet';

export default function PageDeck({
  pages,
  noun = 'page',
  defaultMode = 'all',
  busy,
  onMove,
}: {
  pages: RenderedPage[];
  noun?: PageNoun;
  defaultMode?: DeckMode;
  busy?: string | null;
  /** Supplied only by tools that can reorder. Absent means no arrange controls. */
  onMove?: (from: number, to: number) => void;
}) {
  const [mode, setMode] = useState<DeckMode>(defaultMode);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [actualSize, setActualSize] = useState(false);

  const count = pages.length;
  const at = Math.min(index, Math.max(0, count - 1));

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(0, count - 1))),
    [count],
  );

  const move = useCallback(
    (from: number, delta: number) => {
      const to = from + delta;
      if (!onMove || to < 0 || to >= count) return;
      onMove(from, to);
      // Follow the page that was moved, so pressing Move later twice moves
      // the same page twice rather than whichever page landed here.
      setIndex(to);
    },
    [onMove, count],
  );

  /* Arrow keys, because anybody stepping through a deck reaches for them
     before they reach for a button. Ignored while typing, so this cannot
     hijack a text field on a page that has one. */
  useEffect(() => {
    const stepping = mode === 'one' || zoom !== null;
    if (!stepping) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'Escape' && zoom !== null) {
        setZoom(null);
        return;
      }
      const step = (d: number) => {
        e.preventDefault();
        if (zoom !== null) setZoom((z) => Math.min(Math.max((z ?? 0) + d, 0), count - 1));
        else go(d);
      };
      if (e.key === 'ArrowRight' || e.key === 'PageDown') step(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, zoom, go, count]);

  /* Before the first page is ready there is nothing to show, but rendering a
     long document takes a moment and a blank space reads as a broken tool.
     The status line stands in until a page arrives. */
  if (count === 0) {
    return busy ? <p className="text-xs tabular-nums text-ink-faint">{busy}…</p> : null;
  }

  const plural = `${noun}s`;

  const arrange = (i: number) =>
    onMove ? (
      <span className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            move(i, -1);
          }}
          disabled={i === 0}
          aria-label={`Move this ${noun} earlier`}
          className="rounded border border-line px-2 py-0.5 text-xs transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          &lsaquo; Move earlier
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            move(i, 1);
          }}
          disabled={i >= count - 1}
          aria-label={`Move this ${noun} later`}
          className="rounded border border-line px-2 py-0.5 text-xs transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
        >
          Move later &rsaquo;
        </button>
      </span>
    ) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tabular-nums text-ink-faint">
          {busy ? `${busy}…` : `${count} ${count === 1 ? noun : plural}`}
        </p>

        <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
          {(['one', 'all'] as DeckMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                mode === m ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {m === 'one' ? `One ${noun}` : `All ${plural}`}
            </button>
          ))}
        </div>
      </div>

      {mode === 'all' ? (
        <div className="mt-4 space-y-6">
          {pages.map((p, i) => (
            <figure key={p.page} className="overflow-hidden rounded-lg border border-line bg-surface">
              <button
                type="button"
                onClick={() => {
                  setZoom(i);
                  setActualSize(false);
                }}
                aria-label={`Enlarge ${noun} ${i + 1}`}
                className="block w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`${noun} ${i + 1}`} className="block w-full" />
              </button>
              <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs tabular-nums text-ink-faint">
                <span className="capitalize">
                  {noun} {i + 1}
                </span>
                {arrange(i)}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <figure className="overflow-hidden rounded-lg border border-line bg-surface">
            <button
              type="button"
              onClick={() => {
                setZoom(at);
                setActualSize(false);
              }}
              aria-label={`Enlarge ${noun} ${at + 1}`}
              className="block w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pages[at].url} alt={`${noun} ${at + 1}`} className="block w-full" />
            </button>
          </figure>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              disabled={at === 0}
              aria-label={`Previous ${noun}`}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
            >
              &lsaquo; Back
            </button>
            <p className="min-w-[6rem] text-center text-sm tabular-nums text-ink-soft">
              {at + 1} of {count}
            </p>
            <button
              onClick={() => go(1)}
              disabled={at >= count - 1}
              aria-label={`Next ${noun}`}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
            >
              Next &rsaquo;
            </button>
          </div>

          {onMove && (
            <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-line pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Reorder this {noun}
              </span>
              {arrange(at)}
            </div>
          )}
        </div>
      )}

      {/* Enlarge. A separate layer rather than a bigger thumbnail, because the
          useful size for reading a page is larger than the column it sits in. */}
      {zoom !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${noun} ${zoom + 1}, enlarged`}
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            className="flex items-center justify-between gap-3 text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="tabular-nums">
              {zoom + 1} of {count}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActualSize((v) => !v)}
                className="rounded-lg border border-white/30 px-3 py-1.5 font-medium hover:border-white"
              >
                {actualSize ? 'Fit to screen' : 'Actual size'}
              </button>
              <button
                onClick={() => setZoom(null)}
                aria-label="Close"
                className="rounded-lg border border-white/30 px-3 py-1.5 font-medium hover:border-white"
              >
                Close
              </button>
            </div>
          </div>

          <div
            className={`mt-3 flex-1 ${
              actualSize ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pages[zoom].url}
              alt={`${noun} ${zoom + 1}`}
              className={actualSize ? 'max-w-none' : 'max-h-full max-w-full object-contain'}
            />
          </div>

          <div
            className="mt-3 flex items-center justify-center gap-4 text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoom((z) => Math.max((z ?? 0) - 1, 0))}
              disabled={zoom === 0}
              className="rounded-lg border border-white/30 px-4 py-2 font-medium hover:border-white disabled:pointer-events-none disabled:opacity-40"
            >
              &lsaquo; Back
            </button>
            <button
              onClick={() => setZoom((z) => Math.min((z ?? 0) + 1, count - 1))}
              disabled={zoom >= count - 1}
              className="rounded-lg border border-white/30 px-4 py-2 font-medium hover:border-white disabled:pointer-events-none disabled:opacity-40"
            >
              Next &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
