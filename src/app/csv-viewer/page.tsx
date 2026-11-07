import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CsvTools from '@/components/CsvTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('csv-viewer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/csv-viewer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/csv-viewer` },
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
            url: `${SITE.url}/csv-viewer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="csv-viewer" lede="Open a CSV too big for Excel. Search it, read it, no upload.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <CsvTools mode="view" />
        </div>

        <ToolDocs tool="csv-viewer" />
      </div>
    </>
  );
}
