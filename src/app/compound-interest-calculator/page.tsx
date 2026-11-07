import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { CompoundCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('compound-interest-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/compound-interest-calculator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/compound-interest-calculator` },
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
        <ToolHeader slug="compound-interest-calculator" lede="See how much of the final number is your money and how much is growth.">Compound interest calculator</ToolHeader>

        <div className="mt-10">
          <CompoundCalculator />
        </div>

        <ToolDocs tool="compound-interest-calculator" />
      </div>
    </>
  );
}
