import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { SitemapGenerator } from '@/components/WebTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('sitemap-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/sitemap-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/sitemap-generator` },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: tool.name,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/sitemap-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="sitemap-generator" lede={"A list of pages in, a valid sitemap.xml out."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <SitemapGenerator />
        </div>

        <ToolDocs tool="sitemap-generator" />
      </div>
    </>
  );
}
