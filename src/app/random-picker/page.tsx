import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import RandomPicker from '@/components/RandomPicker';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('random-picker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/random-picker` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/random-picker` },
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
            url: `${SITE.url}/random-picker`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="random-picker" lede="Draw a name, pick a winner, or shuffle a list into a running order.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <RandomPicker />
        </div>

        <ToolDocs tool="random-picker" />
      </div>
    </>
  );
}
