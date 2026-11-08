import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextExtras from '@/components/TextExtras';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('html-viewer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/html-viewer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/html-viewer` },
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
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/html-viewer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="html-viewer" lede={"Source on one side, the page on the other."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <TextExtras tool="html" />
        </div>

        <ToolDocs tool="html-viewer" />
      </div>
    </>
  );
}
