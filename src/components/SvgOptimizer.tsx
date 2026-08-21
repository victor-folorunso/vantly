'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import ToolLayout from '@/components/ToolLayout';

/**
 * Strips the parts of an SVG that nothing renders.
 *
 * Editors leave a great deal behind. Illustrator and Figma write their own
 * namespaced metadata, comments, empty groups and a title nobody reads, and
 * on an icon that is often more bytes than the artwork.
 *
 * The parsing is done with DOMParser rather than regular expressions, because
 * an SVG is XML and a regular expression that edits XML will eventually eat
 * something inside an attribute value. Only the things listed below are
 * removed, and anything unrecognised is left exactly as it was.
 */

const DROP_TAGS = ['metadata', 'title', 'desc', 'sodipodi:namedview', 'defs:empty'];
const DROP_ATTR_PREFIXES = ['inkscape:', 'sodipodi:', 'xmlns:inkscape', 'xmlns:sodipodi', 'data-name'];
const DROP_ATTRS = ['version', 'xml:space', 'enable-background'];

function round(value: string, places: number): string {
  // Only touches runs of digits, so ids, colours and units survive.
  return value.replace(/-?\d*\.\d+/g, (n) => {
    const r = Number(n).toFixed(places);
    return String(Number(r));
  });
}

type Options = { precision: number; dropIds: boolean; dropTitle: boolean };

function optimise(source: string, opts: Options): { out: string; error?: string } {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const failure = doc.querySelector('parsererror');
  if (failure || !doc.documentElement || doc.documentElement.nodeName === 'html') {
    return { out: '', error: 'That does not parse as SVG.' };
  }

  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      const tag = child.nodeName.toLowerCase();

      if (DROP_TAGS.includes(tag) && (tag !== 'title' || opts.dropTitle)) {
        child.remove();
        continue;
      }

      for (const attr of [...child.attributes]) {
        const name = attr.name;
        if (
          DROP_ATTR_PREFIXES.some((p) => name.startsWith(p)) ||
          DROP_ATTRS.includes(name) ||
          (opts.dropIds && name === 'id')
        ) {
          child.removeAttribute(name);
          continue;
        }
        if (/^(d|points|transform|x|y|cx|cy|r|rx|ry|width|height|stroke-width|viewBox)$/.test(name)) {
          child.setAttribute(name, round(attr.value, opts.precision));
        }
      }

      walk(child);

      // An empty group renders nothing, so it is only bytes. Done after the
      // walk, since a group can become empty once its children are dropped.
      if (child.nodeName.toLowerCase() === 'g' && child.children.length === 0 && !child.textContent?.trim()) {
        child.remove();
      }
    }
  };

  const root = doc.documentElement;
  for (const attr of [...root.attributes]) {
    if (DROP_ATTR_PREFIXES.some((p) => attr.name.startsWith(p)) || DROP_ATTRS.includes(attr.name)) {
      root.removeAttribute(attr.name);
    }
  }
  if (root.hasAttribute('viewBox')) {
    root.setAttribute('viewBox', round(root.getAttribute('viewBox')!, opts.precision));
  }
  walk(root);

  let out = new XMLSerializer().serializeToString(root);
  out = out
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { out };
}

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" viewBox="0 0 24.000000 24.000000" width="24" height="24">
  <title>Untitled artwork</title>
  <metadata>Made with an editor</metadata>
  <g id="Layer_1" inkscape:label="Layer 1">
    <path d="M12.00000 2.0000 L22.000 22.00000 L2.0000 22.0000 Z" fill="#0b6b53"/>
  </g>
  <g id="empty"></g>
</svg>`;

export default function SvgOptimizer() {
  const [source, setSource] = useState(SAMPLE);
  const [precision, setPrecision] = useState(2);
  const [dropIds, setDropIds] = useState(false);
  const [dropTitle, setDropTitle] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* DOMParser is a browser API and this page is prerendered, so the work has
     to wait for mount. useEffect rather than useMemo: useMemo runs during
     render, including the render that happens on the build machine, which is
     exactly where there is no DOMParser. */
  useEffect(() => setMounted(true), []);

  const { out, error } = useMemo(
    () => (mounted ? optimise(source, { precision, dropIds, dropTitle }) : { out: '' }),
    [source, precision, dropIds, dropTitle, mounted],
  );

  const load = useCallback(async (file: File) => setSource(await file.text()), []);

  const before = new Blob([source]).size;
  const after = new Blob([out]).size;
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;

  return (
    <ToolLayout
      settings={
        <>
          <label className="block text-sm">
            <span className="flex justify-between gap-6">
              Decimal places
              <span className="tabular-nums text-ink-faint">{precision}</span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className="mt-1.5 w-40 accent-[var(--accent)]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={dropTitle} onChange={(e) => setDropTitle(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Drop the title
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={dropIds} onChange={(e) => setDropIds(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Drop ids
          </label>
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Open a file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }}
          />
        </>
      }
    >
      {dropIds && (
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Only drop ids if nothing points at them. CSS, animation and
          <code className="mx-1 font-mono">use</code> all reference an SVG by id.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Your SVG, {formatBytes(before)}
          </span>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={18}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {error ? 'Result' : `${formatBytes(after)}, ${saved}% smaller`}
            </span>
            {!error && out && (
              <div className="flex gap-4 text-sm">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(out);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-accent underline underline-offset-4"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <DownloadButton href={URL.createObjectURL(new Blob([out], { type: 'image/svg+xml' }))} filename="optimised.svg">
                  Download
                </DownloadButton>
              </div>
            )}
          </div>
          {error ? (
            <p className="mt-2 rounded-xl border border-line bg-surface p-4 text-sm text-accent">{error}</p>
          ) : (
            <>
              <textarea
                value={out}
                readOnly
                rows={12}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
              />
              <div className="mt-3 flex items-center justify-center rounded-xl border border-line bg-surface p-6">
                <div
                  className="max-h-40 [&>svg]:max-h-40 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: out }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
