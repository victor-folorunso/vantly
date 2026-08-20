'use client';

import { useMemo, useState } from 'react';
import { diffLines, diffWordsWithSpace, type Change } from 'diff';

/**
 * Line diff, built on jsdiff, which is the Myers algorithm everything else uses
 * too. The previous version compared line by line at the same index, so
 * inserting one line at the top marked every following line as changed. That is
 * not a diff, it is an alignment failure, and it is exactly what people notice.
 *
 * Two views, both of which GitHub has taught people to read:
 *
 * Split puts the files side by side with matching lines on the same row.
 * Unified interleaves them the way a patch does.
 *
 * Within a changed pair, the words that actually differ are highlighted, so a
 * one character change does not look like a whole rewritten line.
 */

type Row = {
  left?: { n: number; text: string };
  right?: { n: number; text: string };
  kind: 'same' | 'add' | 'del' | 'change';
};

/** Split each changed pair further, so only the differing words are marked. */
function inline(a: string, b: string) {
  const parts = diffWordsWithSpace(a, b);
  return {
    left: parts.filter((p) => !p.added),
    right: parts.filter((p) => !p.removed),
  };
}

function Marked({ parts, side }: { parts: Change[]; side: 'left' | 'right' }) {
  return (
    <>
      {parts.map((p, i) => {
        const hit = side === 'left' ? p.removed : p.added;
        return hit ? (
          <mark
            key={i}
            className={`rounded-[3px] px-0.5 ${
              side === 'left'
                ? 'bg-[#ffc9c9] text-[#4a1010] dark:bg-[#6b2020] dark:text-[#ffd7d7]'
                : 'bg-[#b7f0c2] text-[#0f3d1c] dark:bg-[#1d5a2e] dark:text-[#c9f5d4]'
            }`}
          >
            {p.value}
          </mark>
        ) : (
          <span key={i}>{p.value}</span>
        );
      })}
    </>
  );
}

export default function DiffChecker() {
  const [a, setA] = useState('Hello world! Welcome to the site.\nSecond line.\nThird line.');
  const [b, setB] = useState('Hello everyone! Welcome to our site.\nSecond line.\nA new line here.\nThird line.');
  const [view, setView] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [hideSame, setHideSame] = useState(false);

  const { rows, added, removed } = useMemo(() => {
    const changes = diffLines(a, b, {
      ignoreWhitespace,
      newlineIsToken: false,
    });

    const rows: Row[] = [];
    let ln = 1;
    let rn = 1;
    let added = 0;
    let removed = 0;

    for (let i = 0; i < changes.length; i++) {
      const c = changes[i];
      const lines = c.value.replace(/\n$/, '').split('\n');

      if (!c.added && !c.removed) {
        for (const text of lines) rows.push({ kind: 'same', left: { n: ln++, text }, right: { n: rn++, text } });
        continue;
      }

      /* A removal immediately followed by an addition is a modification, so
         pair them up rather than showing them as two unrelated blocks. That
         pairing is what makes the word level highlight meaningful. */
      const next = changes[i + 1];
      if (c.removed && next?.added) {
        const rightLines = next.value.replace(/\n$/, '').split('\n');
        const pairs = Math.max(lines.length, rightLines.length);
        for (let k = 0; k < pairs; k++) {
          const l = lines[k];
          const r = rightLines[k];
          if (l !== undefined && r !== undefined) {
            rows.push({ kind: 'change', left: { n: ln++, text: l }, right: { n: rn++, text: r } });
            removed++; added++;
          } else if (l !== undefined) {
            rows.push({ kind: 'del', left: { n: ln++, text: l } });
            removed++;
          } else {
            rows.push({ kind: 'add', right: { n: rn++, text: r! } });
            added++;
          }
        }
        i++; // the addition is consumed
        continue;
      }

      for (const text of lines) {
        if (c.removed) { rows.push({ kind: 'del', left: { n: ln++, text } }); removed++; }
        else { rows.push({ kind: 'add', right: { n: rn++, text } }); added++; }
      }
    }

    return { rows, added, removed };
  }, [a, b, ignoreWhitespace]);

  const shown = hideSame ? rows.filter((r) => r.kind !== 'same') : rows;

  const tint = (kind: Row['kind'], side: 'left' | 'right') => {
    if (kind === 'same') return '';
    if (kind === 'add') return side === 'right' ? 'bg-[#e6ffed] dark:bg-[#12261a]' : 'bg-surface-alt';
    if (kind === 'del') return side === 'left' ? 'bg-[#ffeef0] dark:bg-[#2a1416]' : 'bg-surface-alt';
    return side === 'left' ? 'bg-[#ffeef0] dark:bg-[#2a1416]' : 'bg-[#e6ffed] dark:bg-[#12261a]';
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Original</span>
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            rows={8}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Changed</span>
          <textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={8}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex gap-1.5">
          {(['split', 'unified'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                v === view ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-soft hover:border-ink-faint'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} />
          Ignore whitespace
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={hideSame} onChange={(e) => setHideSame(e.target.checked)} />
          Only changes
        </label>

        <p className="ml-auto text-sm tabular-nums">
          <span className="text-[#c0392b] dark:text-[#ff9b9b]">−{removed}</span>{' '}
          <span className="text-[#1d7a3a] dark:text-[#7ee0a0]">+{added}</span>
          {added === 0 && removed === 0 && <span className="text-ink-faint">no differences</span>}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse font-mono text-[13px]">
          <tbody>
            {shown.map((r, i) => {
              const marks = r.kind === 'change' ? inline(r.left!.text, r.right!.text) : null;

              if (view === 'unified') {
                const cells = [];
                if (r.left && r.kind !== 'add') {
                  cells.push(
                    <tr key={`l${i}`} className={tint(r.kind === 'change' ? 'del' : r.kind, 'left')}>
                      <td className="w-12 select-none border-r border-line px-2 text-right text-ink-faint">{r.left.n}</td>
                      <td className="w-5 select-none px-1 text-ink-faint">{r.kind === 'same' ? '' : '−'}</td>
                      <td className="whitespace-pre-wrap break-all px-2 py-0.5">
                        {marks ? <Marked parts={marks.left} side="left" /> : r.left.text || ' '}
                      </td>
                    </tr>,
                  );
                }
                if (r.right && r.kind !== 'del' && r.kind !== 'same') {
                  cells.push(
                    <tr key={`r${i}`} className={tint('add', 'right')}>
                      <td className="w-12 select-none border-r border-line px-2 text-right text-ink-faint">{r.right.n}</td>
                      <td className="w-5 select-none px-1 text-ink-faint">+</td>
                      <td className="whitespace-pre-wrap break-all px-2 py-0.5">
                        {marks ? <Marked parts={marks.right} side="right" /> : r.right.text || ' '}
                      </td>
                    </tr>,
                  );
                }
                return cells;
              }

              return (
                <tr key={i}>
                  <td className={`w-12 select-none border-r border-line px-2 text-right align-top text-ink-faint ${tint(r.kind, 'left')}`}>
                    {r.left?.n ?? ''}
                  </td>
                  <td className={`w-1/2 whitespace-pre-wrap break-all px-2 py-0.5 align-top ${tint(r.kind, 'left')}`}>
                    {r.left ? (marks ? <Marked parts={marks.left} side="left" /> : r.left.text || ' ') : ''}
                  </td>
                  <td className={`w-12 select-none border-l border-r border-line px-2 text-right align-top text-ink-faint ${tint(r.kind, 'right')}`}>
                    {r.right?.n ?? ''}
                  </td>
                  <td className={`w-1/2 whitespace-pre-wrap break-all px-2 py-0.5 align-top ${tint(r.kind, 'right')}`}>
                    {r.right ? (marks ? <Marked parts={marks.right} side="right" /> : r.right.text || ' ') : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
