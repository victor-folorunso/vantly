'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CONVERSIONS } from '@/lib/conversions';
import { TOOLS } from '@/lib/site';

/**
 * One box over both lists.
 *
 * A visitor does not know whether the thing they want is filed as a tool or as
 * a conversion, and should not have to. Matching is done on a flattened haystack
 * per entry so "heic jpg", "jpg heic" and "iphone photo" all reach the same
 * page.
 *
 * Everything is in memory already, since the lists are static data compiled
 * into the bundle. No request, no debounce, nothing to get out of sync.
 */

type Entry = {
  href: string;
  label: string;
  hint: string;
  live: boolean;
  haystack: string;
};

export default function Search({ placeholder = 'Search 100+ conversions and tools…' }: { placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const entries = useMemo<Entry[]>(() => {
    const fromTools: Entry[] = TOOLS.map((t) => ({
      href: `/${t.slug}`,
      label: t.name,
      hint: t.category,
      live: t.live,
      haystack: `${t.name} ${t.slug} ${t.blurb} ${t.category}`.toLowerCase(),
    }));
    const fromConversions: Entry[] = CONVERSIONS.map((c) => ({
      href: `/${c.slug}`,
      label: `${c.from.label} to ${c.to.label}`,
      hint: 'Convert',
      live: c.live,
      haystack:
        `${c.from.label} ${c.to.label} ${c.from.id} ${c.to.id} ${c.from.long} ${c.to.long} ${c.slug}`.toLowerCase(),
    }));
    return [...fromTools, ...fromConversions];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Every word has to appear somewhere, which makes word order irrelevant.
    const words = q.split(/\s+/);
    return entries
      .filter((e) => words.every((w) => e.haystack.includes(w)))
      .sort((a, b) => Number(b.live) - Number(a.live))
      .slice(0, 8);
  }, [entries, query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            // Enter goes to the full results page. The dropdown shows eight;
            // a search with forty matches needs somewhere to put the rest.
            if (e.key === 'Enter' && query.trim()) {
              setOpen(false);
              router.push(`/search/?q=${encodeURIComponent(query.trim())}`);
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          aria-label="Search conversions and tools"
          className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/10">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-ink-soft">
              Nothing matches that. Try a format name, like “webp”.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-alt"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.label}</span>
                      <span className="block text-xs text-ink-faint">{r.hint}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        r.live ? 'bg-accent-soft text-accent' : 'text-ink-faint'
                      }`}
                    >
                      {r.live ? 'Ready' : 'Soon'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
