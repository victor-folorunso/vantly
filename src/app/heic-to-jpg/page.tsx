import type { Metadata } from 'next';
import HeicConvert from '@/components/HeicConvert';
import { SITE, TOOLS } from '@/lib/site';
import LearnLink from '@/components/LearnLink';

const tool = TOOLS.find((t) => t.slug === 'heic-to-jpg')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/${tool.slug}` },
  openGraph: {
    title: tool.title,
    description: tool.description,
    url: `${SITE.url}/${tool.slug}`,
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HEIC to JPG converter',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/${tool.slug}`,
  description: tool.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};



export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
          Convert HEIC to JPG or WebP
        </h1>
        <p className="mt-3 text-ink-soft max-w-2xl">
          For the iPhone photos that will not open on Windows. Convert as many as
          you like at once, download them as a zip, and none of them leave your
          computer.
        </p>

        <div className="mt-10">
          <HeicConvert />
        </div>

        <LearnLink tool="heic-to-jpg" />
      </div>
    </>
  );
}
