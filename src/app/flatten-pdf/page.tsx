import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfFlatten from '@/components/PdfFlatten';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('flatten-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/flatten-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/flatten-pdf` },
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
            url: `${SITE.url}/flatten-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="flatten-pdf" lede={"Fix the form answers, comments and highlights into the page, so the copy you send cannot be changed."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfFlatten />
        </div>

        <ToolDocs tool="flatten-pdf" />
      </div>
    </>
  );
}
