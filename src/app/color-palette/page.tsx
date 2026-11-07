import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PaletteTool from '@/components/PaletteTool';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('color-palette')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/color-palette` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/color-palette` },
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
              url: `${SITE.url}/color-palette`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="color-palette" lede="Pull the colours out of an image, or grow a full set from one you already have.">Build a colour palette</ToolHeader>

        <div className="mt-10">
          <PaletteTool />
        </div>

        <ToolDocs tool="color-palette" />
      </div>
    </>
  );
}
