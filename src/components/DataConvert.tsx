'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import {
  findRows,
  fromXml,
  objectsToDelimited,
  parseDelimited,
  rowsToObjects,
  sniff,
  toXml,
  type Row,
} from '@/lib/tabular';

/**
 * Converts between CSV, TSV, JSON, XML and YAML.
 *
 * One component behind a dozen pages, because the job is always the same:
 * read one format into ordinary values, write those values back out in
 * another. The pages exist separately because "csv to yaml" and "yaml to csv"
 * are separate things to type into a search box.
 *
 * Everything happens in the browser. The one thing worth saying about that is
 * that a data file is often the most private thing a person owns, and this
 * kind of tool is usually the one that uploads it.
 */

export type Format = 'csv' | 'tsv' | 'json' | 'xml' | 'yaml';

const NAMES: Record<Format, string> = {
  csv: 'CSV',
  tsv: 'TSV',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
};

const EXTENSIONS: Record<Format, string> = {
  csv: '.csv',
  tsv: '.tsv',
  json: '.json',
  xml: '.xml',
  yaml: '.yaml,.yml',
};

const MIME: Record<Format, string> = {
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'text/yaml',
};

const SAMPLES: Record<Format, string> = {
  csv: 'name,role,years\nAda,engineer,7\nGrace,admiral,40\n',
  tsv: 'name\trole\tyears\nAda\tengineer\t7\nGrace\tadmiral\t40\n',
  json: '[\n  { "name": "Ada", "role": "engineer", "years": 7 },\n  { "name": "Grace", "role": "admiral", "years": 40 }\n]',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n  <row>\n    <name>Ada</name>\n    <role>engineer</role>\n    <years>7</years>\n  </row>\n</rows>',
  yaml: '- name: Ada\n  role: engineer\n  years: 7\n- name: Grace\n  role: admiral\n  years: 40\n',
};

const TABLE: Format[] = ['csv', 'tsv'];

export default function DataConvert({ from, to }: { from: Format; to: Format }) {
  const [input, setInput] = useState(SAMPLES[from]);
  const [headerRow, setHeaderRow] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // XML parsing needs a DOM and YAML is a dynamic import, so the work waits
  // for the browser rather than running during the prerender.
  useEffect(() => setMounted(true), []);

  const convert = useCallback(async () => {
    if (!mounted) return;
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      /* Read whatever came in into plain values. */
      let value: unknown;

      if (TABLE.includes(from)) {
        const delimiter = from === 'tsv' ? '\t' : sniff(input);
        value = rowsToObjects(parseDelimited(input, delimiter), headerRow);
      } else if (from === 'json') {
        value = JSON.parse(input);
      } else if (from === 'xml') {
        value = fromXml(input);
      } else {
        const yaml = await import('js-yaml');
        value = yaml.load(input);
      }

      /* Write it back out. */
      if (TABLE.includes(to)) {
        const rows: Row[] = findRows(value);
        if (rows.length === 0) throw new Error('There is no list of records in that to make a table from.');
        setOutput(objectsToDelimited(rows, to === 'tsv' ? '\t' : ','));
      } else if (to === 'json') {
        setOutput(JSON.stringify(value, null, 2));
      } else if (to === 'xml') {
        setOutput(toXml(value));
      } else {
        const yaml = await import('js-yaml');
        // Long strings wrap by default, which corrupts nothing but makes a
        // diff unreadable, so line folding is off.
        setOutput(yaml.dump(value, { lineWidth: -1, noRefs: true }));
      }
    } catch (e) {
      setOutput('');
      setError(
        e instanceof Error
          ? e.message.replace(/^Unexpected token/, 'That is not valid JSON. Unexpected token')
          : `That could not be read as ${NAMES[from]}.`,
      );
    }
  }, [input, from, to, headerRow, mounted]);

  useEffect(() => {
    void convert();
  }, [convert]);

  const load = useCallback(async (file: File) => {
    setName(file.name);
    setInput(await file.text());
  }, []);

  const downloadName = useMemo(
    () => (name ?? 'data').replace(/\.[^.]+$/, '') + '.' + (to === 'yaml' ? 'yaml' : to),
    [name, to],
  );

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Open a {NAMES[from]} file
        </button>
        {TABLE.includes(from) && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={headerRow}
              onChange={(e) => setHeaderRow(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            First row is headings
          </label>
        )}
        {name && <span className="truncate text-sm text-ink-faint">{name}</span>}
        <input
          ref={inputRef}
          type="file"
          accept={EXTENSIONS[from] + ',text/plain'}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void load(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className={label}>{NAMES[from]} in</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={20}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={label}>{NAMES[to]} out</span>
            {output && (
              <div className="flex gap-4 text-sm">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-accent underline underline-offset-4"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <DownloadButton href={URL.createObjectURL(new Blob([output], { type: MIME[to] }))} filename={downloadName}>
                  Download
                </DownloadButton>
              </div>
            )}
          </div>

          {error ? (
            <p className="mt-2 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-accent">
              {error}
            </p>
          ) : (
            <textarea
              value={output}
              readOnly
              rows={20}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
