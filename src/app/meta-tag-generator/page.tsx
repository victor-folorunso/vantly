import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { MetaTagGenerator } from '@/components/WebTools';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('meta-tag-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/meta-tag-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/meta-tag-generator` },
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
              url: `${SITE.url}/meta-tag-generator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Meta tag generator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Title, description and social cards, with a preview of the result.</p>

        <div className="mt-10">
          <MetaTagGenerator />
        </div>

        <LearnLink tool="meta-tag-generator" />
      </div>
    </>
  );
}
