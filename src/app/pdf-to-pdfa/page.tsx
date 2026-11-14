import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfToPdfa from '@/components/PdfToPdfa';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pdf-to-pdfa')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pdf-to-pdfa` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pdf-to-pdfa` },
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
            url: `${SITE.url}/pdf-to-pdfa`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pdf-to-pdfa" lede={"The archival PDF a court, university or library asks for, with fonts embedded and the result checked."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfToPdfa />
        </div>

        <ToolDocs tool="pdf-to-pdfa" />
      </div>
    </>
  );
}
