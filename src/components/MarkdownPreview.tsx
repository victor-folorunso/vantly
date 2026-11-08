'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
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

/**
 * preview  type on the left, read on the right
 * viewer   open a .md file and read it, editing only if asked
 * html     type markdown, take away the HTML source it produces
 */
export type MarkdownMode = 'preview' | 'viewer' | 'html';

export default function MarkdownPreview({ mode = 'preview' }: { mode?: MarkdownMode }) {
  const [text, setText] = useState(SAMPLE);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [editing, setEditing] = useState(mode !== 'viewer');
  const [showSource, setShowSource] = useState(true);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFile = async (f: File | undefined) => {
    if (!f) return;
    setText(await f.text());
    setFileName(f.name);
  };

  // The HTML handed over as source is marked's own output. It is text in a
  // box, never inserted into this page, so it is not cut down to the safe
  // subset the preview uses.
  const source = useMemo(() => (mode === 'html' ? (marked.parse(text, { async: false }) as string) : ''), [text, mode]);

  // Sanitising needs a DOM, which the static export does not have at build
  // time, so the preview fills in after mount.
  useEffect(() => setMounted(true), []);

  const html = useMemo(() => {
    if (!mounted) return '';
    return sanitise(marked.parse(text, { async: false }) as string);
  }, [text, mounted]);

  if (mode === 'html') {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Markdown</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={22}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-line p-0.5 text-xs">
              {(['HTML', 'Rendered'] as const).map((label, i) => (
                <button
                  key={label}
                  onClick={() => setShowSource(i === 0)}
                  aria-pressed={showSource === (i === 0)}
                  className={`rounded-md px-2.5 py-1 ${showSource === (i === 0) ? 'bg-accent-soft text-ink' : 'text-ink-soft'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(source);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy HTML'}
              </button>
              <DownloadButton
                prepare={async () => new Blob([source], { type: 'text/html' })}
                filename="markdown.html"
                variant="quiet"
              >
                Download .html
              </DownloadButton>
            </div>
          </div>
          {showSource ? (
            <textarea
              value={source}
              readOnly
              rows={22}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
            />
          ) : (
            <div
              className="prose-vantly mt-2 min-h-[22rem] overflow-x-auto rounded-xl border border-line bg-surface p-5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    );
  }

  if (mode === 'viewer') {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void openFile(e.dataTransfer.files?.[0]); }}
        className={dragging ? 'rounded-2xl outline-2 outline-dashed outline-accent' : ''}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-ink-soft">
            {fileName ?? 'A sample. Open a file, or drop one anywhere here.'}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink"
            >
              Open a .md file
            </button>
            <button onClick={() => setEditing((e) => !e)} className="text-accent underline underline-offset-4">
              {editing ? 'Stop editing' : 'Edit'}
            </button>
            {fileName && (
              <DownloadButton
                prepare={async () => new Blob([text], { type: 'text/markdown' })}
                filename={fileName}
                variant="quiet"
              >
                Save
              </DownloadButton>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain"
            className="sr-only"
            onChange={(e) => { void openFile(e.target.files?.[0]); e.target.value = ''; }}
          />
        </div>
        <div className={editing ? 'grid gap-6 lg:grid-cols-2' : ''}>
          {editing && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={24}
              spellCheck={false}
              aria-label="Markdown"
              className="w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
            />
          )}
          <article
            className={`prose-vantly min-h-[22rem] overflow-x-auto rounded-xl border border-line bg-surface p-6 sm:p-8 ${
              editing ? '' : 'mx-auto max-w-3xl'
            }`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    );
  }

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
