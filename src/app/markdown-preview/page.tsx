import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import MarkdownPreview from '@/components/MarkdownPreview';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('markdown-preview')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/markdown-preview` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/markdown-preview` },
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
            url: `${SITE.url}/markdown-preview`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="markdown-preview" lede="Type on the left, read the result on the right.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <MarkdownPreview />
        </div>

        <ToolDocs tool="markdown-preview" />
      </div>
    </>
  );
}
