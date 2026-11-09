import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfMarkup from '@/components/PdfMarkup';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pdf-annotator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pdf-annotator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pdf-annotator` },
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
            url: `${SITE.url}/pdf-annotator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pdf-annotator" lede={"Highlight, draw, box and leave notes on a PDF. The marks are saved into the pages, so every reader shows them."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfMarkup mode="annotate" />
        </div>

        <ToolDocs tool="pdf-annotator" />
      </div>
    </>
  );
}
