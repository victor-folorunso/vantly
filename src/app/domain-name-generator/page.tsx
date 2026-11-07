import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DomainTools from '@/components/DomainTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('domain-name-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/domain-name-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/domain-name-generator` },
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
            url: `${SITE.url}/domain-name-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="domain-name-generator" lede="Ideas from a seed word or from nothing, checked as they are made.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <DomainTools mode="ideas" />
        </div>

        <ToolDocs tool="domain-name-generator" />
      </div>
    </>
  );
}
