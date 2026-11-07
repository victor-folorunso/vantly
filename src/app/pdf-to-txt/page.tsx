import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfEdit from '@/components/PdfEdit';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pdf-to-txt')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pdf-to-txt` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pdf-to-txt` },
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
            url: `${SITE.url}/pdf-to-txt`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pdf-to-txt" lede="Pull the words out of a PDF, page by page, ready to copy.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfEdit mode="text" />
        </div>

        <ToolDocs tool="pdf-to-txt" />
      </div>
    </>
  );
}
