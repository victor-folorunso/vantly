import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('remove-duplicate-lines')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/remove-duplicate-lines` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/remove-duplicate-lines` },
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
            url: `${SITE.url}/remove-duplicate-lines`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Remove duplicate lines
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Keep the first of each line and drop the repeats.</p>

        <div className="mt-10">
          <TextTool preset="duplicate-lines" outputLabel="Result" />
        </div>

        <LearnLink tool="remove-duplicate-lines" />
      </div>
    </>
  );
}
