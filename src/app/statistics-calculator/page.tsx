import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { StatisticsCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('statistics-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/statistics-calculator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/statistics-calculator` },
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
            url: `${SITE.url}/statistics-calculator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="statistics-calculator" lede={"Mean, median, mode, spread and quartiles from a pasted list."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <StatisticsCalculator />
        </div>

        <ToolDocs tool="statistics-calculator" />
      </div>
    </>
  );
}
