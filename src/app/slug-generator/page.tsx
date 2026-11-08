import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('slug-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/slug-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/slug-generator` },
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
            url: `${SITE.url}/slug-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="slug-generator" lede={"One slug per line, accents folded and punctuation dropped."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <TextTool preset="slug" outputLabel="Slugs" />
        </div>

        <ToolDocs tool="slug-generator" />
      </div>
    </>
  );
}
