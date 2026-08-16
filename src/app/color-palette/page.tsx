import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PaletteTool from '@/components/PaletteTool';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('color-palette')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/color-palette` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/color-palette` },
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Build a colour palette
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Pull the colours out of an image, or grow a full set from one you already have.
        </p>

        <div className="mt-10">
          <PaletteTool />
        </div>

        <LearnLink tool="color-palette" />
      </div>
    </>
  );
}
