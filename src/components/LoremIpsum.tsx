'use client';

import { useMemo, useState } from 'react';

/**
 * Placeholder text, in the amount asked for.
 *
 * The words are the standard Cicero passage every other generator uses, kept
 * because designers recognise the shape of it and a made up vocabulary reads
 * as English and pulls the eye.
 *
 * Sentences vary in length. Placeholder text made of identical sentences
 * makes a layout look calmer than it will be with real copy, which defeats
 * the point of using it.
 */

const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation
ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit
voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non
proident sunt culpa qui officia deserunt mollit anim id est laborum`
  .split(/\s+/)
  .filter(Boolean);

type Unit = 'paragraphs' | 'sentences' | 'words';

/* A tiny seeded generator, so the same settings give the same text instead of
   reshuffling on every keystroke. Math.random would make the output jump
   around while you are still adjusting the number. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function build(unit: Unit, count: number, classic: boolean): string {
  const rand = seeded(count * 7919 + unit.length);
  const word = () => WORDS[Math.floor(rand() * WORDS.length)];

  const sentence = () => {
    const len = 6 + Math.floor(rand() * 12);
    const words = Array.from({ length: len }, word);
    const text = words.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  };

  if (unit === 'words') {
    const words = Array.from({ length: count }, word);
    const text = words.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }

  if (unit === 'sentences') return Array.from({ length: count }, sentence).join(' ');

  const paras = Array.from({ length: count }, () =>
    Array.from({ length: 3 + Math.floor(rand() * 4) }, sentence).join(' '),
  );

  // The traditional opening, only on the first paragraph, and only if asked.
  if (classic && paras.length) {
    paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + paras[0];
  }
  return paras.join('\n\n');
}

export default function LoremIpsum() {
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => build(unit, count, classic), [unit, count, classic]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            How many
          </span>
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 200))}
            className="mt-2 w-28 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
          />
        </label>

        <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
          {(['paragraphs', 'sentences', 'words'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                unit === u ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {unit === 'paragraphs' && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={classic}
              onChange={(e) => setClassic(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Start with the usual line
          </label>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Text
          </span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-sm text-accent underline underline-offset-4"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea
          value={text}
          readOnly
          rows={16}
          className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 leading-relaxed outline-none"
        />
        <p className="mt-2 text-xs tabular-nums text-ink-faint">
          {text.trim().split(/\s+/).length} words, {text.length} characters
        </p>
      </div>
    </div>
  );
}
