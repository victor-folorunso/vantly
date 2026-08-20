import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ColorConverter } from '@/components/ColorTools';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('color-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/color-converter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/color-converter` },
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
              url: `${SITE.url}/color-converter`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Convert a colour</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Pick a colour and read it as hex, RGB, HSL and CMYK at once.</p>

        <div className="mt-10">
          <ColorConverter />
        </div>

        <ToolDocs tool="color-converter" />
      </div>
    </>
  );
}
