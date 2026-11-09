import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfMarkup from '@/components/PdfMarkup';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('edit-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/edit-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/edit-pdf` },
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
            url: `${SITE.url}/edit-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="edit-pdf" lede={"Change a line of text, add your own, white things out, add pictures, and turn, move or delete pages."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfMarkup mode="edit" />
        </div>

        <ToolDocs tool="edit-pdf" />
      </div>
    </>
  );
}
