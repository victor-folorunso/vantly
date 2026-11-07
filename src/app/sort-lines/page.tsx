import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('sort-lines')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/sort-lines` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/sort-lines` },
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
            url: `${SITE.url}/sort-lines`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="sort-lines" lede="Put a list in order, forwards, backwards or reversed.">Sort lines</ToolHeader>

        <div className="mt-10">
          <TextTool preset="sort-lines" outputLabel="Result" />
        </div>

        <ToolDocs tool="sort-lines" />
      </div>
    </>
  );
}
