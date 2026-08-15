'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONVERSION_BY_SLUG } from '@/lib/conversions';
import { toolBySlug, TOOLS } from '@/lib/site';

/**
 * A back link, since the browser button is not the only way people navigate.
 *
 * Plenty of visitors arrive from a search result, so there is nothing behind
 * them: history.back() would take them off the site entirely. The link checks
 * for real history first and falls back to somewhere sensible, which for a tool
 * page is its category and for a conversion is the full list.
 *
 * The label says where it goes rather than just "Back", because a back button
 * that could mean two different places is worse than one that names the
 * destination.
 */
export default function BackLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // history.length is 1 for a fresh tab. It is a blunt check, but the failure
    // mode is a link that navigates rather than pops, which is harmless.
    setCanGoBack(window.history.length > 1);
  }, [pathname]);

  const slug = pathname.split('/').filter(Boolean)[0];
  if (!slug || slug === 'search') return null;

  const conversion = CONVERSION_BY_SLUG.get(slug);
  const tool = toolBySlug(slug);

  const fallback = conversion
    ? { href: '/all#conversions', label: 'All conversions' }
    : tool
      ? { href: `/all#${tool.category.toLowerCase()}`, label: `All ${tool.category.toLowerCase()} tools` }
      : { href: '/', label: 'Home' };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-5">
      {canGoBack ? (
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          <Arrow />
          Back
        </button>
      ) : (
        <Link
          href={fallback.href}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          <Arrow />
          {fallback.label}
        </Link>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}
