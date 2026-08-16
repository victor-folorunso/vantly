import type { Metadata } from 'next';
import HeicConvert from '@/components/HeicConvert';
import { SITE } from '@/lib/site';
import LearnLink from '@/components/LearnLink';

/*
  The same converter as /heic-to-jpg, landing on WebP instead.

  Two routes rather than one with a toggle, because "heic to webp" and "heic to
  jpg" are separate things to search for, and the page is the unit that ranks.
  The person who typed the second one should not arrive and have to change a
  setting to get what they asked for.
*/

const title = 'HEIC to WebP converter';
const description =
  'Convert iPhone HEIC photos to WebP in your browser. Smaller files than JPG at the same quality. Bulk conversion, no upload, no watermark.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/heic-to-webp` },
  openGraph: { title, description, url: `${SITE.url}/heic-to-webp` },
};


const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/heic-to-webp`,
  description,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Convert HEIC to WebP
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          For iPhone photos headed to a website. Smaller than JPG at the same
          quality, converted in bulk, and none of them leave your computer.
        </p>

        <div className="mt-10">
          <HeicConvert initialFormat="webp" />
        </div>

        <LearnLink tool="heic-to-webp" />
      </div>
    </>
  );
}
