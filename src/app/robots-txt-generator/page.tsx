import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { RobotsGenerator } from '@/components/WebTools';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('robots-txt-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/robots-txt-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/robots-txt-generator` },
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
              url: `${SITE.url}/robots-txt-generator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Robots.txt generator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Write a robots.txt without the one line that hides your whole site.</p>

        <div className="mt-10">
          <RobotsGenerator />
        </div>

        <ToolDocs tool="robots-txt-generator" />
      </div>
    </>
  );
}
