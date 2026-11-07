import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { RobotsGenerator } from '@/components/WebTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('robots-txt-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/robots-txt-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/robots-txt-generator` },
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
        <ToolHeader slug="robots-txt-generator" lede="Write a robots.txt without the one line that hides your whole site.">Robots.txt generator</ToolHeader>

        <div className="mt-10">
          <RobotsGenerator />
        </div>

        <ToolDocs tool="robots-txt-generator" />
      </div>
    </>
  );
}
