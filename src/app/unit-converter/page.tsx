import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import UnitConverter from '@/components/UnitConverter';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('unit-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/unit-converter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/unit-converter` },
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
              url: `${SITE.url}/unit-converter`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Convert units</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Length, weight, temperature, area, volume, speed and data.
        </p>

        <div className="mt-10">
          <UnitConverter />
        </div>

        <LearnLink tool="unit-converter" />
      </div>
    </>
  );
}
