import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('html-entity-encoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/html-entity-encoder` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/html-entity-encoder` },
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
            url: `${SITE.url}/html-entity-encoder`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="html-entity-encoder" lede={"Escape text for HTML, or turn entities back into characters."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <TextTool preset="entities" />
        </div>

        <ToolDocs tool="html-entity-encoder" />
      </div>
    </>
  );
}
