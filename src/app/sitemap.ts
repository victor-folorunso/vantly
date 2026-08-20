import type { MetadataRoute } from 'next';
import { LIVE_TOOLS, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';
import { allDocs } from '@/lib/docs';

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
  const docs = new Map(allDocs().filter((d) => d.updated).map((d) => [d.tool.slug, d.updated]));

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
      url: `${SITE.url}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    /* The index of every doc. The docs themselves live on the tool pages,
       which are already listed below, so there is nothing else to add here. */
    {
      url: `${SITE.url}/learn`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    /* A documented tool carries the doc's date, which is the one sitemap field
       Google reliably reads. Pinned to midnight UTC: handing over a bare date
       produced an invalid lastmod a day early, because the build machine sits
       west of UTC and read it as local midnight. */
    ...[...slugs].map((slug) => {
      const doc = docs.get(slug);
      return {
        url: `${SITE.url}/${slug}`,
        ...(doc ? { lastModified: new Date(`${doc}T00:00:00Z`) } : {}),
        changeFrequency: 'monthly' as const,
        // A tool with an explanation is a better landing page than one without.
        priority: doc ? 0.9 : 0.8,
      };
    }),
  ];
}
