import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfRedact from '@/components/PdfRedact';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('redact-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/redact-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/redact-pdf` },
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
            url: `${SITE.url}/redact-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="redact-pdf" lede={"Black out names, numbers and anything else, so the saved copy has nothing underneath to copy back out."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfRedact />
        </div>

        <ToolDocs tool="redact-pdf" />
      </div>
    </>
  );
}
