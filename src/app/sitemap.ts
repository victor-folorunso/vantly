import type { MetadataRoute } from 'next';
import { LIVE_TOOLS, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';
import { allArticles } from '@/lib/learn';

/*
  Derived from the lists rather than hand written. A hand listed sitemap goes
  stale the first time somebody adds a page and forgets, and nothing fails
  loudly when it does: the page simply never gets crawled.

  Live entries only. A tool advertised as "soon" is never submitted, because a
  page that ranks for "compress pdf" and then cannot compress a PDF teaches the
  visitor and the search engine the same thing.

  Tools and conversions overlap, since /heic-to-jpg is both, so the slugs are
  deduped before being written out.
*/
// Static export has no server to answer a request, so this has to be written
// out at build time rather than generated per request.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = new Set<string>([
    ...LIVE_TOOLS.map((t) => t.slug),
    ...CONVERSIONS.filter((c) => c.live).map((c) => c.slug),
  ]);

  return [
    {
      url: SITE.url,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // The index of everything. Included because it is the one page that links
    // to all the others, which is the path a crawler can actually walk.
    {
      url: `${SITE.url}/all`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE.url}/suggest`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE.url}/learn`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    /*
      Articles are the only pages here carrying a real modified date, which is
      the one sitemap field Google reliably reads.

      Pinned to midnight UTC rather than handed over as a bare date. Passing
      "2026-08-15" produced "Fri Aug 14 2026 19:00:00 GMT-0500": the wrong
      format for a sitemap, and a day early, because the build machine sits west
      of UTC and the date was read as local midnight.
    */
    ...allArticles().map((a) => ({
      url: `${SITE.url}/learn/${a.slug}`,
      lastModified: new Date(`${a.updated}T00:00:00Z`).toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...[...slugs].map((slug) => ({
      url: `${SITE.url}/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
