import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ColorConverter } from '@/components/ColorTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('rgb-to-hsl')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/rgb-to-hsl` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/rgb-to-hsl` },
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
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/rgb-to-hsl`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="rgb-to-hsl" lede={<>{tool.description}</>}>{tool.title}</ToolHeader>

        <div className="mt-10">
          <ColorConverter />
        </div>

        <ToolDocs tool="rgb-to-hsl" />
      </div>
    </>
  );
}
