import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DateCalculator from '@/components/DateCalculator';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('date-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/date-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/date-calculator` },
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
            url: `${SITE.url}/date-calculator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Days between two dates, or the date a number of days from one.</p>

        <div className="mt-10">
          <DateCalculator />
        </div>

        <ToolDocs tool="date-calculator" />
      </div>
    </>
  );
}
