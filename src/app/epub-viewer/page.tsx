import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import EpubReader from '@/components/EpubReader';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('epub-viewer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/epub-viewer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/epub-viewer` },
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
            url: `${SITE.url}/epub-viewer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="epub-viewer" lede={"Read an ebook in the browser, a page at a time."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <EpubReader />
        </div>

        <ToolDocs tool="epub-viewer" />
      </div>
    </>
  );
}
