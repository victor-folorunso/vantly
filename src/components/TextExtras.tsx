'use client';

import { useMemo, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import { FANCY_STYLES, buildPattern, fancy, findReplace, strike, underline } from '@/lib/devTools';

/**
 * Four text tools whose output is not a second box of text: a replace with
 * options and a count, a character count against real limits, a list of
 * styled copies, and a live HTML preview.
 */

export type TextExtra = 'find' | 'chars' | 'fancy' | 'html';

const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
const box =
  'mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent';

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  return {
    copied,
    copy: async (text: string, key = 'main') => {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
    },
  };
}

/* ── Find and replace ────────────────────────────────────────────────────── */

function FindReplace() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCase] = useState(false);
  const [wholeWord, setWhole] = useState(false);
  const [regex, setRegex] = useState(false);
  const { copied, copy } = useCopy();

  const o = { caseSensitive, wholeWord, regex };
  const result = useMemo(() => {
    try {
      return { ok: true as const, ...findReplace(text, find, replace, { caseSensitive, wholeWord, regex }) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'That pattern did not work.' };
    }
  }, [text, find, replace, caseSensitive, wholeWord, regex]);

  // The matches marked in the original, so you can see what will change
  // before you take the result away. Capped, because marking a hundred
  // thousand spans would freeze the page for no one's benefit.
  const marked = useMemo(() => {
    if (!find || !text || !result.ok || result.count === 0) return null;
    const re = buildPattern(find, o);
    const parts: React.ReactNode[] = [];
    let last = 0;
    let n = 0;
    for (const m of text.matchAll(re)) {
      if (m[0] === '' || n >= 2000) break;
      parts.push(text.slice(last, m.index), <mark key={n} className="rounded-sm bg-accent-soft text-ink">{m[0]}</mark>);
      last = m.index! + m[0].length;
      n++;
    }
    parts.push(text.slice(last));
    return parts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, find, caseSensitive, wholeWord, regex, result]);

  const toggle = (on: boolean, set: (v: boolean) => void, name: string, hint: string) => (
    <label className="flex items-center gap-2 text-sm" title={hint}>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      {name}
    </label>
  );

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Find</span>
          <input value={find} onChange={(e) => setFind(e.target.value)} spellCheck={false} className={`${box} resize-none py-2.5 font-mono`} />
        </label>
        <label className="block">
          <span className={label}>Replace with</span>
          <input value={replace} onChange={(e) => setReplace(e.target.value)} spellCheck={false} className={`${box} resize-none py-2.5 font-mono`} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {toggle(caseSensitive, setCase, 'Match case', 'Cat and cat count as different words')}
        {toggle(wholeWord, setWhole, 'Whole words', 'Cat does not match inside category')}
        {toggle(regex, setRegex, 'Regular expression', 'Use a pattern, with $1 for groups in the replacement')}
        <span className="ml-auto text-sm tabular-nums text-ink-soft">
          {!result.ok ? '' : !find ? '' : result.count === 0 ? 'No matches' : `${result.count.toLocaleString()} replaced`}
        </span>
      </div>
      {!result.ok && <p className="mt-2 text-sm text-accent">{result.message}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className={label}>Text</span>
            {!text && (
              <button
                onClick={() => {
                  setText('The cat sat on the mat. Category: cats.\nCall 555-0100 or 555-0199 before 2026-11-30.');
                  setFind('cat');
                }}
                className="text-xs text-accent underline underline-offset-4"
              >
                Use an example
              </button>
            )}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} spellCheck={false} placeholder="Paste your text here…" className={box} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className={label}>Result</span>
            {result.ok && text && (
              <button onClick={() => void copy(result.text)} className="text-xs text-accent underline underline-offset-4">
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea readOnly value={result.ok ? result.text : ''} rows={14} spellCheck={false} className={`${box} bg-surface-alt`} />
        </div>
      </div>
      {marked && (
        <section className="mt-5">
          <span className={label}>What will change</span>
          <div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
            {marked}
          </div>
        </section>
      )}
      {regex && (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          In the replacement, $1 and $2 put back what the first and second brackets matched, and $& the whole match.
          \n in the pattern finds a line break.
        </p>
      )}
    </div>
  );
}

/* ── Character counter ───────────────────────────────────────────────────── */

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

function graphemes(s: string): string[] {
  return segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s);
}

/** X counts most of Latin, Greek and Cyrillic as one and everything else,
 *  emoji and CJK included, as two. Links are always 23. */
function xLength(s: string): number {
  const withLinks = s.replace(/https?:\/\/\S+/g, 'x'.repeat(23));
  let n = 0;
  for (const g of graphemes(withLinks)) {
    const c = g.codePointAt(0)!;
    const light = g.length === 1 && (c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037));
    n += light ? 1 : 2;
  }
  return n;
}

const GSM = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
);
const GSM_EXT = new Set('^{}\\[~]|€\f');

/** How many texts a message is billed as. One emoji turns the whole
 *  message into UCS-2, which drops a text from 160 characters to 70. */
function sms(s: string): { parts: number; perPart: number; unicode: boolean; length: number } {
  const chars = Array.from(s);
  const unicode = chars.some((c) => !GSM.has(c) && !GSM_EXT.has(c));
  const length = unicode ? s.length : chars.reduce((n, c) => n + (GSM_EXT.has(c) ? 2 : 1), 0);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  if (length <= single) return { parts: length ? 1 : 0, perPart: single, unicode, length };
  return { parts: Math.ceil(length / multi), perPart: multi, unicode, length };
}

const LIMITS = [
  { name: 'X post', max: 280, count: xLength, note: 'Emoji and most non-Latin letters count as two, links as 23.' },
  { name: 'Page title', max: 60, note: 'Google cuts titles off at around 600 pixels, which is roughly 60 characters.' },
  { name: 'Meta description', max: 160, note: 'Longer descriptions are trimmed in search results.' },
  { name: 'Instagram caption', max: 2200 },
  { name: 'LinkedIn post', max: 3000 },
  { name: 'YouTube title', max: 100 },
] as const;

function CharacterCounter() {
  const [text, setText] = useState('');
  const g = useMemo(() => graphemes(text), [text]);
  const chars = g.length;
  const noSpaces = g.filter((c) => !/^\s+$/.test(c)).length;
  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
  const s = sms(text);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text…"
          rows={14}
          autoFocus
          className={`${box} mt-0`}
        />
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            ['Characters', chars],
            ['Without spaces', noSpaces],
            ['Words', words],
            ['Bytes (UTF-8)', bytes],
          ].map(([name, v]) => (
            <div key={name} className="bg-surface p-4">
              <p className="text-2xl font-semibold tabular-nums">{Number(v).toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-ink-faint">{name}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          An emoji or an accented letter counts as one character, the way you see it, even when it is several code
          points underneath.
        </p>
      </div>

      <div className="space-y-2.5">
        {LIMITS.map((l) => {
          const n = 'count' in l ? l.count(text) : chars;
          const over = n > l.max;
          return (
            <div key={l.name} className="rounded-xl border border-line bg-surface p-3.5" title={'note' in l ? l.note : undefined}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{l.name}</span>
                <span className={`tabular-nums ${over ? 'font-semibold text-accent' : 'text-ink-soft'}`}>
                  {n.toLocaleString()} / {l.max.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                <div className={`h-full ${over ? 'bg-accent' : 'bg-ink-faint'}`} style={{ width: `${Math.min(100, (n / l.max) * 100)}%` }} />
              </div>
              {over && <p className="mt-1.5 text-xs text-accent">{(n - l.max).toLocaleString()} over</p>}
            </div>
          );
        })}
        <div className="rounded-xl border border-line bg-surface p-3.5 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Text message</span>
            <span className="tabular-nums text-ink-soft">
              {s.parts} part{s.parts === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            {s.unicode
              ? `Contains characters outside the basic SMS set, so each part holds ${s.perPart}.`
              : `${s.perPart} characters per part.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Fancy text ──────────────────────────────────────────────────────────── */

function FancyText() {
  const [text, setText] = useState('Make it stand out');
  const { copied, copy } = useCopy();

  const rows = [
    ...FANCY_STYLES.map((s) => ({ id: s.id, label: s.label, out: fancy(text, s.id) })),
    { id: 'strike', label: 'Strikethrough', out: strike(text) },
    { id: 'underline', label: 'Underline', out: underline(text) },
  ];

  return (
    <div>
      <label className="block">
        <span className={label}>Your text</span>
        <input value={text} onChange={(e) => setText(e.target.value)} className={`${box} resize-none py-3 text-base`} />
      </label>
      <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-4 px-4 py-3">
            <span className="w-28 shrink-0 text-xs text-ink-faint">{r.label}</span>
            <span className="min-w-0 flex-1 break-words text-lg">{r.out || <span className="text-ink-faint">…</span>}</span>
            <button
              onClick={() => void copy(r.out, r.id)}
              disabled={!text}
              className="shrink-0 rounded-md border border-line px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {copied === r.id ? 'Copied' : 'Copy'}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        These are not a font. Each letter is a separate Unicode character that happens to look bold or italic, which is
        why the style survives in a bio or a caption. Screen readers may read them oddly or spell them out, so keep them
        for a word or two rather than whole sentences. Only letters and, for some styles, digits change.
      </p>
    </div>
  );
}

/* ── HTML viewer ─────────────────────────────────────────────────────────── */

const SAMPLE_HTML = `<!doctype html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #222; }
    h1 { color: #c2410c; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 1rem 1.25rem; max-width: 28rem; }
  </style>
</head>
<body>
  <h1>Hello</h1>
  <div class="card">
    <p>Edit the source on the left and this updates as you type.</p>
    <button onclick="this.textContent = 'Clicked'">Click me</button>
  </div>
</body>
</html>`;

function HtmlViewer() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [scripts, setScripts] = useState(false);
  const [name, setName] = useState('page.html');
  const [width, setWidth] = useState<'full' | 'phone'>('full');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button onClick={() => inputRef.current?.click()} className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink">
            Open an HTML file
          </button>
          <label className="flex items-center gap-2" title="Off by default. Scripts run in a sealed frame that cannot reach this page, your cookies or other sites' data.">
            <input type="checkbox" checked={scripts} onChange={(e) => setScripts(e.target.checked)} />
            Run scripts
          </label>
          <div className="flex gap-1 rounded-lg border border-line p-0.5 text-xs">
            {(['full', 'phone'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWidth(w)}
                aria-pressed={width === w}
                className={`rounded-md px-2.5 py-1 ${width === w ? 'bg-accent-soft text-ink' : 'text-ink-soft'}`}
              >
                {w === 'full' ? 'Full width' : 'Phone'}
              </button>
            ))}
          </div>
        </div>
        <DownloadButton prepare={async () => new Blob([html], { type: 'text/html' })} filename={name} variant="quiet">
          Download .html
        </DownloadButton>
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm,text/html"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              setHtml(await f.text());
              setName(f.name);
            }
            e.target.value = '';
          }}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={26}
          spellCheck={false}
          aria-label="HTML source"
          className={`${box} mt-0 font-mono text-[13px]`}
        />
        <div className="rounded-xl border border-line bg-surface-alt p-2">
          {/* sandbox without allow-same-origin gives the frame an opaque
              origin, so even with scripts on it cannot read this page,
              its storage or its cookies. Links open nowhere. */}
          <iframe
            key={scripts ? 'run' : 'still'}
            title="Rendered HTML"
            srcDoc={html}
            sandbox={scripts ? 'allow-scripts allow-modals' : ''}
            className={`mx-auto block h-[38rem] rounded-lg bg-white ${width === 'phone' ? 'w-[375px] max-w-full' : 'w-full'}`}
          />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Relative images and stylesheets will not load, because a pasted page has no folder around it. Use full
        addresses starting https:// for those.
      </p>
    </div>
  );
}

export default function TextExtras({ tool }: { tool: TextExtra }) {
  if (tool === 'find') return <FindReplace />;
  if (tool === 'chars') return <CharacterCounter />;
  if (tool === 'fancy') return <FancyText />;
  return <HtmlViewer />;
}
