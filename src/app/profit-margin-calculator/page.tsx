import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ProfitMarginCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('profit-margin-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/profit-margin-calculator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/profit-margin-calculator` },
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
            url: `${SITE.url}/profit-margin-calculator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="profit-margin-calculator" lede={"Margin, markup, and the price that gets you the margin you want."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <ProfitMarginCalculator />
        </div>

        <ToolDocs tool="profit-margin-calculator" />
      </div>
    </>
  );
}
