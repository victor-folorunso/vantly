import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfPages from '@/components/PdfPages';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('rotate-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/rotate-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/rotate-pdf` },
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
            url: `${SITE.url}/rotate-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="rotate-pdf" lede={"Click the pages that came in sideways to turn them, then save. The rest stay as they are."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfPages mode="rotate" />
        </div>

        <ToolDocs tool="rotate-pdf" />
      </div>
    </>
  );
}
