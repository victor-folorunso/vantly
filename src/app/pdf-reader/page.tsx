import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfViewer from '@/components/PdfViewer';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('pdf-reader')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pdf-reader` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/pdf-reader` },
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
            url: `${SITE.url}/pdf-reader`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Read a PDF a page at a time, or scroll the whole thing.</p>

        <div className="mt-10">
          <PdfViewer />
        </div>

        <ToolDocs tool="pdf-reader" />
      </div>
    </>
  );
}
