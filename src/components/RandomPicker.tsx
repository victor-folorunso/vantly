'use client';

import { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Picks from a list, or shuffles it.
 *
 * Uses crypto.getRandomValues rather than Math.random. Not because a raffle
 * needs cryptography, but because Math.random is biased in ways people notice
 * over a few hundred draws, and someone drawing a winner in public wants to be
 * able to say the draw was fair.
 *
 * Rejection sampling for the same reason: taking a random number modulo the
 * list length quietly favours the first few entries.
 */

function randomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % max;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function RandomPicker() {
  const [raw, setRaw] = useState('Ada\nGrace\nAlan\nKatherine\nMargaret');
  const [howMany, setHowMany] = useState(1);
  const [unique, setUnique] = useState(true);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const items = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const draw = () => {
    if (items.length === 0) return;
    setOrder(null);
    if (unique) {
      setPicked(shuffle(items).slice(0, Math.min(howMany, items.length)));
    } else {
      setPicked(Array.from({ length: howMany }, () => items[randomInt(items.length)]));
    }
  };

  return (
    <ToolLayout
      settings={
        <>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Pick
            </span>
            <input
              type="number"
              min={1}
              max={1000}
              value={howMany}
              onChange={(e) => setHowMany(Math.max(Number(e.target.value) || 1, 1))}
              className="mt-2 w-24 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
            />
          </label>
          <label className="flex items-center gap-2 pb-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={unique}
              onChange={(e) => setUnique(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            No repeats
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={draw}
            disabled={items.length === 0}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            Pick
          </button>
          <button
            onClick={() => {
              setPicked(null);
              setOrder(shuffle(items));
            }}
            disabled={items.length === 0}
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            Shuffle all
          </button>
        </div>
        </>
      }
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          One per line
        </span>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={14}
          spellCheck={false}
          className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 leading-relaxed outline-none focus:border-accent"
        />
        <span className="mt-2 block text-xs tabular-nums text-ink-faint">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </label>

        {picked && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-5">
            {picked.length === 1 ? (
              <p className="break-words text-2xl font-semibold tracking-tight">{picked[0]}</p>
            ) : (
              <ol className="space-y-1">
                {picked.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="tabular-nums text-ink-faint">{i + 1}</span>
                    <span className="break-words">{p}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {order && (
          <ol className="mt-5 space-y-1 rounded-xl border border-line bg-surface p-5">
            {order.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular-nums text-ink-faint">{i + 1}</span>
                <span className="break-words">{p}</span>
              </li>
            ))}
          </ol>
        )}
    </ToolLayout>
  );
}
