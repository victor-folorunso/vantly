import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('sort-lines')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/sort-lines` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/sort-lines` },
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
            url: `${SITE.url}/sort-lines`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Sort lines
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Put a list in order, forwards, backwards or reversed.</p>

        <div className="mt-10">
          <TextTool preset="sort-lines" outputLabel="Result" />
        </div>

        <ToolDocs tool="sort-lines" />
      </div>
    </>
  );
}
