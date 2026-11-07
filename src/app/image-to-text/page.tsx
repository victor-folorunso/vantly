import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import OcrTool from '@/components/OcrTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('image-to-text')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/image-to-text` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/image-to-text` },
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
            url: `${SITE.url}/image-to-text`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="image-to-text" lede="Pull the words out of a screenshot, a photo of a page, or a scan.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <OcrTool mode="image" />
        </div>

        <ToolDocs tool="image-to-text" />
      </div>
    </>
  );
}
