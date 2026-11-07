import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import SvgOptimizer from '@/components/SvgOptimizer';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('svg-optimizer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/svg-optimizer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/svg-optimizer` },
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
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/svg-optimizer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="svg-optimizer" lede="Strip the editor leftovers your icons are carrying.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <SvgOptimizer />
        </div>

        <ToolDocs tool="svg-optimizer" />
      </div>
    </>
  );
}
