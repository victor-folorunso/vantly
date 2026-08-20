'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';

/**
 * Markdown on the left, the result on the right.
 *
 * marked does the parsing, the same library the docs on this site are built
 * with, so what you see here is what a doc page looks like.
 *
 * The output is sanitised before it goes anywhere near the page. Markdown
 * allows raw HTML, so pasting something from the internet into a preview that
 * trusts its input is a way to run a stranger's script. The allowlist below is
 * what Markdown itself can produce, and nothing else survives.
 */

const ALLOWED_TAGS = new Set([
  'A','ABBR','BLOCKQUOTE','BR','CODE','DEL','DIV','EM','H1','H2','H3','H4','H5','H6',
  'HR','IMG','LI','OL','P','PRE','SPAN','STRONG','TABLE','TBODY','TD','TH','THEAD','TR','UL','INPUT',
]);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'type', 'checked', 'disabled', 'align']);

function sanitise(html: string): string {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        continue;
      }
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        // javascript: and data: URLs are the two that turn a link into code.
        const badUrl =
          (name === 'href' || name === 'src') &&
          (value.startsWith('javascript:') || value.startsWith('data:text/html'));
        if (!ALLOWED_ATTRS.has(name) || badUrl) child.removeAttribute(attr.name);
      }
      walk(child);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

const SAMPLE = `# Markdown preview

Type on the left, read on the right.

## What it handles

- **Bold** and *italic*
- \`inline code\`
- [Links](https://vantly.xyz)

> A quote, for when someone else said it better.

| Format | Reads it |
| --- | --- |
| GitHub | yes |
| Notion | mostly |

\`\`\`js
const tools = 209;
\`\`\`
`;

export default function MarkdownPreview() {
  const [text, setText] = useState(SAMPLE);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sanitising needs a DOM, which the static export does not have at build
  // time, so the preview fills in after mount.
  useEffect(() => setMounted(true), []);

  const html = useMemo(() => {
    if (!mounted) return '';
    return sanitise(marked.parse(text, { async: false }) as string);
  }, [text, mounted]);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Markdown
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={22}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Preview
            </span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(html);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-sm text-accent underline underline-offset-4"
            >
              {copied ? 'Copied' : 'Copy HTML'}
            </button>
          </div>
          <div
            className="prose-vantly mt-2 min-h-[22rem] overflow-x-auto rounded-xl border border-line bg-surface p-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
