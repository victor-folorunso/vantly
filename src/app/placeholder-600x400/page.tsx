import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PlaceholderImage from '@/components/PlaceholderImage';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('placeholder-600x400')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/placeholder-600x400` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/placeholder-600x400` },
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
            url: `${SITE.url}/placeholder-600x400`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="placeholder-600x400" lede="A card or a thumbnail in a grid.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <PlaceholderImage width={600} height={400} fixed />
        </div>

        <ToolDocs tool="placeholder-600x400" />
      </div>
    </>
  );
}
