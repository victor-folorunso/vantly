import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PlaceholderImage from '@/components/PlaceholderImage';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('placeholder-300x250')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/placeholder-300x250` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/placeholder-300x250` },
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
            url: `${SITE.url}/placeholder-300x250`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="placeholder-300x250" lede="The medium rectangle, the most used display ad size there is.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <PlaceholderImage width={300} height={250} fixed />
        </div>

        <ToolDocs tool="placeholder-300x250" />
      </div>
    </>
  );
}
