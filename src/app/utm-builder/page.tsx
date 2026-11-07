import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { UtmBuilder } from '@/components/WebTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('utm-builder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/utm-builder` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/utm-builder` },
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
              url: `${SITE.url}/utm-builder`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="utm-builder" lede="Build a tracked link, and catch the mistakes that split one campaign into four.">UTM link builder</ToolHeader>

        <div className="mt-10">
          <UtmBuilder />
        </div>

        <ToolDocs tool="utm-builder" />
      </div>
    </>
  );
}
