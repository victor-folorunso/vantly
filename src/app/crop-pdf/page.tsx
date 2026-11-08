import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfCrop from '@/components/PdfCrop';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('crop-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/crop-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/crop-pdf` },
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
            url: `${SITE.url}/crop-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="crop-pdf" lede={"Trim the margins off every page, or just one, and see the result before you save."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfCrop />
        </div>

        <ToolDocs tool="crop-pdf" />
      </div>
    </>
  );
}
