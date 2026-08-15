'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CONVERSIONS } from '@/lib/conversions';
import { TOOLS } from '@/lib/site';

/**
 * The results half of /search.
 *
 * Same matching as the header box: every word has to appear somewhere, so word
 * order does not matter and "heic jpg" finds the same page as "jpg heic".
 * Everything is static data compiled into the bundle, so there is no request to
 * make and nothing to debounce.
 */
export default function SearchResults() {
  const params = useSearchParams();
  const [query, setQuery] = useState('');

  // Seeded from the URL so a shared or bookmarked search shows its results,
  // then owned by the input.
  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  const entries = useMemo(() => {
    return [
      ...TOOLS.map((t) => ({
        href: `/${t.slug}`,
        label: t.name,
        hint: t.blurb,
        live: t.live,
        haystack: `${t.name} ${t.slug} ${t.blurb} ${t.category}`.toLowerCase(),
      })),
      ...CONVERSIONS.map((c) => ({
        href: `/${c.slug}`,
        label: `${c.from.label} to ${c.to.label}`,
        hint: `Convert a ${c.from.long} to ${c.to.label}`,
        live: c.live,
        haystack:
          `${c.from.label} ${c.to.label} ${c.from.id} ${c.to.id} ${c.from.long} ${c.to.long} ${c.slug}`.toLowerCase(),
      })),
    ];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    return entries
      .filter((e) => words.every((w) => e.haystack.includes(w)))
      .sort((a, b) => Number(b.live) - Number(a.live));
  }, [entries, query]);

  return (
    <>
      <input
        autoFocus
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="A format, or what you want to do…"
        aria-label="Search conversions and tools"
        className="mt-6 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-sm outline-none placeholder:text-ink-faint focus:border-accent"
      />

      {query.trim() && (
        <p className="mt-4 text-sm tabular-nums text-ink-faint">
          {results.length} result{results.length === 1 ? '' : 's'}
        </p>
      )}

      <ul className="mt-3 divide-y divide-line">
        {results.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-accent"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.label}</span>
                <span className="block truncate text-sm text-ink-faint">{r.hint}</span>
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

      {query.trim() && results.length === 0 && (
        <p className="mt-6 leading-relaxed text-ink-soft">
          Nothing matches that. Try a format name like “webp”, or{' '}
          <Link href="/all" className="text-accent underline underline-offset-4">
            browse everything
          </Link>
          .
        </p>
      )}
    </>
  );
}
