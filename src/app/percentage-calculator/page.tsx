import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { PercentageCalculator } from '@/components/Calculators';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('percentage-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/percentage-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/percentage-calculator` },
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
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/percentage-calculator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Percentage calculator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">The three questions people actually ask, answered at once.</p>

        <div className="mt-10">
          <PercentageCalculator />
        </div>

        <LearnLink tool="percentage-calculator" />
      </div>
    </>
  );
}
