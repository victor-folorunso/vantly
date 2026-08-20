import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfPages from '@/components/PdfPages';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('split-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/split-pdf` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/split-pdf` },
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
            url: `${SITE.url}/split-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Pick the pages you want and leave the rest behind.</p>

        <div className="mt-10">
          <PdfPages mode="split" />
        </div>

        <ToolDocs tool="split-pdf" />
      </div>
    </>
  );
}
