import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfEdit from '@/components/PdfEdit';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('add-page-numbers')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/add-page-numbers` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/add-page-numbers` },
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
            url: `${SITE.url}/add-page-numbers`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="add-page-numbers" lede={"Number every page, in the corner you choose, starting from any number. Sideways pages are numbered the right way up."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfEdit mode="number" />
        </div>

        <ToolDocs tool="add-page-numbers" />
      </div>
    </>
  );
}
