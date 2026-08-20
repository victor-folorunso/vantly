import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DiffChecker from '@/components/DiffChecker';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('diff-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/diff-checker` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/diff-checker` },
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compare two texts</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">See exactly what changed between two versions, line by line and side by side.</p>

        <div className="mt-10">
          <DiffChecker />
        </div>

        <ToolDocs tool="diff-checker" />
      </div>
    </>
  );
}
