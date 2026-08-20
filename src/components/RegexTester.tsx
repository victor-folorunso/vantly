'use client';

import { useMemo, useState } from 'react';

/**
 * Tries a regular expression against text and shows what it caught.
 *
 * The useful part is not the list of matches, it is seeing them highlighted in
 * place. A pattern that matches slightly too much looks correct in a list and
 * obvious in the text.
 *
 * A bad pattern is a normal thing to type while you are still writing one, so
 * the error is shown quietly next to the field rather than as a failure.
 */

type Flag = { id: string; label: string; hint: string };

const FLAGS: Flag[] = [
  { id: 'g', label: 'g', hint: 'find every match, not just the first' },
  { id: 'i', label: 'i', hint: 'ignore capitals' },
  { id: 'm', label: 'm', hint: '^ and $ match each line' },
  { id: 's', label: 's', hint: '. matches a line break too' },
  { id: 'u', label: 'u', hint: 'treat the pattern as unicode' },
];

type Piece = { text: string; match: boolean; index?: number };

export default function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w{2,}\\b');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState(
    'Write to ada@example.com or grace@example.org.\nNot an email: @nobody, half@thing\n',
  );
  const [replacement, setReplacement] = useState('');

  const { pieces, matches, error } = useMemo(() => {
    if (!pattern) return { pieces: [{ text, match: false }], matches: [], error: null };
    let re: RegExp;
    try {
      // Always global internally, so the walk below terminates and the count is
      // the real one. The g flag the user picks decides what is reported.
      re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
    } catch (e) {
      return {
        pieces: [{ text, match: false }],
        matches: [],
        error: e instanceof Error ? e.message : 'That pattern is not valid.',
      };
    }

    const out: Piece[] = [];
    const found: { value: string; index: number; groups: string[] }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let guard = 0;

    while ((m = re.exec(text)) !== null && guard++ < 10000) {
      // A pattern that can match nothing, like a*, would otherwise loop for
      // ever on the same index.
      if (m[0] === '') {
        re.lastIndex++;
        continue;
      }
      if (m.index > last) out.push({ text: text.slice(last, m.index), match: false });
      out.push({ text: m[0], match: true, index: found.length });
      found.push({ value: m[0], index: m.index, groups: m.slice(1) });
      last = m.index + m[0].length;
      if (!flags.includes('g')) break;
    }
    if (last < text.length) out.push({ text: text.slice(last), match: false });

    return { pieces: out, matches: found, error: null };
  }, [pattern, flags, text]);

  const replaced = useMemo(() => {
    if (error || !pattern || !replacement) return null;
    try {
      return text.replace(new RegExp(pattern, flags), replacement);
    } catch {
      return null;
    }
  }, [text, pattern, flags, replacement, error]);

  const toggle = (id: string) =>
    setFlags((f) => (f.includes(id) ? f.replace(id, '') : f + id));

  return (
    <div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Pattern
        </span>
        <div className="mt-2 flex items-stretch rounded-lg border border-line bg-surface focus-within:border-accent">
          <span className="flex items-center pl-3 font-mono text-ink-faint">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 font-mono text-sm outline-none"
          />
          <span className="flex items-center pr-3 font-mono text-ink-faint">/{flags}</span>
        </div>
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {FLAGS.map((f) => (
          <button
            key={f.id}
            onClick={() => toggle(f.id)}
            title={f.hint}
            aria-pressed={flags.includes(f.id)}
            className={`rounded-lg border px-3 py-1 font-mono text-sm transition-colors ${
              flags.includes(f.id)
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-ink-soft hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-accent">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Text
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
            />
          </label>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              What it matched
            </span>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed">
              {pieces.map((p, i) =>
                p.match ? (
                  <mark key={i} className="rounded bg-accent-soft px-0.5 text-accent">
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </pre>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Replace with
            </span>
            <input
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="$1 for the first group"
              spellCheck={false}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
          {replaced !== null && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed">
              {replaced}
            </pre>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </p>
          <ul className="mt-2 space-y-2">
            {matches.slice(0, 100).map((m, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface p-3">
                <p className="break-words font-mono text-sm">{m.value}</p>
                <p className="mt-1 text-xs tabular-nums text-ink-faint">at {m.index}</p>
                {m.groups.length > 0 && (
                  <ol className="mt-2 space-y-0.5">
                    {m.groups.map((g, gi) => (
                      <li key={gi} className="font-mono text-xs text-ink-soft">
                        <span className="text-ink-faint">${gi + 1}</span> {g ?? '—'}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
          {matches.length > 100 && (
            <p className="mt-2 text-xs text-ink-faint">
              Showing the first 100 of {matches.length}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
