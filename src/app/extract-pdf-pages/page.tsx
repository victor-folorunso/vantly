import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfPages from '@/components/PdfPages';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('extract-pdf-pages')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/extract-pdf-pages` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/extract-pdf-pages` },
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
            url: `${SITE.url}/extract-pdf-pages`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="extract-pdf-pages" lede={"Pick the pages you need and save them as their own PDF. The original stays as it was."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfPages mode="extract" />
        </div>

        <ToolDocs tool="extract-pdf-pages" />
      </div>
    </>
  );
}
