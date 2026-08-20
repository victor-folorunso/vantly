import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ColorConverter } from '@/components/ColorTools';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('hsl-to-rgb')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/hsl-to-rgb` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/hsl-to-rgb` },
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
            url: `${SITE.url}/hsl-to-rgb`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{tool.description}</p>

        <div className="mt-10">
          <ColorConverter />
        </div>

        <ToolDocs tool="hsl-to-rgb" />
      </div>
    </>
  );
}
