import type { Metadata } from 'next';
import ImageStudio from '@/components/ImageStudio';
import { SITE } from '@/lib/site';
import LearnLink from '@/components/LearnLink';

const title = 'Image resizer';
const description = 'Resize images in bulk in your browser. Pick a longest edge, keep the aspect ratio, no upload and no limit on how many.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/image-resizer` },
  openGraph: { title, description, url: `${SITE.url}/image-resizer` },
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
              name: title,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/image-resizer`,
              description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Resize images</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Pick how long the longest edge should be and everything scales to fit. The aspect ratio is kept, and nothing is ever enlarged.</p>

        <div className="mt-10">
          <ImageStudio mode="resize" />
        </div>

        <LearnLink tool="image-resizer" />
      </div>
    </>
  );
}
