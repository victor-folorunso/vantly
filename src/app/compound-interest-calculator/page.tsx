import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { CompoundCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('compound-interest-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/compound-interest-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/compound-interest-calculator` },
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
              url: `${SITE.url}/compound-interest-calculator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compound interest calculator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">See how much of the final number is your money and how much is growth.</p>

        <div className="mt-10">
          <CompoundCalculator />
        </div>

        <ToolDocs tool="compound-interest-calculator" />
      </div>
    </>
  );
}
