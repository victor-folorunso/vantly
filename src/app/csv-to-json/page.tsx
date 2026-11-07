import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CsvTools from '@/components/CsvTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('csv-to-json')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/csv-to-json` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/csv-to-json` },
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
            url: `${SITE.url}/csv-to-json`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="csv-to-json" lede="Numbers stay numbers and empty cells become null.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <CsvTools mode="json" />
        </div>

        <ToolDocs tool="csv-to-json" />
      </div>
    </>
  );
}
