import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { RoiCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('roi-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/roi-calculator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/roi-calculator` },
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
            url: `${SITE.url}/roi-calculator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="roi-calculator" lede={"What came back against what went in, and what that is per year."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <RoiCalculator />
        </div>

        <ToolDocs tool="roi-calculator" />
      </div>
    </>
  );
}
