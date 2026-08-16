import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('url-encoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/url-encoder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/url-encoder` },
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
              url: `${SITE.url}/url-encoder`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">URL encode and decode</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Percent-encode text so it survives being put in a URL, or decode one you have been handed.</p>

        <div className="mt-10">
          <TextTool preset="url" outputLabel="Result" />
        </div>

        <LearnLink tool="url-encoder" />
      </div>
    </>
  );
}
