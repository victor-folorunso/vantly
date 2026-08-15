'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/site';
import { CONVERSIONS, relatedConversions, CONVERSION_BY_SLUG, type Conversion } from '@/lib/conversions';

/**
 * The footer is a crawl surface, not decoration.
 *
 * A hundred conversion pages are worth nothing if the only way to reach them is
 * a search box, which a crawler cannot type into. So every page links onward,
 * and which links appear depends on where the reader is.
 *
 * The home page carries the widest set, since it is the page most likely to be
 * found first and is the shortest path to everything else. A conversion page
 * carries its own neighbours instead, because a reader who wanted PNG to WebP
 * is far more likely to want PNG to AVIF next than they are to want MP3 to WAV.
 */

/** How many links the home page shows before it stops being a footer. */
const HOME_LIMIT = 48;

function pickForHome(): Conversion[] {
  // Live first so the working tools are never buried, then the rest in their
  // declared order, which groups by source format naturally.
  return [...CONVERSIONS].sort((a, b) => Number(b.live) - Number(a.live)).slice(0, HOME_LIMIT);
}

export default function Footer() {
  // The footer sits in the root layout, which never sees the route params, so
  // the slug comes from the path instead of being threaded through every page.
  const slug = usePathname().split('/').filter(Boolean)[0];
  const current = slug ? CONVERSION_BY_SLUG.get(slug) : undefined;
  const links = current ? relatedConversions(current, 16) : pickForHome();
  const heading = current ? `More ${current.from.label} conversions` : 'Popular conversions';

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        {links.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {heading}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {links.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className="block truncate py-1 text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {c.from.label} to {c.to.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-ink-faint">
            Everything runs in your browser. Files are not uploaded and nothing is
            stored.{' '}
            <Link href="/all" className="underline underline-offset-4 hover:text-ink">
              See everything
            </Link>{' '}
            or{' '}
            <Link href="/suggest" className="underline underline-offset-4 hover:text-ink">
              suggest something missing
            </Link>
            .
          </p>
          <p className="text-sm text-ink-faint">
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
