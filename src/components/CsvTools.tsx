'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useHandoff } from '@/components/useHandoff';
import DownloadButton from '@/components/DownloadButton';

/**
 * Opens a CSV, or turns one into JSON.
 *
 * The parser is written out rather than pulled in, because the whole problem
 * with CSV is quoting and every library disagrees at the edges. This follows
 * RFC 4180: a field wrapped in quotes may contain commas and newlines, and a
 * doubled quote inside a quoted field is a literal quote. That is the case
 * that breaks naive splitting on commas, and it is extremely common in
 * exported data.
 *
 * The viewer renders a window of rows rather than all of them. A 200,000 row
 * export is exactly the file people bring here because Excel refused it, and
 * 200,000 table rows in the DOM would refuse it too.
 */

type Mode = 'view' | 'json';

const PAGE = 100;

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }

    if (c === '"') { quoted = true; continue; }
    if (c === delimiter) { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }

  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Guesses the separator by counting candidates in the first line. */
function sniff(text: string): string {
  const line = text.slice(0, text.indexOf('\n') + 1 || text.length);
  const counts = [',', ';', '\t', '|'].map((d) => [d, line.split(d).length] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 1 ? counts[0][0] : ',';
}

function toJson(rows: string[][], headerRow: boolean): string {
  if (rows.length === 0) return '[]';
  const [head, ...body] = headerRow ? rows : [rows[0].map((_, i) => `column${i + 1}`), ...rows];
  const out = body.map((r) => {
    const o: Record<string, string | number | boolean | null> = {};
    head.forEach((key, i) => {
      const raw = r[i] ?? '';
      // Numbers and booleans come back as themselves, because a JSON file full
      // of "42" is the reason people convert it again afterwards.
      if (raw === '') o[key] = null;
      else if (/^-?\d+(\.\d+)?$/.test(raw)) o[key] = Number(raw);
      else if (raw === 'true' || raw === 'false') o[key] = raw === 'true';
      else o[key] = raw;
    });
    return o;
  });
  return JSON.stringify(out, null, 2);
}

export default function CsvTools({ mode }: { mode: Mode }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [name, setName] = useState<string | null>(null);
  const [headerRow, setHeaderRow] = useState(true);
  const [delimiter, setDelimiter] = useState(',');
  const [filter, setFilter] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (f: File) => {
    setError(null);
    setName(f.name);
    setShown(PAGE);
    try {
      const text = await f.text();
      const d = sniff(text);
      setDelimiter(d);
      setRows(parseCsv(text, d));
    } catch {
      setError('That file could not be read as text.');
    }
  }, []);

  const head = headerRow && rows.length ? rows[0] : null;
  const body = useMemo(() => (headerRow ? rows.slice(1) : rows), [rows, headerRow]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return body;
    const q = filter.toLowerCase();
    return body.filter((r) => r.some((cell) => cell.toLowerCase().includes(q)));
  }, [body, filter]);

  const json = useMemo(
    () => (mode === 'json' && rows.length ? toJson(rows, headerRow) : ''),
    [mode, rows, headerRow],
  );

  // Files chosen on the home page, if that is how you arrived.
  useHandoff((files) => {
    void load(files[0]);
  });

  if (rows.length === 0) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void load(f); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a CSV here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'view'
            ? 'Any size. Search it and read it without Excel.'
            : 'Numbers stay numbers and empty cells become null.'}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a file
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <ToolLayout
      settings={
        <label className="flex items-center gap-2 text-ink-soft">
          <input
            type="checkbox"
            checked={headerRow}
            onChange={(e) => setHeaderRow(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          First row is headings
        </label>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {body.length.toLocaleString()} row{body.length === 1 ? '' : 's'}
            {head ? `, ${head.length} column${head.length === 1 ? '' : 's'}` : ''}
            {delimiter !== ',' && `, separated by ${delimiter === '\t' ? 'tabs' : delimiter}`}
          </p>
        </div>
      }
      actions={
        <button
          onClick={() => { setRows([]); setName(null); setFilter(''); }}
          className="text-ink-faint underline underline-offset-4"
        >
          Use another file
        </button>
      }
    >
      {mode === 'json' ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              JSON
            </span>
            <div className="flex gap-4 text-sm">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(json);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <DownloadButton href={URL.createObjectURL(new Blob([json], { type: 'application/json' }))} filename={(name ?? 'data').replace(/\.[^.]+$/, '') + '.json'}>
                Download
              </DownloadButton>
            </div>
          </div>
          <textarea
            value={json}
            readOnly
            rows={20}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>
      ) : (
        <>
          <input
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setShown(PAGE); }}
            placeholder="Search every column"
            className="mt-5 w-full max-w-sm rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          {filter && (
            <p className="mt-2 text-xs tabular-nums text-ink-faint">
              {filtered.length.toLocaleString()} matching row
              {filtered.length === 1 ? '' : 's'}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              {head && (
                <thead className="bg-surface">
                  <tr>
                    {head.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap border-b border-line px-3 py-2 text-left font-semibold"
                      >
                        {h || <span className="text-ink-faint">column {i + 1}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {filtered.slice(0, shown).map((r, i) => (
                  <tr key={i} className="odd:bg-surface">
                    {r.map((cell, ci) => (
                      <td key={ci} className="max-w-xs truncate border-b border-line px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > shown && (
            <button
              onClick={() => setShown((n) => n + 500)}
              className="mt-4 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              Show more, {(filtered.length - shown).toLocaleString()} left
            </button>
          )}
        </>
      )}
    </ToolLayout>
  );
}
