import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DiffChecker from '@/components/DiffChecker';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('diff-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/diff-checker` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/diff-checker` },
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
              url: `${SITE.url}/diff-checker`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="diff-checker" lede="See exactly what changed between two versions, line by line and side by side.">Compare two texts</ToolHeader>

        <div className="mt-10">
          <DiffChecker />
        </div>

        <ToolDocs tool="diff-checker" />
      </div>
    </>
  );
}
