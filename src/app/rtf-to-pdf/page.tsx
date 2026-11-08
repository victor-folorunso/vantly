import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ConvertToPdf from '@/components/ConvertToPdf';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('rtf-to-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/rtf-to-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/rtf-to-pdf` },
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
            url: `${SITE.url}/rtf-to-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="rtf-to-pdf" lede={"An RTF document as a PDF, with its fonts and formatting kept."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <ConvertToPdf from="rtf" />
        </div>

        <ToolDocs tool="rtf-to-pdf" />
      </div>
    </>
  );
}
