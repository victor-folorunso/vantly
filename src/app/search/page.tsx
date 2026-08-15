import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';
import { SITE } from '@/lib/site';

/**
 * A real page behind the SearchAction declared in the layout.
 *
 * Google is told this site has its own search, and telling it that while the
 * URL 404s is worse than never claiming it. It also gives the header box
 * somewhere to go when somebody presses Enter rather than picking a suggestion.
 *
 * Left out of the sitemap and out of the index: it is a way through the site
 * rather than a destination, and an empty search page has nothing on it to rank.
 */

const title = 'Search';
const description = 'Find a conversion or a tool.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/search` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      {/* The query is read from the URL on the client, which is not available
          while this is prerendered, so the boundary is required. */}
      <Suspense fallback={<p className="mt-6 text-ink-soft">Loading…</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
