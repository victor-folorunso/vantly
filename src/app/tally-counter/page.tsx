import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import Playthings from '@/components/Playthings';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('tally-counter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/tally-counter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/tally-counter` },
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
            url: `${SITE.url}/tally-counter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="tally-counter" lede={"Click or press a key to count. Several counters, kept between visits."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <Playthings tool="tally" />
        </div>

        <ToolDocs tool="tally-counter" />
      </div>
    </>
  );
}
