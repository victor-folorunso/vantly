import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import WordCounter from '@/components/WordCounter';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('word-counter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/word-counter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/word-counter` },
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
              url: `${SITE.url}/word-counter`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="word-counter" lede="Live counts as you type, including reading time.">Count words and characters</ToolHeader>

        <div className="mt-10">
          <WordCounter />
        </div>

        <ToolDocs tool="word-counter" />
      </div>
    </>
  );
}
