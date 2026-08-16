import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { UtmBuilder } from '@/components/WebTools';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('utm-builder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/utm-builder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/utm-builder` },
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
              url: `${SITE.url}/utm-builder`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">UTM link builder</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Build a tracked link, and catch the mistakes that split one campaign into four.</p>

        <div className="mt-10">
          <UtmBuilder />
        </div>

        <LearnLink tool="utm-builder" />
      </div>
    </>
  );
}
