import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import OcrTool from '@/components/OcrTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pdf-ocr')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pdf-ocr` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pdf-ocr` },
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
            url: `${SITE.url}/pdf-ocr`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pdf-ocr" lede="For a PDF that is pictures of words, where selecting text does nothing.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <OcrTool mode="pdf" />
        </div>

        <ToolDocs tool="pdf-ocr" />
      </div>
    </>
  );
}
