import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import AddressGenerator from '@/components/AddressGenerator';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('address-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/address-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/address-generator` },
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
            url: `${SITE.url}/address-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="address-generator" lede={"Test addresses in the right shape for the country, leading nowhere."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <AddressGenerator />
        </div>

        <ToolDocs tool="address-generator" />
      </div>
    </>
  );
}
