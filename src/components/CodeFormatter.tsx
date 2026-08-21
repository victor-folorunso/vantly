'use client';

import { useCallback, useState } from 'react';
import { LANGS, format, minify, type Lang } from '@/lib/code';

/**
 * Formats and minifies code, using Prettier and Terser rather than a
 * re-indenter.
 *
 * The distinction shows up the moment somebody compares this with the tool
 * they already use. Prettier parses to a syntax tree and prints it again, so
 * the result matches what their editor would produce, and broken input comes
 * back as a syntax error with a position on it. That error is the feature: a
 * formatter that happily reformats invalid code has hidden the bug you opened
 * it to find.
 */

const SAMPLES: Partial<Record<Lang, string>> = {
  json: '{"name":"vantly","tools":[{"slug":"json-formatter","live":true}],"count":163}',
  html: '<div class="card"><h2>Hello</h2><p>Some <em>text</em> here.</p></div>',
  xml: '<catalog><book id="1"><title>Dune</title><author>Herbert</author></book></catalog>',
  css: '.card{padding:1rem;border:1px solid #eee}.card h2{margin:0;font-size:1.25rem}',
  scss: '.card{ padding:1rem; h2{ margin:0; &:hover{ color:red } } }',
  less: '@pad: 1rem; .card{ padding:@pad; h2{ margin:0 } }',
  js: 'function add(a,b){if(a>b){return a+b}else{return b-a}}const x=add(1,2);',
  jsx: 'const App=()=><div className="card"><h2>Hi</h2></div>;',
  ts: 'type User={id:number,name:string};function greet(u:User):string{return `Hi ${u.name}`}',
  tsx: 'const App=({n}:{n:number})=><p>{n}</p>;',
  vue: '<template><div class="card">{{ title }}</div></template>',
  yaml: 'name: vantly\ntools:   [json, css]\nlive:    true',
  markdown: '# Title\nSome   *text*  here.\n\n- one\n- two',
  graphql: 'query{user(id:1){name email posts{title}}}',
  sql: "select id, name from users u join orders o on o.user_id = u.id where u.active = true and o.total > 100 order by o.total desc limit 10",
};

export default function CodeFormatter({
  initial = 'json',
  action = 'format',
}: {
  initial?: Lang;
  /** Minifier pages open on the minify action and say so in the button. */
  action?: 'format' | 'minify';
}) {
  const [lang, setLang] = useState<Lang>(initial);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const meta = LANGS.find((l) => l.id === lang)!;

  const run = useCallback(
    async (shrink: boolean) => {
      setError(null);
      if (!input.trim()) return setOutput('');
      setBusy(true);
      try {
        const result = shrink ? await minify(input, lang) : await format(input, lang, indent);
        if (result.ok) {
          setOutput(result.output);
        } else {
          setOutput('');
          setError(result.error);
        }
      } finally {
        setBusy(false);
      }
    },
    [input, lang, indent],
  );

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
  const saved =
    output && input ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block text-sm">
          <span className={label}>Language</span>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value as Lang);
              setOutput('');
              setError(null);
            }}
            className="mt-2 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm">
            <span className={label}>Indent</span>
            <div className="mt-2 inline-flex rounded-lg border border-line p-0.5">
              {([2, 4, 'tab'] as const).map((i) => (
                <button
                  key={String(i)}
                  onClick={() => setIndent(i)}
                  aria-pressed={indent === i}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    indent === i ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {i === 'tab' ? 'Tab' : i}
                </button>
              ))}
            </div>
          </label>

          <button
            onClick={() => void run(action === 'minify')}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ? 'Working…' : action === 'minify' ? 'Minify' : 'Format'}
          </button>

          {meta.canMinify && (
            <button
              onClick={() => void run(action !== 'minify')}
              disabled={busy}
              className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {action === 'minify' ? 'Format instead' : 'Minify instead'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={label}>In</span>
            {SAMPLES[lang] && (
              <button
                onClick={() => {
                  setInput(SAMPLES[lang]!);
                  setOutput('');
                  setError(null);
                }}
                className="text-sm text-ink-faint underline underline-offset-4 hover:text-ink"
              >
                Use an example
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={20}
            spellCheck={false}
            placeholder={`Paste ${meta.label} here.`}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={label}>
              Out
              {output && saved > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-ink-faint">
                  {saved}% smaller
                </span>
              )}
            </span>
            {output && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(output);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {error ? (
            /* Shown where the output would be, because it is the answer: the
               position is the thing somebody came here to find out. */
            <p className="mt-2 rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed text-accent">
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

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Formatting is Prettier, the same engine most editors run, so the result
        matches what your editor would do. Minifying is Terser for JavaScript
        and csso for CSS, which rename and remove rather than only stripping
        spaces.
      </p>
    </div>
  );
}
