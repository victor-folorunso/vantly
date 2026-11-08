import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextExtras from '@/components/TextExtras';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('character-counter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/character-counter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/character-counter` },
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
            url: `${SITE.url}/character-counter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="character-counter" lede={"Characters as you see them, against the limits you are writing for."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <TextExtras tool="chars" />
        </div>

        <ToolDocs tool="character-counter" />
      </div>
    </>
  );
}
