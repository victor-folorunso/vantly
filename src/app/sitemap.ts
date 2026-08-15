import type { MetadataRoute } from 'next';
import { LIVE_TOOLS, SITE } from '@/lib/site';

/*
  Derived from the tool list rather than hand written. A hand listed sitemap
  goes stale the first time somebody adds a page and forgets, and nothing fails
  loudly when it does: the page simply never gets crawled.

  LIVE_TOOLS rather than TOOLS, so a tool advertised as "soon" on the home page
  is never submitted as a URL that 404s.
*/
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...LIVE_TOOLS.map((t) => ({
      url: `${SITE.url}/${t.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
