import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import HashGenerator from '@/components/HashGenerator';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('hash-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/hash-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/hash-generator` },
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
              url: `${SITE.url}/hash-generator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Generate a hash</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          SHA-256 and friends, for text or a whole file.
        </p>

        <div className="mt-10">
          <HashGenerator />
        </div>

        <LearnLink tool="hash-generator" />
      </div>
    </>
  );
}
