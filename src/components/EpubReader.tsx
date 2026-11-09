'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DropIcon from '@/components/DropIcon';
import { useHandoff } from '@/components/useHandoff';

/**
 * Reads an EPUB in the page with epub.js.
 *
 * An EPUB is a zip of XHTML chapters, and epub.js lays them out a page at a
 * time in a frame. Scripts inside the book stay off, which is epub.js's
 * default: a book has no business running code, and some that do were not
 * made by whoever sold them.
 *
 * DRM-protected books (most of what Kindle and Kobo sell) are encrypted and
 * cannot be opened here or by any reader that is not licensed for them. The
 * error says so rather than leaving a blank page.
 */

type Toc = { label: string; href: string; subitems?: Toc[] };
type Book = {
  ready: Promise<void>;
  loaded: { navigation: Promise<{ toc: Toc[] }>; metadata: Promise<{ title?: string; creator?: string }> };
  renderTo: (el: Element, o: Record<string, unknown>) => Rendition;
  destroy: () => void;
  archive?: { zip?: { files?: Record<string, unknown> } };
};
type Rendition = {
  display: (target?: string) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  themes: { fontSize: (s: string) => void; override: (k: string, v: string) => void };
  on: (ev: string, fn: (arg: { start?: { href?: string; displayed?: { page: number; total: number } } }) => void) => void;
};

const SIZES = [80, 90, 100, 115, 130, 150, 175];

function flat(items: Toc[], depth = 0): (Toc & { depth: number })[] {
  return items.flatMap((t) => [{ ...t, depth }, ...flat(t.subitems ?? [], depth + 1)]);
}

export default function EpubReader() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<{ title?: string; creator?: string }>({});
  const [toc, setToc] = useState<(Toc & { depth: number })[]>([]);
  const [href, setHref] = useState('');
  const [page, setPage] = useState<{ page: number; total: number } | null>(null);
  const [size, setSize] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const book = useRef<Book | null>(null);
  const rendition = useRef<Rendition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => book.current?.destroy(), []);

  const open = useCallback(async (f: File) => {
    setError(null);
    setBusy(true);
    let replaced = false;
    try {
      const data = await f.arrayBuffer();
      const bytes = new Uint8Array(data, 0, 4);
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('not-zip');
      const { default: ePub } = await import('epubjs');
      // Past this point the open book is gone, so a failure closes the reader.
      // A file rejected above leaves the book being read where it was.
      replaced = true;
      book.current?.destroy();
      rendition.current = null;
      if (host.current) host.current.innerHTML = '';
      setFile(f);
      const b = ePub(data) as unknown as Book;
      book.current = b;
      await b.ready;
      // A rights.xml is Adobe DRM. An encryption.xml alone is not proof:
      // many ordinary books list obfuscated fonts in one and read fine.
      const files = Object.keys(b.archive?.zip?.files ?? {});
      if (files.some((n) => /META-INF\/rights\.xml$/i.test(n))) throw new Error('drm');
      const [nav, md] = await Promise.all([b.loaded.navigation, b.loaded.metadata]);
      setToc(flat(nav.toc));
      setMeta(md);
      // The host is mounted by now because file is set.
      await new Promise((r) => setTimeout(r, 0));
      const r = b.renderTo(host.current!, { width: '100%', height: '100%', flow: 'paginated', spread: 'auto', allowScriptedContent: false });
      r.themes.fontSize(`${size}%`);
      // Books often set their own leading, and many set none, which leaves
      // the browser's cramped default. 1.6 reads comfortably at any size.
      r.themes.override('line-height', '1.6');
      r.on('relocated', (loc) => {
        setHref(loc.start?.href ?? '');
        setPage(loc.start?.displayed ?? null);
      });
      await r.display();
      // Only handed out once the first page is laid out: epub.js throws if
      // asked to turn a page before then, and a quick click would do that.
      rendition.current = r;
    } catch (e) {
      if (replaced) setFile(null);
      setError(
        e instanceof Error && e.message === 'drm'
          ? 'This book is protected with DRM, so only the app it was bought for can open it.'
          : e instanceof Error && e.message === 'not-zip'
            ? 'That is not an EPUB file. An EPUB is a zip archive, and this one does not start like one.'
            : 'That book could not be opened. The file may be damaged.',
      );
    } finally {
      setBusy(false);
    }
    // size is read once at open; later changes go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useHandoff((files) => { if (files[0]) void open(files[0]); });

  useEffect(() => { rendition.current?.themes.fontSize(`${size}%`); }, [size]);

  useEffect(() => {
    if (!file) return;
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') void rendition.current?.next();
      if (e.key === 'ArrowLeft') void rendition.current?.prev();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [file]);

  const current = toc.findLast?.((t) => href && href.startsWith(t.href.split('#')[0])) ?? toc.find((t) => href && href.startsWith(t.href.split('#')[0]));

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void open(f); }}
    >
      {!file && (
        <div
          className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <DropIcon />
          <p className="text-lg font-medium">{busy ? 'Opening the book…' : 'Drop an EPUB here'}</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">The book is opened on your computer and never uploaded.</p>
          <button onClick={() => inputRef.current?.click()} className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            Choose a book
          </button>
          {error && <p className="mt-4 max-w-md text-sm leading-relaxed text-accent">{error}</p>}
        </div>
      )}

      {file && (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="order-2 lg:order-1">
            <div className="rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-4">
              <p className="font-medium leading-snug">{meta.title || file.name}</p>
              {meta.creator && <p className="mt-0.5 text-sm text-ink-soft">{meta.creator}</p>}
              <label className="mt-4 block text-sm">
                <span className="flex justify-between">
                  Text size <span className="tabular-nums text-ink-faint">{size}%</span>
                </span>
                <input
                  type="range" min={0} max={SIZES.length - 1} value={SIZES.indexOf(size)}
                  onChange={(e) => setSize(SIZES[Number(e.target.value)])}
                  className="mt-1.5 w-full" aria-label="Text size"
                />
              </label>
              {toc.length > 0 && (
                <nav className="mt-4 max-h-[50vh] overflow-y-auto border-t border-line pt-3" aria-label="Contents">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Contents</p>
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {toc.map((t, i) => (
                      <li key={i}>
                        <button
                          onClick={() => void rendition.current?.display(t.href)}
                          style={{ paddingLeft: `${0.5 + t.depth * 0.75}rem` }}
                          className={`block w-full rounded-md py-1 pr-2 text-left leading-snug hover:bg-surface-alt ${
                            current === t ? 'bg-accent-soft text-ink' : 'text-ink-soft'
                          }`}
                        >
                          {t.label.trim()}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <button onClick={() => inputRef.current?.click()} className="mt-4 text-sm text-ink-faint underline underline-offset-4">
                Open another book
              </button>
              {error && <p className="mt-2 text-xs leading-relaxed text-accent">{error}</p>}
            </div>
          </aside>
          <div className="order-1 mx-auto w-full max-w-3xl lg:order-2">
            <div className="relative h-[75vh] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-white text-black shadow-sm">
              <div ref={host} className="absolute inset-0 px-6 py-8 sm:px-10" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <button onClick={() => void rendition.current?.prev()} className="rounded-md border border-line px-4 py-2">
                Previous
              </button>
              <span className="truncate text-center text-ink-faint">
                {current?.label.trim() ?? ''}
                {page && page.total > 1 ? ` · page ${page.page} of ${page.total}` : ''}
              </span>
              <button onClick={() => void rendition.current?.next()} className="rounded-md border border-line px-4 py-2">
                Next
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-ink-faint">The arrow keys turn pages too.</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".epub,application/epub+zip"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ''; }}
      />
    </div>
  );
}
