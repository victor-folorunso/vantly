'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE, TOOLS, CATEGORIES } from '@/lib/site';
import { CONVERSIONS, CONVERSION_BY_SLUG, relatedConversions } from '@/lib/conversions';

/**
 * The footer has to say what the site is, and it has to be crawlable.
 *
 * The old one listed only conversions, which made a multi tool site look like a
 * file converter with a long menu. Conversion is one category out of eleven.
 *
 * A conversion page still gets its neighbours first. Somebody who wanted PNG to
 * WebP probably wants PNG to AVIF next, not a hash generator.
 */

const PER_CATEGORY = 3;

export default function Footer() {
  const pathname = usePathname();
  const slug = pathname.split('/').filter(Boolean)[0];
  const conversion = slug ? CONVERSION_BY_SLUG.get(slug) : undefined;

  const groups = CATEGORIES.map((category) => ({
    category,
    // Working ones first, so this reads as a site rather than a wishlist.
    items: [...TOOLS.filter((t) => t.category === category)]
      .sort((a, b) => Number(b.live) - Number(a.live))
      .slice(0, PER_CATEGORY),
  })).filter((g) => g.items.length > 0);

  const neighbours = conversion ? relatedConversions(conversion, 8) : [];

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        {neighbours.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              More {conversion!.from.label} conversions
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {neighbours.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className={`inline-block rounded-lg border border-line px-2.5 py-1 text-sm transition-colors hover:border-accent hover:text-accent ${
                      c.live ? 'text-ink-soft' : 'text-ink-faint'
                    }`}
                  >
                    {c.from.label} to {c.to.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-x-6 gap-y-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          {groups.map((g) => (
            <div key={g.category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <Link href={`/all#${g.category.toLowerCase()}`} className="inline-block py-1.5 hover:text-ink sm:py-0">
                  {g.category}
                </Link>
              </h2>
              <ul className="mt-2 space-y-0.5">
                {g.items.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className={`block truncate py-2 text-sm transition-colors hover:text-accent sm:py-0.5 ${
                        t.live ? 'text-ink-soft' : 'text-ink-faint'
                      }`}
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              <Link href="/all#conversions" className="inline-block py-1.5 hover:text-ink sm:py-0">
                Conversions
              </Link>
            </h2>
            <ul className="mt-2 space-y-0.5">
              {CONVERSIONS.filter((c) => c.live)
                .slice(0, PER_CATEGORY)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      className="block truncate py-2 text-sm text-ink-soft transition-colors hover:text-accent sm:py-0.5"
                    >
                      {c.from.label} to {c.to.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-5 text-sm text-ink-faint">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 [&>a]:py-1.5 sm:[&>a]:py-0">
            <Link href="/all" className="hover:text-ink">
              All tools
            </Link>
            <Link href="/suggest" className="hover:text-ink">
              Suggest a tool
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              GitHub
            </a>
            <span>
              © {new Date().getFullYear()} {SITE.name}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
