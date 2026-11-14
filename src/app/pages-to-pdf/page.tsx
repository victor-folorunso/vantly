import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ConvertToPdf from '@/components/ConvertToPdf';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pages-to-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pages-to-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pages-to-pdf` },
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
            url: `${SITE.url}/pages-to-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pages-to-pdf" lede={"An Apple Pages document as a PDF anyone can open, without a Mac."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <ConvertToPdf from="pages" />
        </div>

        <ToolDocs tool="pages-to-pdf" />
      </div>
    </>
  );
}
