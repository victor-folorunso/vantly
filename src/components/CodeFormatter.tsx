'use client';

import { useCallback, useMemo, useState } from 'react';
import { formatJson, minifyJson } from '@/lib/textTools';

/**
 * Beautify and minify, one component behind five languages.
 *
 * js-beautify does the work. It is the MIT library that most online formatters
 * are already quietly running, it has been maintained since 2007, and writing
 * another HTML indenter would be a week spent rediscovering why inline elements
 * are hard.
 *
 * It is imported only when somebody presses the button, because a visitor who
 * lands here from a search result and reads the page should not pay for a
 * parser they never ran.
 *
 * JSON does not go through it. JSON.parse gives a precise error position and
 * js-beautify will happily pretty-print something invalid, which hides the one
 * thing people came to find.
 */

type Lang = 'json' | 'html' | 'css' | 'js' | 'xml';

const LANGS: { id: Lang; label: string; mode: 'html' | 'css' | 'js' | null }[] = [
  { id: 'json', label: 'JSON', mode: null },
  { id: 'html', label: 'HTML', mode: 'html' },
  { id: 'xml', label: 'XML', mode: 'html' },
  { id: 'css', label: 'CSS', mode: 'css' },
  { id: 'js', label: 'JavaScript', mode: 'js' },
];

const SAMPLES: Record<Lang, string> = {
  json: '{"name":"vantly","tools":[{"slug":"json-formatter","live":true}],"count":158}',
  html: '<div class="card"><h2>Hello</h2><p>Some <em>text</em> here.</p></div>',
  xml: '<catalog><book id="1"><title>Dune</title><author>Herbert</author></book></catalog>',
  css: '.card{padding:1rem;border:1px solid #eee}.card h2{margin:0;font-size:1.25rem}',
  js: 'function add(a,b){if(a>b){return a+b}else{return b-a}}const x=add(1,2);',
};

export default function CodeFormatter({ initial = 'json' }: { initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(initial);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const mode = LANGS.find((l) => l.id === lang)!.mode;

  const run = useCallback(
    async (minify: boolean) => {
      setError(null);
      if (!input.trim()) return setOutput('');

      if (lang === 'json') {
        const r = minify ? minifyJson(input) : formatJson(input, indent);
        if (r.ok) return setOutput(r.text);
        setOutput('');
        // The position is the whole reason to use this rather than an editor.
        return setError(
          'line' in r && r.line
            ? `${r.message}  (line ${r.line}, column ${r.column})`
            : r.message,
        );
      }

      setBusy(true);
      try {
        const beautify = await import('js-beautify');
        const opts = {
          indent_size: indent === 'tab' ? 1 : indent,
          indent_with_tabs: indent === 'tab',
          end_with_newline: false,
          preserve_newlines: !minify,
          max_preserve_newlines: minify ? 0 : 2,
        };
        if (minify) {
          // js-beautify does not minify, so this is a conservative squeeze that
          // cannot change behaviour: no identifier renaming, no dead code
          // removal, nothing that needs to understand the program.
          setOutput(
            mode === 'css'
              ? input.replace(/\s*([{}:;,])\s*/g, '$1').replace(/;\}/g, '}').trim()
              : mode === 'html'
                ? input.replace(/>\s+</g, '><').trim()
                : input.replace(/\n\s*/g, ' ').trim(),
          );
        } else if (mode === 'css') {
          setOutput(beautify.css(input, opts));
        } else if (mode === 'html') {
          setOutput(beautify.html(input, opts));
        } else {
          setOutput(beautify.js(input, opts));
        }
      } catch (e) {
        setOutput('');
        setError(e instanceof Error ? e.message : 'Could not format that.');
      } finally {
        setBusy(false);
      }
    },
    [input, lang, indent, mode],
  );

  const stats = useMemo(() => {
    if (!input || !output) return null;
    const delta = output.length - input.length;
    const pct = Math.round((Math.abs(delta) / input.length) * 100);
    return delta === 0 ? 'same size' : `${pct}% ${delta > 0 ? 'larger' : 'smaller'}`;
  }, [input, output]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              setLang(l.id);
              setOutput('');
              setError(null);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              l.id === lang
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {l.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-ink-faint">Indent</span>
          {([2, 4, 'tab'] as const).map((i) => (
            <button
              key={String(i)}
              onClick={() => setIndent(i)}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                i === indent
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line text-ink-soft hover:border-ink-faint'
              }`}
            >
              {i === 'tab' ? 'Tab' : i}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Input
            </span>
            <div className="flex gap-3 text-xs">
              {!input && (
                <button
                  onClick={() => setInput(SAMPLES[lang])}
                  className="text-accent underline underline-offset-4"
                >
                  Use an example
                </button>
              )}
              {input && (
                <button
                  onClick={() => {
                    setInput('');
                    setOutput('');
                    setError(null);
                  }}
                  className="text-ink-faint underline underline-offset-4"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your ${LANGS.find((l) => l.id === lang)!.label} here…`}
            spellCheck={false}
            rows={16}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Result {stats && <span className="normal-case tracking-normal">· {stats}</span>}
            </span>
            {output && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(output);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-xs text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="The formatted result appears here."
            spellCheck={false}
            rows={16}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface-alt p-4 font-mono text-[13px] outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm leading-relaxed">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => void run(false)}
          disabled={busy || !input.trim()}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {busy ? 'Working…' : 'Beautify'}
        </button>
        <button
          onClick={() => void run(true)}
          disabled={busy || !input.trim()}
          className="rounded-lg border border-accent px-5 py-2.5 text-sm font-semibold text-accent disabled:opacity-60"
        >
          Minify
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Removes whitespace only. Renaming variables and dropping unused code is a build step.
      </p>
    </div>
  );
}
