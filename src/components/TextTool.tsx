'use client';

import { useMemo, useState } from 'react';
import * as T from '@/lib/textTools';

/**
 * One box in, one box out, with a row of buttons between them.
 *
 * Six of these tools are the same interface with a different list of
 * transformations, so the list is a prop. Writing them separately would have
 * meant six copies of the copy button, the clear button, the character counter
 * and the error handling, which is six places for them to drift apart.
 *
 * Transforms run on every keystroke and are allowed to throw. Decoding is the
 * reason: half-typed Base64 is invalid Base64, and an input that turns red
 * while you are still typing into it is worse than one that simply waits.
 */

export type Transform = {
  id: string;
  label: string;
  /** Throwing is fine. The message is shown instead of the output. */
  run: (input: string) => string;
  /** Shown under the buttons when this one is selected. */
  note?: string;
};

/**
 * The transform lists live here rather than in each page.
 *
 * A page is a server component, and a function cannot be handed from one of
 * those to a client component: React has no way to send a closure over the
 * wire. So the pages name a preset and this file owns the functions. The build
 * catches the mistake if it is ever done the other way round, which is how this
 * was found.
 */
export const PRESETS: Record<string, { transforms: Transform[]; sample?: string; mono?: boolean }> = {
  case: {
    sample: 'the quick brown fox jumps over the lazy dog',
    transforms: [
      { id: 'upper', label: 'UPPERCASE', run: T.toUpper },
      { id: 'lower', label: 'lowercase', run: T.toLower },
      { id: 'title', label: 'Title Case', run: T.toTitle },
      { id: 'sentence', label: 'Sentence case', run: T.toSentence },
      { id: 'camel', label: 'camelCase', run: T.toCamel },
      { id: 'pascal', label: 'PascalCase', run: T.toPascal },
      { id: 'snake', label: 'snake_case', run: T.toSnake },
      { id: 'kebab', label: 'kebab-case', run: T.toKebab },
      { id: 'constant', label: 'CONSTANT_CASE', run: T.toConstant },
      {
        id: 'slug',
        label: 'url-slug',
        run: T.toSlug,
        note: 'Accents are folded rather than dropped, so Café becomes cafe and not caf.',
      },
    ],
  },
  base64: {
    mono: true,
    sample: 'Hello, world',
    transforms: [
      { id: 'encode', label: 'Encode', run: T.encodeBase64 },
      {
        id: 'decode',
        label: 'Decode',
        run: T.decodeBase64,
        note: 'Invalid Base64 shows an error rather than silent nonsense.',
      },
    ],
  },
  url: {
    mono: true,
    sample: 'search?q=hello world&lang=en',
    transforms: [
      {
        id: 'component',
        label: 'Encode a value',
        run: T.encodeUrl,
        note: 'For a single parameter value. This encodes & = ? and / as well, which is what you want inside a query string.',
      },
      {
        id: 'full',
        label: 'Encode a whole URL',
        run: T.encodeUrlFull,
        note: 'Leaves the structural characters alone so the URL still works.',
      },
      { id: 'decode', label: 'Decode', run: T.decodeUrl },
    ],
  },
  /*
    One preset per thing somebody actually searches for.

    These were a single "text cleaner" carrying seven buttons, which nobody
    looks for. People search "remove empty lines" or "sort lines
    alphabetically", and a page called Text cleaner is not the answer to
    either. Each preset below gets its own page, its own title and its own
    search result. Neighbouring actions stay on the page, so the tool is still
    useful once you land on it.
  */
  'empty-lines': {
    sample: 'first line\n\n\nsecond line\n\nthird line',
    transforms: [
      { id: 'empty', label: 'Remove empty lines', run: T.removeEmptyLines },
      { id: 'trim', label: 'Trim each line', run: T.trimLines },
    ],
  },
  'duplicate-lines': {
    sample: 'banana\napple\nbanana\ncherry\napple',
    transforms: [
      { id: 'dedupe', label: 'Remove duplicates', run: T.dedupeLines },
      { id: 'sort', label: 'Sort A to Z', run: T.sortLines },
    ],
  },
  'sort-lines': {
    sample: 'cherry\nbanana\napple\ndate',
    transforms: [
      { id: 'sort', label: 'Sort A to Z', run: T.sortLines },
      { id: 'sortdesc', label: 'Sort Z to A', run: T.sortLinesDesc },
      { id: 'reverse', label: 'Reverse order', run: T.reverseLines },
      { id: 'dedupe', label: 'Remove duplicates', run: T.dedupeLines },
    ],
  },
  'strip-html': {
    sample: '<p>Hello <b>world</b></p>\n<script>alert(1)</script>\n<p>Second &amp; last.</p>',
    mono: true,
    transforms: [
      {
        id: 'html',
        label: 'Strip HTML tags',
        run: T.stripHtml,
        note: 'Script and style contents are removed rather than left behind as loose text, and entities are decoded.',
      },
    ],
  },
};

export default function TextTool({
  preset,
  placeholder = 'Paste your text here…',
  outputLabel = 'Result',
}: {
  preset: keyof typeof PRESETS;
  placeholder?: string;
  outputLabel?: string;
}) {
  const { transforms, sample, mono = false } = PRESETS[preset];
  const [input, setInput] = useState('');
  const [active, setActive] = useState(transforms[0].id);
  const [copied, setCopied] = useState(false);

  const current = transforms.find((t) => t.id === active) ?? transforms[0];

  const result = useMemo(() => {
    if (!input) return { ok: true as const, text: '' };
    try {
      return { ok: true as const, text: current.run(input) };
    } catch (e) {
      return {
        ok: false as const,
        text: e instanceof Error ? e.message : 'That did not work on this input.',
      };
    }
  }, [input, current]);

  const copy = async () => {
    if (!result.ok || !result.text) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const font = mono ? 'font-mono text-[13px]' : 'text-sm';

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {transforms.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              t.id === active
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current.note && (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">{current.note}</p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="tt-in" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Input
            </label>
            <div className="flex gap-3 text-xs">
              {sample && !input && (
                <button onClick={() => setInput(sample)} className="text-accent underline underline-offset-4">
                  Use an example
                </button>
              )}
              {input && (
                <button onClick={() => setInput('')} className="text-ink-faint underline underline-offset-4">
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            id="tt-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            rows={14}
            className={`mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 outline-none placeholder:text-ink-faint focus:border-accent ${font}`}
          />
          <p className="mt-1.5 text-xs tabular-nums text-ink-faint">
            {input.length.toLocaleString()} characters
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {outputLabel}
            </span>
            {result.ok && result.text && (
              <button onClick={() => void copy()} className="text-xs text-accent underline underline-offset-4">
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={result.ok ? result.text : ''}
            placeholder="The result appears here."
            spellCheck={false}
            rows={14}
            className={`mt-2 w-full resize-y rounded-xl border p-4 outline-none placeholder:text-ink-faint ${font} ${
              result.ok ? 'border-line bg-surface-alt' : 'border-line bg-surface-alt'
            }`}
          />
          {!result.ok ? (
            <p className="mt-1.5 text-xs leading-relaxed text-accent">{result.text}</p>
          ) : (
            <p className="mt-1.5 text-xs tabular-nums text-ink-faint">
              {result.text.length.toLocaleString()} characters
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
