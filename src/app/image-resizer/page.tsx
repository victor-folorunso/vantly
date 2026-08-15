import type { Metadata } from 'next';
import ImageStudio from '@/components/ImageStudio';
import { SITE } from '@/lib/site';

const title = 'Image resizer';
const description = 'Resize images in bulk in your browser. Pick a longest edge, keep the aspect ratio, no upload and no limit on how many.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/image-resizer` },
  openGraph: { title, description, url: `${SITE.url}/image-resizer` },
};

const FAQ = [
  { q: 'Why can I only set the longest edge?',
    a: 'Because it is what people actually mean.' },
  { q: 'Can I make an image bigger?',
    a: 'No, and that is deliberate.' },
  { q: 'Does resizing lose quality?',
    a: 'Scaling down is generally clean.' },
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
              url: `${SITE.url}/image-resizer`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Resize images</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Pick how long the longest edge should be and everything scales to fit. The aspect ratio is kept, and nothing is ever enlarged.</p>

        <div className="mt-10">
          <ImageStudio mode="resize" />
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
