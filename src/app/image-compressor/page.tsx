import type { Metadata } from 'next';
import ImageStudio from '@/components/ImageStudio';
import { SITE } from '@/lib/site';

const title = 'Image compressor';
const description = 'Make images smaller without making them look worse. Bulk compression in your browser, no upload, no watermark, no file size limit.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/image-compressor` },
  openGraph: { title, description, url: `${SITE.url}/image-compressor` },
};

const FAQ = [
  { q: 'How much smaller will my images get?',
    a: 'It depends on the picture, but a photo saved as WebP at 75 percent quality is usually 60 to 80 percent smaller than the JPG it came from, and most people cannot tell them apart.' },
  { q: 'Does compressing damage the image?',
    a: 'JPG and WebP are lossy, so information is discarded every time you save.' },
  { q: 'Which format should I choose?',
    a: 'WebP if it is going on a website, since it is meaningfully smaller at the same quality and every current browser reads it.' },
  { q: 'Are my images uploaded?',
    a: 'No.' },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: title,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/image-compressor`,
              description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compress images</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Drop in as many as you like and pull the quality down until the size looks right. It runs in your browser, so there is no upload wait and no limit on how many.</p>

        <div className="mt-10">
          <ImageStudio mode="compress" />
        </div>

        <section className="mt-20 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-7">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
