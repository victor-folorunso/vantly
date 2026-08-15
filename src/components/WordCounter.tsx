'use client';

import { useMemo, useState } from 'react';
import { countText } from '@/lib/textTools';

/**
 * Counts as you type.
 *
 * Its own component rather than a TextTool transform, because the output is a
 * grid of numbers rather than a second box of text, and the numbers are the
 * whole product.
 *
 * The limits underneath are the reason most people arrive: they are not
 * counting out of curiosity, they are checking something fits.
 */

const LIMITS = [
  { label: 'X post', max: 280, of: 'characters' as const },
  { label: 'Meta description', max: 160, of: 'characters' as const },
  { label: 'Page title', max: 60, of: 'characters' as const },
  { label: 'SMS', max: 160, of: 'characters' as const },
];

function minutes(m: number): string {
  if (m === 0) return '0 min';
  if (m < 1) return `${Math.max(1, Math.round(m * 60))} sec`;
  return `${Math.round(m)} min`;
}

export default function WordCounter() {
  const [text, setText] = useState('');
  const s = useMemo(() => countText(text), [text]);

  const cells = [
    { label: 'Words', value: s.words },
    { label: 'Characters', value: s.characters },
    { label: 'Without spaces', value: s.charactersNoSpaces },
    { label: 'Sentences', value: s.sentences },
    { label: 'Paragraphs', value: s.paragraphs },
    { label: 'Lines', value: s.lines },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text…"
          rows={18}
          autoFocus
          className="w-full resize-y rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
        />
        {text && (
          <button
            onClick={() => setText('')}
            className="mt-2 text-xs text-ink-faint underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {cells.map((c) => (
            <div key={c.label} className="bg-surface p-4">
              <p className="text-2xl font-semibold tabular-nums">{c.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-ink-faint">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Time</p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-soft">Reading</span>
            <span className="tabular-nums">{minutes(s.readingMinutes)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-ink-soft">Reading aloud</span>
            <span className="tabular-nums">{minutes(s.speakingMinutes)}</span>
          </div>
        </div>

        {/* Most people are here to check something fits, not out of curiosity. */}
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Fits in</p>
          <ul className="mt-2 space-y-1.5">
            {LIMITS.map((l) => {
              const used = s.characters;
              const over = used > l.max;
              return (
                <li key={l.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink-soft">{l.label}</span>
                  <span className={`shrink-0 tabular-nums ${over ? 'text-accent' : 'text-ink-faint'}`}>
                    {over ? `${used - l.max} over` : `${l.max - used} left`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
