import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import LoremIpsum from '@/components/LoremIpsum';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('lorem-ipsum-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/lorem-ipsum-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/lorem-ipsum-generator` },
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
            url: `${SITE.url}/lorem-ipsum-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="lorem-ipsum-generator" lede="Placeholder text in the amount you need, by paragraph, sentence or word.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <LoremIpsum />
        </div>

        <ToolDocs tool="lorem-ipsum-generator" />
      </div>
    </>
  );
}
