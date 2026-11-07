import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CodeGenerator from '@/components/CodeGenerator';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('barcode-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/barcode-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/barcode-generator` },
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
            url: `${SITE.url}/barcode-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="barcode-generator" lede="Code 128, EAN, UPC and the rest, checked as you type.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <CodeGenerator kind="barcode" />
        </div>

        <ToolDocs tool="barcode-generator" />
      </div>
    </>
  );
}
