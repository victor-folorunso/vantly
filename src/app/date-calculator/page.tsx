import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DateCalculator from '@/components/DateCalculator';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('date-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/date-calculator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/date-calculator` },
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
        <ToolHeader slug="date-calculator" lede="Days between two dates, or the date a number of days from one.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <DateCalculator />
        </div>

        <ToolDocs tool="date-calculator" />
      </div>
    </>
  );
}
