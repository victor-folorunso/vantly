import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfPages from '@/components/PdfPages';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('delete-pdf-pages')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/delete-pdf-pages` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/delete-pdf-pages` },
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
            url: `${SITE.url}/delete-pdf-pages`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="delete-pdf-pages" lede={"Click the pages you do not want, the blank scans and the cover sheets, and save the PDF without them."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfPages mode="delete" />
        </div>

        <ToolDocs tool="delete-pdf-pages" />
      </div>
    </>
  );
}
