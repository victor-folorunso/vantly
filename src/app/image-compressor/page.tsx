import type { Metadata } from 'next';
import ImageStudio from '@/components/ImageStudio';
import { SITE } from '@/lib/site';
import LearnLink from '@/components/LearnLink';

const title = 'Image compressor';
const description = 'Make images smaller without making them look worse. Bulk compression in your browser, no upload, no watermark, no file size limit.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/image-compressor` },
  openGraph: { title, description, url: `${SITE.url}/image-compressor` },
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
              url: `${SITE.url}/image-compressor`,
              description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compress images</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Drop in as many as you like and pull the quality down until the size looks right. It runs in your browser, so there is no upload wait and no limit on how many.</p>

        <div className="mt-10">
          <ImageStudio mode="compress" />
        </div>

        <LearnLink tool="image-compressor" />
      </div>
    </>
  );
}
