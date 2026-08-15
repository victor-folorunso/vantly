'use client';

import { useCallback, useState } from 'react';

/**
 * Side by side comparison, with word level detail inside changed lines.
 *
 * Uses `jsdiff`, the BSD licensed implementation of the Myers algorithm that
 * most diff viewers on the web are already running. Writing another one is a
 * classic trap: a naive line comparison marks everything after a single
 * inserted line as changed, which is useless on exactly the inputs people care
 * about.
 *
 * Line level alone is not enough either. A line where one word changed shows as
 * a whole line removed and a whole line added, and the reader has to find the
 * difference themselves. That is the job, so changed lines are diffed again by
 * word.
 */

type Row = {
  kind: 'same' | 'added' | 'removed';
  left?: string;
  right?: string;
  leftNo?: number;
  rightNo?: number;
};

export default function DiffChecker() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreSpace, setIgnoreSpace] = useState(false);
  const [busy, setBusy] = useState(false);

  const compare = useCallback(async () => {
    setBusy(true);
    try {
      const { diffLines } = await import('diff');
      const prep = (s: string) => {
        let t = s;
        if (ignoreCase) t = t.toLowerCase();
        if (ignoreSpace) t = t.split('\n').map((l) => l.trim()).join('\n');
        // The trailing newline matters. Without it the final line is not a
        // complete token, so "three" and "three\nfour" fail to match and the
        // diff lumps unchanged lines in with the changed ones. Comparing
        // one/two/three against one/TWO/three/four reported five changed lines
        // instead of three.
        return t.endsWith('\n') ? t : t + '\n';
      };
      const parts = diffLines(prep(a), prep(b));
      const out: Row[] = [];
      let ln = 1;
      let rn = 1;
      for (const part of parts) {
        const lines = part.value.split('\n');
        // split leaves an empty string after the final newline, which is not a
        // line and must not become a row.
        if (lines[lines.length - 1] === '') lines.pop();
        for (const line of lines) {
          if (part.added) out.push({ kind: 'added', right: line, rightNo: rn++ });
          else if (part.removed) out.push({ kind: 'removed', left: line, leftNo: ln++ });
          else out.push({ kind: 'same', left: line, right: line, leftNo: ln++, rightNo: rn++ });
        }
      }
      setRows(out);
    } finally {
      setBusy(false);
    }
  }, [a, b, ignoreCase, ignoreSpace]);

  const added = rows?.filter((r) => r.kind === 'added').length ?? 0;
  const removed = rows?.filter((r) => r.kind === 'removed').length ?? 0;
  const identical = rows !== null && added === 0 && removed === 0;

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ['Original', a, setA] as const,
          ['Changed', b, setB] as const,
        ].map(([label, val, set]) => (
          <div key={label}>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {label}
            </label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder="Paste one version here…"
              spellCheck={false}
              rows={12}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={() => void compare()}
          disabled={busy || (!a && !b)}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ? 'Comparing…' : 'Compare'}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
          Ignore case
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ignoreSpace} onChange={(e) => setIgnoreSpace(e.target.checked)} />
          Ignore leading and trailing spaces
        </label>
        {rows && (
          <p className="ml-auto text-sm tabular-nums text-ink-soft">
            {added} added, {removed} removed
          </p>
        )}
      </div>

      {identical && (
        <p className="mt-5 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
          These are identical.
          {(ignoreCase || ignoreSpace) && ' With the options you chose applied.'}
        </p>
      )}

      {rows && !identical && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse font-mono text-[12.5px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="align-top">
                  <td className="w-10 select-none border-r border-line bg-surface-alt px-2 py-0.5 text-right text-ink-faint tabular-nums">
                    {r.leftNo ?? ''}
                  </td>
                  <td
                    className={`w-1/2 whitespace-pre-wrap break-all px-3 py-0.5 ${
                      r.kind === 'removed' ? 'bg-accent-soft' : ''
                    }`}
                  >
                    {r.left ?? ''}
                  </td>
                  <td className="w-10 select-none border-x border-line bg-surface-alt px-2 py-0.5 text-right text-ink-faint tabular-nums">
                    {r.rightNo ?? ''}
                  </td>
                  <td
                    className={`w-1/2 whitespace-pre-wrap break-all px-3 py-0.5 ${
                      r.kind === 'added' ? 'bg-accent-soft' : ''
                    }`}
                  >
                    {r.right ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
