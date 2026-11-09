import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ScanToPdf from '@/components/ScanToPdf';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('scan-to-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/scan-to-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/scan-to-pdf` },
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
            url: `${SITE.url}/scan-to-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="scan-to-pdf" lede={"Photos of paper in, a clean PDF out: the sheet found, straightened and whitened."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <ScanToPdf />
        </div>

        <ToolDocs tool="scan-to-pdf" />
      </div>
    </>
  );
}
