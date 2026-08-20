import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('base64-encoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/base64-encoder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/base64-encoder` },
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
              url: `${SITE.url}/base64-encoder`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Base64 encode and decode</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Convert text to Base64 and back.
        </p>

        <div className="mt-10">
          <TextTool preset="base64" outputLabel="Result" />
        </div>

        <ToolDocs tool="base64-encoder" />
      </div>
    </>
  );
}
