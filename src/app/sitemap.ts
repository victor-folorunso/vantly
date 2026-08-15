import type { MetadataRoute } from 'next';
import { LIVE_TOOLS, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

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
    ...[...slugs].map((slug) => ({
      url: `${SITE.url}/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
