import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { FractionCalculator } from '@/components/Calculators';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('fraction-to-decimal')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/fraction-to-decimal` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/fraction-to-decimal` },
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
            url: `${SITE.url}/fraction-to-decimal`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="fraction-to-decimal" lede={"Exact decimals, repeating digits marked, and back to a fraction."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <FractionCalculator />
        </div>

        <ToolDocs tool="fraction-to-decimal" />
      </div>
    </>
  );
}
