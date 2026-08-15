import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/*
  AI crawlers are allowed deliberately. Cladior spent weeks wondering why no
  assistant ever mentioned it, and the answer was a firewall rule returning 403
  to every one of them. Being quotable in an answer is worth more to a tools
  site than whatever is lost by being read.
*/
// Static export has no server to answer a request, so this has to be written
// out at build time rather than generated per request.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
